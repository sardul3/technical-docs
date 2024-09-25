To SSH from your Mac to your Linux machine, you’ll need to ensure both machines are set up properly for SSH communication. Here’s a step-by-step guide for setting everything up from scratch:

### On Linux (Mini PC):

1. **Install SSH Server**:
   If SSH is not already installed on your Linux machine, you’ll need to install the OpenSSH server. To do this:
   1. Open a terminal.
   2. Run the following command:
      ```bash
      sudo apt update
      sudo apt install openssh-server
      ```
   3. Once installed, check if the SSH service is running:
      ```bash
      sudo systemctl status ssh
      ```
   4. If SSH is not running, start the service:
      ```bash
      sudo systemctl start ssh
      ```
   5. Ensure the service starts on boot:
      ```bash
      sudo systemctl enable ssh
      ```

2. **Check Your Linux Machine’s IP Address**:
   You’ll need the IP address of the Linux machine to connect from your Mac. To find it:
   1. Open a terminal.
   2. Run the following command:
      ```bash
      ip a
      ```
   3. Look for the section related to your active network interface (e.g., `eth0` for wired or `wlan0` for Wi-Fi) and find the IP address (something like `192.168.x.x`).

### On Mac:

1. **Install OpenSSH (if not already installed)**:
   Most modern macOS systems come with OpenSSH pre-installed, but you can check if it's installed by running:
   ```bash
   ssh -V
   ```
   If it shows a version, you’re good to go. If not, you may need to install it using Homebrew:
   1. Install Homebrew (if you don’t have it):
      ```bash
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
      ```
   2. Install OpenSSH:
      ```bash
      brew install openssh
      ```

2. **Connect to the Linux Machine**:
   1. Open a terminal on your Mac.
   2. Use the SSH command to connect to your Linux machine (replace `user` with your Linux username and `192.168.x.x` with the Linux machine’s IP):
      ```bash
      ssh user@192.168.x.x
      ```
   3. The first time you connect, you may be prompted to accept the server’s fingerprint. Type `yes` and hit Enter.
   4. Enter your Linux user password when prompted.

3. **Configure SSH Key-Based Authentication (Optional but recommended)**:
   To avoid entering the password each time, you can set up SSH keys:
   1. On your Mac, generate an SSH key (if you don’t have one already):
      ```bash
      ssh-keygen -t rsa
      ```
      Press Enter to save the key in the default location (`~/.ssh/id_rsa`).
   2. Copy the SSH public key to your Linux machine:
      ```bash
      ssh-copy-id user@192.168.x.x
      ```
   3. Now, when you SSH, you should be able to connect without needing a password:
      ```bash
      ssh user@192.168.x.x
      ```

### Troubleshooting:

- Ensure both machines are on the same network.
- If the connection fails, check the firewall settings on your Linux machine:
  ```bash
  sudo ufw allow ssh
  sudo ufw enable
  ```

### Details on Public Key Copy from host to remote
After generating the SSH key on your Mac, you need to copy the public key to your Linux machine. This allows you to log into the Linux machine without entering a password each time, enabling key-based authentication. Below are the detailed steps:

### 1. **Generate the SSH Key on Your Mac** (if you haven’t done it already)
If you haven’t generated an SSH key, do it with the following command:

```bash
ssh-keygen -t rsa
```
- **Explanation**:
  - `-t rsa` specifies the type of key (RSA in this case).
- You will be prompted to enter a location to save the key. Press **Enter** to save it in the default location: `~/.ssh/id_rsa`.
- You may also be asked to provide a passphrase for extra security. If you don't want a passphrase, just press **Enter** to leave it blank.

### 2. **View the Generated Public Key**
You’ll now have two files in the `~/.ssh/` directory:
- `id_rsa` (your private key)
- `id_rsa.pub` (your public key)

To confirm the public key, you can view it with:

```bash
cat ~/.ssh/id_rsa.pub
```

### 3. **Copy the SSH Key to Your Linux Machine**
The next step is to copy the public key to your Linux machine. This is where the `ssh-copy-id` command is used.

1. **Make sure SSH is running** on your Linux machine and you have its IP address and username ready.
   - You can check the SSH service with:
     ```bash
     sudo systemctl status ssh
     ```

2. **Copy the Public Key** to the Linux machine:
   
   In your Mac terminal, run the following command (replacing `user` with your Linux username and `192.168.x.x` with your Linux machine’s IP address):

   ```bash
   ssh-copy-id user@192.168.x.x
   ```

   - **Explanation**:
     - `ssh-copy-id` is a convenient command that copies your public key to the Linux machine's `~/.ssh/authorized_keys` file, which is used for authentication.
     - `user@192.168.x.x` is the Linux username and IP address you want to log in to.

3. **Authenticate with Your Password**:
   - You will be asked to enter the password for the Linux user account you are copying the SSH key to. This is necessary just for the first time to authorize the key copy.
   - Once the password is entered, `ssh-copy-id` will automatically add your public key to the Linux machine’s `~/.ssh/authorized_keys` file.

### 4. **Verify SSH Key-Based Authentication**
Now that the public key has been copied to the Linux machine, you can log in without needing a password.

1. From your Mac, try SSHing into the Linux machine again:
   ```bash
   ssh user@192.168.x.x
   ```
   
2. This time, you should be logged in without being prompted for a password.

### 5. **(Optional) Disable Password Authentication** on the Linux Machine
For extra security, you may want to disable password-based SSH logins, ensuring only SSH keys can be used.

1. On the Linux machine, open the SSH configuration file for editing:
   ```bash
   sudo nano /etc/ssh/sshd_config
   ```

2. Find the following lines (uncomment them if needed) and change the values:
   ```
   PasswordAuthentication no
   PermitRootLogin no
   ```
   This disables password logins and root login via SSH.

3. **Restart the SSH service**:
   ```bash
   sudo systemctl restart ssh
   ```

Now, only key-based logins will be allowed, adding an extra layer of security.

### Troubleshooting
- **Permission issues**: Ensure the `~/.ssh/authorized_keys` file on the Linux machine has the correct permissions. Use:
  ```bash
  chmod 600 ~/.ssh/authorized_keys
  ```
  
- **Firewall**: If you're unable to connect, ensure that the firewall on the Linux machine allows SSH:
  ```bash
  sudo ufw allow ssh
  ```

That’s it! You’ve now set up passwordless SSH login using key-based authentication.

### Using **NetworkManager** to manage network connections

It is best to assign a static IP through NetworkManager directly rather than manually editing Netplan files.

Here's how you can assign a static IP using **NetworkManager**:

### Method 1: Using `nmtui` (Text User Interface)

1. **Open the Terminal** on your Linux machine.
   
2. **Launch NetworkManager Text User Interface**:
   ```bash
   sudo nmtui
   ```
   
3. **Select "Edit a connection"**:
   - Use the arrow keys to highlight this option and press **Enter**.

4. **Choose Your Wi-Fi Network**:
   - You should see a list of available network connections (your `wlp3s0` Wi-Fi interface should be listed). Highlight your Wi-Fi connection and press **Enter**.

5. **Set Static IP Address**:
   - In the **Edit Connection** window:
     - Set the **IPv4 Configuration** method to **Manual**.
     - Enter the following details:
       - **Addresses**: The static IP you want to use (e.g., `192.168.1.100`).
       - **Netmask**: Usually `255.255.255.0`.
       - **Gateway**: The IP address of your router (e.g., `192.168.1.1`).
       - **DNS servers**: For example, you can use Google's DNS (`8.8.8.8`).
   
6. **Save the Configuration**:
   - Once you've entered the IP details, move to **OK** using the arrow keys and press **Enter**.
   
7. **Restart the Network**:
   After saving the settings, you can restart the NetworkManager service to apply the changes:
   ```bash
   sudo systemctl restart NetworkManager
   ```

8. **Verify Your IP Address**:
   Check if the static IP has been assigned by running:
   ```bash
   ip a
   ```

### Method 2: Using `nmcli` (Command Line Interface)

If you prefer to work entirely in the command line, you can use the `nmcli` command to set a static IP address.

1. **Check Your Wi-Fi Connection Name**:
   Run the following command to list all available network connections:
   ```bash
   nmcli connection show
   ```
   - Look for the **NAME** of your Wi-Fi connection (likely something like `wlp3s0`).

2. **Set Static IP Address**:
   Replace `wlp3s0` with your actual connection name. For example:
   ```bash
   sudo nmcli con modify wlp3s0 ipv4.method manual ipv4.addresses 192.168.1.100/24 ipv4.gateway 192.168.1.1 ipv4.dns 8.8.8.8
   ```
   - `192.168.1.100/24`: Your desired static IP address and subnet mask.
   - `192.168.1.1`: Your router's IP address (gateway).
   - `8.8.8.8`: DNS server.

3. **Apply the Changes**:
   To bring the connection down and up again to apply the new settings:
   ```bash
   sudo nmcli con down wlp3s0 && sudo nmcli con up wlp3s0
   ```

4. **Verify Your IP Address**:
   Run the following command to ensure the static IP has been assigned:
   ```bash
   ip a
   ```

If everything is configured correctly, your Linux machine should now use a static IP address over Wi-Fi. Let me know if you encounter any issues!

### Easy Access to Remote without typing IP everytime
Updating the **`/etc/hosts`** file or the **SSH config (`~/.ssh/config`)** is useful if you frequently SSH into the same machine. These methods allow you to associate a **hostname** or a **shortcut name** with the IP address of your Linux machine, so you don’t need to remember or type the full IP address each time you SSH.

### 1. **Update the `/etc/hosts` File**

The `/etc/hosts` file allows you to map a hostname (alias) to an IP address. This means you can type the hostname instead of the IP address when you SSH or access the machine.

#### Steps:

1. **Open the Terminal** on your Mac.

2. **Edit the `/etc/hosts` file**:
   - You will need superuser privileges to edit this file. Run the following command:
     ```bash
     sudo nano /etc/hosts
     ```
   - You will be prompted to enter your password.

3. **Add the IP Address and Hostname**:
   - At the bottom of the file, add a line with the new static IP of your Linux machine followed by a hostname (or alias) you want to use. For example:
     ```bash
     192.168.1.100 linuxpc
     ```
   - Replace `192.168.1.100` with the new IP of your Linux machine and `linuxpc` with any alias you prefer.

4. **Save the File**:
   - After adding the line, press **Ctrl + O** to save the file, then press **Enter**. 
   - Press **Ctrl + X** to exit the editor.

5. **Test the Change**:
   - Now, instead of using the IP address to SSH into your Linux machine, you can use the alias (hostname) you just set. For example:
     ```bash
     ssh user@linuxpc
     ```
   - Replace `user` with your Linux username and `linuxpc` with the alias you assigned.

   This way, even if you change the Linux machine's IP again, you can just update the `/etc/hosts` file with the new IP, and the alias (`linuxpc`) will still work.

### 2. **Update the SSH Config File (`~/.ssh/config`)**

The SSH config file allows you to create shortcuts for SSH connections, where you can define specific settings for different hosts (like the IP address, username, port, etc.). This is very useful when you frequently SSH into multiple servers.

#### Steps:

1. **Open the Terminal** on your Mac.

2. **Create/Edit the SSH Config File**:
   - The SSH config file is located in the `~/.ssh` directory. If it doesn't exist, you can create it. Run the following command to open it for editing:
     ```bash
     nano ~/.ssh/config
     ```

3. **Add SSH Configuration for Your Linux Machine**:
   - Add a new entry with the following format:
     ```plaintext
     Host linuxpc
         HostName 192.168.1.100
         User your_username
         Port 22
     ```
     - **Host**: This is the alias or shortcut you want to use for SSH. It can be any name you choose (e.g., `linuxpc`).
     - **HostName**: The actual IP address or hostname of your Linux machine.
     - **User**: Your username on the Linux machine (so you don’t need to type it every time).
     - **Port**: The SSH port (default is `22`). If your SSH server is running on a different port, change this value.

4. **Save the File**:
   - After adding the configuration, press **Ctrl + O** to save the file, then press **Enter**. 
   - Press **Ctrl + X** to exit the editor.

5. **Set Correct Permissions for the Config File**:
   - SSH requires this file to have correct permissions. Run the following command to set the correct permissions:
     ```bash
     chmod 600 ~/.ssh/config
     ```

6. **Test the Change**:
   - Now, you can use the alias to SSH into your Linux machine without typing the full IP and username each time. For example:
     ```bash
     ssh linuxpc
     ```

   - This will automatically use the IP (`192.168.1.100`) and username you specified in the `~/.ssh/config` file.

#### Example of Multiple Hosts in SSH Config:
If you connect to multiple servers, you can add multiple entries in your `~/.ssh/config` file, like so:
```plaintext
Host linuxpc
    HostName 192.168.1.100
    User your_username

Host workserver
    HostName 203.0.113.10
    User your_work_username
    Port 2222
```
- In this example, you can SSH into `linuxpc` or `workserver` with simple commands:
  ```bash
  ssh linuxpc
  ssh workserver
  ```

### Summary:
- **Updating `/etc/hosts`** allows you to map a custom hostname (alias) to the IP address, so you can use the alias instead of the IP when connecting via SSH or accessing the machine on the network.
- **Updating `~/.ssh/config`** allows you to create SSH shortcuts and store specific settings like username, IP address, and port, making it easier to SSH into frequently accessed machines.

These methods save you time and prevent you from having to remember or type IP addresses repeatedly.


### Save Passphrase to Mac KeyChain for easy access
You can save the passphrase for your SSH key to avoid entering it every time you use the key for authentication. The most common way to achieve this is by using an **SSH agent**, which stores your passphrase in memory for the duration of your session.

Here’s how you can set this up on macOS:

### 1. **Start the SSH Agent**
   The SSH agent is usually started by default on macOS, but you can ensure it’s running by starting it manually.

   Open your terminal and run:
   ```bash
   eval "$(ssh-agent -s)"
   ```

   This will start the SSH agent and return the process ID (PID), indicating that it's running.

### 2. **Add Your SSH Private Key to the Agent**
   Once the SSH agent is running, you need to add your private key to it. This allows the agent to cache the key and manage the passphrase for you.

   To add your private key:
   ```bash
   ssh-add ~/.ssh/id_rsa
   ```

   - Replace `~/.ssh/id_rsa` with the path to your private key if it’s located somewhere else.

   You will be prompted to enter your passphrase one last time. After that, the agent will store the passphrase for the duration of your session, so you won’t have to enter it again.

### 3. **Configure SSH to Automatically Use the Agent**

   To make the SSH agent automatically load your key when the system starts, you can modify or create a configuration file:

   1. **Open or create the SSH config file**:
      ```bash
      nano ~/.ssh/config
      ```

   2. **Add the following lines**:
      ```plaintext
      Host *
          AddKeysToAgent yes
          UseKeychain yes
          IdentityFile ~/.ssh/id_rsa
      ```

      - `AddKeysToAgent yes`: This tells SSH to automatically add keys to the agent.
      - `UseKeychain yes`: On macOS, this stores the passphrase in the macOS Keychain.
      - `IdentityFile ~/.ssh/id_rsa`: Specifies the location of your private key. Change the path if your key is located elsewhere.

   3. **Save and close the file** by pressing **Ctrl + O** to save and **Ctrl + X** to exit.

### 4. **Store the Passphrase in macOS Keychain**
   macOS allows you to store your SSH key passphrase in the Keychain, so you don’t need to enter it again after rebooting. You can do this by using the `ssh-add` command with the `-K` option (on older macOS versions) or simply by following the steps above (`UseKeychain yes`).

   To store the passphrase in the macOS Keychain:
   ```bash
   ssh-add --apple-use-keychain ~/.ssh/id_rsa
   ```

   - After running this command, the passphrase will be saved to the Keychain, so you won’t need to enter it again for future logins.

   On **macOS Monterey (12.x)** and later, `ssh-add` automatically uses the Keychain without needing the `-K` option.

### 5. **Verify SSH Key is Loaded**

   To check that your key has been successfully added to the agent, run:
   ```bash
   ssh-add -l
   ```

   This will list the keys currently loaded in the SSH agent. You should see your key listed here.

### 6. **Restarting the SSH Agent Automatically**

   To ensure your keys are automatically loaded into the SSH agent on system startup, you can add the following to your shell’s configuration file (`.bash_profile`, `.zshrc`, etc.):

   1. **Open your shell’s config file**:
      For example, if you are using `zsh`:
      ```bash
      nano ~/.zshrc
      ```

   2. **Add the following lines**:
      ```bash
      eval "$(ssh-agent -s)"
      ssh-add -A
      ```

      - `ssh-add -A`: Automatically adds all identities stored in the macOS Keychain to the SSH agent when a new session is started.

   3. **Save and close the file**.

   Now, every time you start a new terminal session or log into your Mac, the SSH agent will automatically start, and your keys will be loaded from the Keychain.

---

By following these steps, you’ll avoid having to enter the passphrase for your SSH key every time you SSH into a machine, without compromising the security of your key.