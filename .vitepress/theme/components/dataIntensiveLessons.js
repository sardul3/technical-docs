export const dataIntensiveLessons = [
    {
      id: 1,
      title: "Scalability: Horizontal vs. Vertical",
      content: "Scalability refers to the system’s ability to handle increasing workloads. Horizontal scalability involves adding more machines to your system, while vertical scalability means upgrading the hardware of a single machine.",
      codeToAvoid: `
  \`\`\`text
  # Vertical scaling
  Upgrade existing server from 16GB to 64GB of RAM and faster CPUs.
  \`\`\`
      `,
      codeToPrefer: `
  \`\`\`text
  # Horizontal scaling
  Add more machines to the cluster to distribute the workload across nodes.
  \`\`\`
      `,
      benefits: [
        "Horizontal scaling offers better fault tolerance and can handle larger workloads.",
        "Reduces the risk of a single point of failure.",
        "Improves the system's ability to handle unpredictable spikes in traffic."
      ]
    },
    {
      id: 2,
      title: "Consistency, Availability, and Partition Tolerance (CAP Theorem)",
      content: "The CAP theorem states that in the event of a network partition, you can choose either consistency or availability, but not both.",
      codeToAvoid: `
  \`\`\`text
  # Incorrect assumption
  Assume you can have both perfect consistency and high availability during network partitions.
  \`\`\`
      `,
      codeToPrefer: `
  \`\`\`text
  # Understand trade-offs
  Choose either consistency or availability based on application needs.
  For example:
  - Consistency: Databases like HBase, MongoDB (in specific modes)
  - Availability: DynamoDB, Couchbase
  \`\`\`
      `,
      benefits: [
        "Helps in choosing the right database systems based on business requirements.",
        "Encourages designing applications with the right trade-offs in mind."
      ]
    },
    {
      id: 3,
      title: "Batch vs. Stream Processing",
      content: "Batch processing handles large datasets at scheduled intervals, while stream processing deals with real-time data flow and provides results as soon as data is available.",
      codeToAvoid: `
  \`\`\`text
  # Batch processing for real-time use cases
  Run a batch job every 6 hours for real-time data analytics.
  \`\`\`
      `,
      codeToPrefer: `
  \`\`\`text
  # Stream processing for real-time use cases
  Use systems like Apache Kafka or Apache Flink to process data in real-time.
  \`\`\`
      `,
      benefits: [
        "Batch processing is ideal for high-throughput, less time-sensitive jobs.",
        "Stream processing is better suited for real-time analytics and fast reaction times."
      ]
    },
    {
      id: 4,
      title: "Data Replication: Leader-Follower",
      content: "Replication ensures availability and fault tolerance by copying data across multiple nodes. The leader-follower model involves one leader node receiving all write requests and propagating changes to follower nodes.",
      codeToAvoid: `
  \`\`\`text
  # Single point of failure
  Use a single database server for both reads and writes.
  \`\`\`
      `,
      codeToPrefer: `
  \`\`\`text
  # Leader-follower model
  - Leader handles all write operations.
  - Followers replicate data from the leader and handle read operations.
  \`\`\`
      `,
      benefits: [
        "Improves read scalability by offloading read requests to followers.",
        "Increases fault tolerance, as followers can take over if the leader fails."
      ]
    },
    {
      id: 5,
      title: "Partitioning (Sharding) Data",
      content: "Partitioning splits large datasets across multiple machines, distributing the data in a way that allows the system to handle larger workloads by breaking down the dataset into smaller, more manageable parts.",
      codeToAvoid: `
  \`\`\`text
  # No partitioning
  Store all data on a single machine or node.
  \`\`\`
      `,
      codeToPrefer: `
  \`\`\`text
  # Partitioning strategy
  - Hash-based partitioning: Distribute data based on a hash of a key (e.g., userID).
  - Range-based partitioning: Split data into ranges based on a key (e.g., date range).
  \`\`\`
      `,
      benefits: [
        "Allows the system to scale horizontally by adding more nodes.",
        "Enables more balanced load distribution across nodes."
      ]
    },
    {
      id: 6,
      title: "Indexes: Speeding Up Queries",
      content: "Indexes allow databases to quickly locate the data without scanning the entire dataset, improving read performance at the cost of slower writes and higher storage overhead.",
      codeToAvoid: `
  \`\`\`text
  # No indexing
  Perform full table scans to find the necessary data.
  \`\`\`
      `,
      codeToPrefer: `
  \`\`\`text
  # Use indexes
  - Create indexes on columns frequently queried, such as userID or timestamps.
  - Use composite indexes for queries involving multiple columns.
  \`\`\`
      `,
      benefits: [
        "Improves query performance significantly by avoiding full table scans.",
        "Optimizes read-heavy workloads."
      ]
    },
    {
      id: 7,
      title: "Concurrency Control: Optimistic vs. Pessimistic Locking",
      content: "Concurrency control is essential when multiple transactions attempt to modify the same data at the same time. Optimistic locking assumes that conflicts are rare, while pessimistic locking assumes conflicts are likely and locks data preemptively.",
      codeToAvoid: `
  \`\`\`text
  # No concurrency control
  Allow multiple transactions to modify the same data without locks.
  \`\`\`
      `,
      codeToPrefer: `
  \`\`\`text
  # Choose appropriate concurrency control
  - Optimistic locking: Check for conflicts only at the time of commit (e.g., version numbers).
  - Pessimistic locking: Lock the data at the start of the transaction to prevent conflicts.
  \`\`\`
      `,
      benefits: [
        "Optimistic locking works well in low-contention environments.",
        "Pessimistic locking is better suited for high-contention environments where conflicts are frequent."
      ]
    },
    {
      id: 8,
      title: "Fault Tolerance: Retry and Backoff",
      content: "Fault tolerance involves designing systems that can recover from failures gracefully. Retries with exponential backoff are a common technique to handle transient errors like network issues.",
      codeToAvoid: `
  \`\`\`text
  # No retry mechanism
  Fail immediately on a network error.
  \`\`\`
      `,
      codeToPrefer: `
  \`\`\`text
  # Retry with backoff
  Implement retry logic with exponential backoff (e.g., retry after 1s, 2s, 4s, etc.).
  \`\`\`
      `,
      benefits: [
        "Improves fault tolerance by giving transient failures time to resolve.",
        "Prevents overwhelming the system with immediate retry attempts."
      ]
    },
    {
      id: 9,
      title: "Distributed Transactions and Two-Phase Commit",
      content: "In distributed systems, a two-phase commit ensures that either all participating nodes commit their changes, or none do, preventing partial commits.",
      codeToAvoid: `
  \`\`\`text
  # No coordination
  Allow partial commits in distributed transactions.
  \`\`\`
      `,
      codeToPrefer: `
  \`\`\`text
  # Two-phase commit protocol
  1. Prepare phase: Each node ensures it can commit.
  2. Commit phase: If all nodes agree, commit the transaction.
  \`\`\`
      `,
      benefits: [
        "Prevents inconsistencies in distributed systems.",
        "Ensures atomicity across multiple nodes."
      ]
    },
    {
      id: 10,
      title: "Event Sourcing and CQRS",
      content: "Event sourcing captures changes to an application's state as a sequence of events, while CQRS (Command Query Responsibility Segregation) separates read and write concerns to optimize scalability and performance.",
      codeToAvoid: `
  \`\`\`text
  # Traditional CRUD
  Perform reads and writes on the same database model.
  \`\`\`
      `,
      codeToPrefer: `
  \`\`\`text
  # Event sourcing and CQRS
  - Use event logs to capture all changes to state.
  - Separate read and write models to optimize performance.
  \`\`\`
      `,
      benefits: [
        "Improves scalability by separating concerns.",
        "Provides a complete history of changes through event sourcing."
      ]
    },
    {
        "id": 11,
        "title": "Data Locality: Bringing Computation to Data",
        "content": "Data locality is the concept of minimizing data movement across the network by moving computation closer to where the data resides. This is crucial for optimizing performance in large-scale distributed systems.",
        "codeToAvoid": "Move large data sets across network for processing at a central location.",
        "codeToPrefer": "Perform computation at the nodes where data is stored, e.g., using MapReduce frameworks like Hadoop or Spark.",
        "benefits": [
          "Reduces network overhead",
          "Improves processing speed by avoiding data transfer bottlenecks",
          "Scales efficiently with large data sets"
        ]
      },
      {
        "id": 12,
        "title": "Materialized Views",
        "content": "A materialized view is a precomputed query result that is stored for later use, improving performance for read-heavy workloads by avoiding expensive query recalculations.",
        "codeToAvoid": "Recompute the result of a complex query every time it is needed.",
        "codeToPrefer": "Use a materialized view to store the precomputed result and refresh it periodically as the underlying data changes.",
        "benefits": [
          "Improves query performance",
          "Reduces database load for frequently accessed complex queries",
          "Provides near real-time results with efficient updates"
        ]
      },
      {
        "id": 13,
        "title": "Data Encoding and Serialization Formats",
        "content": "Choosing the right encoding format (e.g., JSON, Avro, Protobuf) for data serialization is essential for balancing between human readability, performance, and space efficiency.",
        "codeToAvoid": "Use human-readable formats like JSON or XML in performance-sensitive systems.",
        "codeToPrefer": "Use compact binary formats like Avro or Protobuf in high-performance systems that prioritize efficiency over readability.",
        "benefits": [
          "Improves serialization/deserialization speed",
          "Reduces the size of data transmitted or stored",
          "Enhances performance for large-scale data systems"
        ]
      },
      {
        "id": 14,
        "title": "Schema Evolution in Data Systems",
        "content": "When working with evolving data, especially in distributed systems, schema evolution allows changing the structure of the data without breaking compatibility with older versions.",
        "codeToAvoid": "Make breaking changes to data schemas without considering backward compatibility.",
        "codeToPrefer": "Use schema evolution strategies (e.g., Avro's schema compatibility rules) that allow adding new fields or making optional changes while maintaining backward compatibility.",
        "benefits": [
          "Enables smooth updates to systems without breaking older data formats",
          "Supports backward compatibility with older versions of the schema",
          "Improves maintainability and flexibility of evolving data models"
        ]
      },
      {
        "id": 15,
        "title": "Event-Driven Architectures",
        "content": "Event-driven architectures use events to trigger processes or workflows. This is an essential pattern in distributed systems for decoupling services and improving scalability.",
        "codeToAvoid": "Use tightly coupled synchronous communication between services for every operation.",
        "codeToPrefer": "Adopt an event-driven architecture where services communicate via events and message queues, allowing asynchronous and decoupled interaction.",
        "benefits": [
          "Improves scalability and fault tolerance",
          "Decouples services, allowing independent scaling and deployment",
          "Enables real-time data processing and reactions to system changes"
        ]
      },
      {
        "id": 16,
        "title": "Idempotency in Distributed Systems",
        "content": "In distributed systems, ensuring idempotency means that performing the same operation multiple times produces the same result. This is crucial for handling retries and failures gracefully.",
        "codeToAvoid": "Allow non-idempotent operations (e.g., incrementing a counter) without safeguards, leading to inconsistent states on retries.",
        "codeToPrefer": "Design APIs and operations to be idempotent by ensuring that the same request produces the same outcome even if it's executed multiple times.",
        "benefits": [
          "Ensures system reliability in case of retries or failures",
          "Prevents data inconsistencies in distributed environments",
          "Improves fault tolerance and recovery mechanisms"
        ]
      },
      {
        "id": 17,
        "title": "Dataflow Systems",
        "content": "Dataflow systems such as Apache Beam or Flink process data by defining a series of transformations on data streams or batches. This architecture supports both batch and stream processing in a unified model.",
        "codeToAvoid": "Separate systems for handling batch and stream data processing, leading to complexity and redundancy.",
        "codeToPrefer": "Use a unified dataflow model to process both streams and batches, enabling flexibility and simplification of the architecture.",
        "benefits": [
          "Simplifies architecture by unifying batch and stream processing",
          "Increases flexibility to handle various data workloads",
          "Allows for more efficient and reusable data pipelines"
        ]
      },
      {
        "id": 18,
        "title": "Leader Election",
        "content": "Leader election is the process where nodes in a distributed system elect one node to act as the leader or coordinator for a task. Ensuring robust leader election is critical in distributed systems for coordinating tasks and ensuring consistency.",
        "codeToAvoid": "Allow multiple nodes to act as leaders, causing conflicts or inconsistent decisions.",
        "codeToPrefer": "Implement leader election algorithms (e.g., Paxos or Raft) to elect a single leader and ensure coordination in distributed systems.",
        "benefits": [
          "Prevents conflicts and ensures coordinated actions across nodes",
          "Improves system consistency and reliability",
          "Enables fault-tolerant coordination mechanisms"
        ]
      }
  ];
  
  