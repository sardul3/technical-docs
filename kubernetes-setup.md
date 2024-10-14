
Setting up a Kubernetes (K8s) cluster as a beginner can feel daunting, but breaking it down step by step makes it much more manageable. I’ll provide detailed explanations, alternatives, and reasons for each tool and choice. We’ll cover:

1. **Understanding Kubernetes basics**
2. **Cluster setup with `kubeadm`**
3. **Networking setup**
4. **Storage setup**
5. **Ingress (for exposing apps)**
6. **CI/CD, monitoring, and logging**
7. **Hosting a simple app**

Let’s dive in.

---

##  **Understanding Kubernetes Basics**
Kubernetes is a platform that automates the management of containerized applications across a cluster of machines (nodes). There are two main types of nodes:
- **Control Plane (Master):** Manages the overall cluster (scheduling, scaling, networking, etc.)
- **Worker Nodes:** Run the actual workloads (containers/apps) and are controlled by the Control Plane.

- **Why N1 for Control Plane?**  
   We selected **N1** because Kubernetes control plane components (API server, etcd, controller manager) need sufficient memory and CPU for scheduling tasks and maintaining the cluster state. N1’s specs ensure stability.

- **Why N3 for Storage?**  
   N3’s additional storage (2TB) is great for hosting Persistent Volume Claims (PVCs), databases, and MiniIO (object storage), making it an ideal worker for storage-heavy services.

---

##  **Setting up the Kubernetes Cluster using `kubeadm`**

#### a. **Prerequisites**

- **OS**: Use Ubuntu 22.04 LTS or CentOS 8 on all nodes.
- **Basic setup**: Ensure all nodes are on the same private network and can communicate via SSH.

- **Install Docker (Container Runtime)**: Kubernetes uses containers to run workloads, and Docker is a container runtime.
  1. On each node, run:
     ```bash
     sudo apt-get update
     sudo apt-get install -y docker.io
     sudo systemctl enable docker
     sudo systemctl start docker
     ```

##  **Installing Kubernetes Components (`kubeadm`, `kubelet`, `kubectl`)**

1. **Add Kubernetes repository:**
   Run these commands on all three nodes (N1, N2, and N3):
   ```bash
   sudo apt-get update
   sudo apt-get install -y apt-transport-https ca-certificates curl
    curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
    echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list   sudo apt-get update
   sudo apt-get install -y kubelet kubeadm kubectl
   sudo apt-mark hold kubelet kubeadm kubectl
   ```
   ##### Command Breakdown(s)
   ```bash
   sudo apt-get install -y apt-transport-https ca-certificates curl
   ```

   -    This command installs three important packages:

        -   `apt-transport-https`: 
            Enables apt to communicate with repositories over HTTPS. Kubernetes packages are served via HTTPS, so this is required.
        - `ca-certificates`: 
            Contains certificates for trusted Certificate Authorities (CA), ensuring secure connections.
        - `curl`: 
            A command-line tool used to transfer data from or to a server. We'll use it to download the GPG key for the Kubernetes repository.


2. **What’s what:**
   - **kubeadm**: The tool to bootstrap a Kubernetes cluster.
   - **kubelet**: The service that runs on all nodes, managing container workloads.
   - **kubectl**: A command-line tool to interact with the cluster.

##  **Initialize Control Plane on N1**

1. **Initialize the control plane on N1 (master node):**
   ```bash
   sudo kubeadm init --pod-network-cidr=192.168.0.0/16
   ```
   - **Why `pod-network-cidr`?** This specifies the IP address range for pods (containers) running in the cluster. Different networking plugins require this (more on this below).
   
   **After a successful initialization:**
   2. **Set up `kubectl` for local user:**
      ```bash
      mkdir -p $HOME/.kube
      sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
      sudo chown $(id -u):$(id -g) $HOME/.kube/config
      ```

   **What’s happening?**  
   This configures `kubectl` (the Kubernetes command-line tool) to communicate with your new cluster from N1.

####  **Join N2 and N3 as Worker Nodes**

1. **Generate a join command on N1:**
   ```bash
   kubeadm token create --print-join-command
   ```
   - This will give you a command like:
     ```bash
     kubeadm join <MASTER_IP>:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>
     ```

2. **Run this command on N2 and N3 to join them to the cluster**:
   ```bash
   sudo kubeadm join <MASTER_IP>:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>
   ```

---

###  **Networking Setup (Pod Communication)**

#### **Choose a Networking Plugin (CNI)**

Kubernetes needs a Container Networking Interface (CNI) plugin to allow pods to communicate with each other across nodes.

- **Why Calico?**  
   - **Calico** is a robust, scalable, and feature-rich CNI plugin.
   - **Alternatives**:
     - **Flannel**: Simpler but lacks security features.
     - **Weave**: Good for small clusters but not as scalable as Calico.
   - **Best Choice**: Calico for production-grade clusters.

#### Install Calico on N1:
```bash
kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml
```
This deploys Calico networking across all nodes.

---

##  **Storage Setup**

For persistent data (databases, files, etc.), Kubernetes uses **Persistent Volumes (PV)** and **Persistent Volume Claims (PVC)**. These can be backed by different storage solutions:

- **Why NFS and MiniIO?**
  - **NFS (Network File System)** is easy to set up and can share storage across nodes.
  - **MiniIO** provides object storage, similar to Amazon S3, but self-hosted.
  - **Alternatives**:
    - **Ceph**: Good for distributed storage but complex to set up.
    - **Longhorn**: Simplifies management, but MiniIO offers better object storage flexibility.

####  **Set up NFS (on N3)**

1. **Install NFS server**:
   ```bash
   sudo apt-get install nfs-kernel-server
   sudo mkdir -p /srv/nfs/kubedata
   sudo chown nobody:nogroup /srv/nfs/kubedata
   sudo chmod 777 /srv/nfs/kubedata
   ```

2. **Configure export rule (NFS server)**:
   ```bash
   sudo nano /etc/exports
   ```
   Add:
   ```
   /srv/nfs/kubedata <worker_nodes_IP>(rw,sync,no_subtree_check)
   ```

3. **Start NFS**:
   ```bash
   sudo exportfs -a
   sudo systemctl restart nfs-kernel-server
   ```

####  **Set up MiniIO (on N3)**

1. **Install MiniIO**:
   ```bash
   wget https://dl.min.io/server/minio/release/linux-amd64/minio
   chmod +x minio
   ./minio server /mnt/data
   ```
   - Access via browser: `http://<N3_IP>:9000`
   
---

##  **Ingress Controller (For Exposing Apps)**

Kubernetes does not expose services to the internet by default. To expose apps, you need an **Ingress Controller**.

- **Why Nginx Ingress?**  
   - Nginx is the most popular and well-supported ingress controller.
   - **Alternatives**:
     - **Traefik**: Easier setup, but Nginx has more features and community support.
   - **Best Choice**: Nginx for robust ingress routing.

#### Install Nginx Ingress:
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
```

---

##  **CI/CD Tools Setup**

- **Why Jenkins?**
  - Jenkins is widely used, with vast plugin support.
  - **Alternatives**:
    - **GitLab CI**: Integrated Git and CI/CD, but more complex to self-host.
    - **ArgoCD**: GitOps-based, simpler than Jenkins, but limited flexibility.
  - **Best Choice**: Jenkins for broader support and more flexibility.

#### Install Jenkins with Helm:
```bash
helm repo add jenkinsci https://charts.jenkins.io
helm install jenkins jenkinsci/jenkins
```

---

##  **Monitoring and Logging**

- **Why Prometheus and Grafana?**
  - **Prometheus**: Best tool for time-series monitoring.
  - **Grafana**: Ideal for visualizing metrics.
  - **Alternatives**:
    - **ELK stack**: Good for logs, but Prometheus + Grafana offer better observability.
  - **Best Choice**: Prometheus and Grafana for easy integration.

#### Install Prometheus and Grafana:
```bash
helm install prometheus prometheus-community/prometheus
helm install grafana grafana/grafana
```

---

##  **Deploying a Simple App and Exposing it**

#### Deploy an Nginx App:
```bash
kubectl create deployment nginx --image=nginx
kubectl expose deployment nginx --port=80 --type=NodePort
```

## Set Up Ingress for Your App:
```yaml




apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nginx-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: myapp.sardul3.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nginx
            port:
              number: 80
```

---

## Summary and Tips:

- **Cluster Design Tips:**
  - Always keep the control plane on a dedicated node.
  - For persistent storage, choose the node with the most storage capacity.
  - Start small with tools like Jenkins and Prometheus, and scale as needed.
  
- **Gotchas to Watch For:**
  - **Networking Issues:** Ensure all nodes can communicate with each other.
  - **Resources:** Kubernetes is resource-hungry, monitor your node resources using Prometheus.
  
- **Best Practices:**
  - Use Helm to manage application deployments.
  - Secure your cluster with tools like Falco (for intrusion detection).
  - Enable RBAC (Role-Based Access Control) for secure access management.

By following these steps and explanations, you’ll have a production-grade, yet simple, Kubernetes cluster that is flexible and scalable!