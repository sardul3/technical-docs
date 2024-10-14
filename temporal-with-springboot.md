

Here’s a **checklist** of **DOs and DON'Ts** when working with Temporal in a Spring Boot application, specifically focusing on code practices to follow:

## **DOs**

#### 1. **DO Use Temporal's Workflow Time API**
   - **Use `Workflow.currentTimeMillis()` or `Workflow.currentDateTime()`** instead of `System.currentTimeMillis()` or `LocalDateTime.now()`. This ensures deterministic behavior in workflows.
   
   ```java
   long currentTime = Workflow.currentTimeMillis();
   ```

#### 2. **DO Keep Workflow Code Deterministic**
   - Ensure that the code inside workflows is deterministic (i.e., it should produce the same results on re-execution).
   - **Avoid non-deterministic operations like**:
     - Current system time (`System.currentTimeMillis()`).
     - Random numbers (`Math.random()`).
     - System calls, file I/O, and database calls inside workflows.

#### 3. **DO Encapsulate Non-Deterministic Code in Activities**
   - Put any non-deterministic code, such as HTTP requests, database calls, or system-dependent actions (e.g., reading files), inside activities rather than workflows.

   ```java
   @ActivityMethod
   public String fetchFromAPI(String url);
   ```

#### 4. **DO Define Activities and Workflows as Interfaces**
   - Always define workflows and activities as **interfaces** and provide their implementation separately.

   ```java
   public interface MyWorkflow {
       @WorkflowMethod
       String process(String input);
   }

   public interface MyActivities {
       @ActivityMethod
       String fetchData(String input);
   }
   ```

#### 5. **DO Use Retry Policies**
   - Define retry policies for activities to handle failures gracefully. Use Temporal’s built-in retry mechanism for activities.

   ```java
   RetryOptions retryOptions = RetryOptions.newBuilder()
           .setInitialInterval(Duration.ofSeconds(1))
           .setMaximumAttempts(5)
           .build();
   
   ActivityOptions options = ActivityOptions.newBuilder()
           .setRetryOptions(retryOptions)
           .build();
   ```

#### 6. **DO Use Spring Beans in Activities**
   - Since activities are normal Java classes, they can take advantage of Spring Boot features like dependency injection.
   
   ```java
   @Service
   public class MyActivitiesImpl implements MyActivities {
       @Autowired
       private MyService myService;
       
       @Override
       public String fetchData(String input) {
           return myService.process(input);
       }
   }
   ```

#### 7. **DO Handle Workflow Versioning**
   - Use versioning when making backward-incompatible changes to workflows to ensure that workflows already in progress continue functioning.

   ```java
   int version = Workflow.getVersion("myChange", Workflow.DEFAULT_VERSION, 2);
   if (version == Workflow.DEFAULT_VERSION) {
       // Old behavior
   } else {
       // New behavior
   }
   ```

#### 8. **DO Use Signals and Queries for Communication**
   - **Signals** can be used to send external input into running workflows asynchronously.
   - **Queries** can be used to fetch the current state of a workflow without modifying its execution.

   ```java
   @SignalMethod
   void notifyOfEvent(String eventName);
   
   @QueryMethod
   String getCurrentStatus();
   ```

#### 9. **DO Use Workflow Futures and Promises for Async Operations**
   - Temporal supports asynchronous operations within workflows using **Futures** and **Promises**. Utilize these for parallel execution of activities.

   ```java
   Promise<String> future = Async.function(myActivities::fetchData, input);
   String result = future.get();
   ```

#### 10. **DO Use `Workflow.newActivityStub()` to Create Activity Stubs**
   - Always use `Workflow.newActivityStub()` to create activity stubs inside workflows. This ensures Temporal can track and manage the activity’s lifecycle.

   ```java
   MyActivities activities = Workflow.newActivityStub(MyActivities.class, options);
   ```

#### 11. **DO Leverage Spring Boot Configuration for Temporal Settings**
   - Use Spring Boot configuration to manage properties such as Temporal service URLs, namespaces, and worker configurations through `application.properties` or `application.yml`.

   ```yaml
   temporal:
     namespace: "default"
     service-url: "localhost:7233"
   ```

---

## **DON'Ts**

#### 1. **DON’T Use Non-Deterministic APIs in Workflows**
   - Avoid using APIs like `System.currentTimeMillis()`, `Math.random()`, `Thread.sleep()`, or any form of system interaction in workflow code.
   - These will break Temporal’s replay mechanism and lead to unexpected behavior.

#### 2. **DON’T Perform Blocking Calls in Workflows**
   - Never use blocking calls like `Thread.sleep()` or I/O operations in workflows. Use Temporal’s built-in timers instead.

   ```java
   Workflow.sleep(Duration.ofMinutes(10));
   ```

#### 3. **DON’T Call Activities Directly in the Workflow Implementation**
   - Never directly call activity implementations inside workflows. Always invoke activities via their stubs. This allows Temporal to handle retries, failures, and task distribution.

   ```java
   // Incorrect
   MyActivitiesImpl activities = new MyActivitiesImpl();
   activities.fetchData(input);
   
   // Correct
   MyActivities activities = Workflow.newActivityStub(MyActivities.class, options);
   ```

#### 4. **DON’T Modify Global Variables or States in Workflows**
   - Avoid modifying global or shared states within workflows, as this can introduce non-deterministic behavior.
   
   ```java
   // Avoid modifying global/static variables
   static int counter = 0; 
   
   @WorkflowMethod
   public void execute() {
       counter++;  // This introduces non-determinism
   }
   ```

#### 5. **DON’T Use External Libraries that Depend on System Time or Threading**
   - Avoid using libraries that rely on system time, multi-threading, or other non-deterministic operations. These can break the deterministic nature of workflows.

#### 6. **DON’T Assume Activity and Workflow Code Will Run on the Same Machine**
   - Temporal workflows and activities may run on different machines. Avoid any direct resource sharing or assuming a shared environment between them.

#### 7. **DON’T Use Exception Handling to Control Workflow Flow**
   - Avoid using exceptions for normal workflow logic flow control. Use Temporal’s retry and failure mechanisms instead to handle errors properly.

#### 8. **DON’T Overuse Workflow Sleep**
   - Avoid excessive use of `Workflow.sleep()` for polling or waiting. Instead, consider using activities for waiting on external conditions or events, or leverage **signals**.

#### 9. **DON’T Hardcode Workflow and Activity Configurations**
   - Avoid hardcoding activity timeout or retry policies in the workflow. Use Spring configuration files or pass them through constructors to make your workflows flexible.

   ```yaml
   temporal:
     activities:
       default-retry:
         initial-interval: 1s
         max-attempts: 3
   ```

#### 10. **DON’T Forget to Test Workflows and Activities Separately**
   - Always test workflows and activities in isolation. Temporal provides testing frameworks like `TestWorkflowEnvironment` that let you simulate workflow execution without depending on the actual Temporal service.

---

## **Conclusion:**
Following these **DOs and DON'Ts** ensures that your Temporal workflows and activities remain deterministic, scalable, and maintainable within a **Spring Boot** environment. By leveraging Temporal’s features and best practices, you can build highly reliable distributed systems that are easier to manage and debug.


## Durable Execution with Temporal Replay

**Step-by-Step Workflow Execution**
- The workflow execution begins by combining code from the workflow definition with an input request (e.g., customer details and pizza order).
- Temporal logs events such as workflow execution started, workflow tasks scheduled, and activity tasks scheduled.
  
**Worker and Cluster Interaction**
- A worker accepts tasks from the queue, and it pulls these tasks to execute step-by-step code.
- Commands such as requesting activity execution are issued by the worker to the Temporal cluster.
  
**Handling Workflow Crashes and Recovery via Replay**
- The video simulates a worker crash during workflow execution and explains how Temporal handles state recovery through replay.
- Temporal uses event history to restore the workflow's previous state, ensuring that it matches the pre-crash execution.

**Replay Mechanism and Determinism**
- Temporal's workflow replay mechanism relies on event history to restore variable states, meaning the workflow can resume execution as if the crash never occurred.
- Temporal ensures workflows are deterministic by suppressing duplicated log outputs during replay, eliminating any discrepancies.
  
**Conclusion**
- The replay mechanism guarantees that workflows maintain the same state before and after a crash.
- Temporal logs the final "workflow execution completed" event, ensuring durable execution.


## Understanding Temporal Workflow Determinism

**Introduction to Workflow Determinism**
- what it means for Temporal workflow code to be deterministic and why this is crucial for Temporal's operations?
- Temporal requires that workflows behave deterministically, meaning they should produce the same output given the same input every time.

**Temporal Workflow Execution**
- As the worker executes workflow code, it issues commands to the Temporal cluster to perform actions like executing activities or starting timers.
- Temporal keeps an event history for each workflow execution, where specific commands (e.g., scheduling a task or starting a timer) correspond to events in the history.

**History Replay and Determinism**
- History replay allows Temporal to recover the state of a workflow after a worker crash or other interruptions.
- During replay, workers check if commands match the corresponding events in the history. If a mismatch occurs, a non-deterministic error is triggered, making it impossible to restore the workflow state.

**Example of Non-Deterministic Workflow**
- Consider a non-deterministic error with a workflow that uses a random number generator.
- In one execution, the random number generates "84," leading to the next line being executed. However, during replay, the random number generates "14," causing a different path to be taken.
- This mismatch in the sequence of commands results in a non-deterministic error, as the worker cannot align the commands with the event history.

## Importance of Determinism
- For Temporal to guarantee durable workflow execution, the workflow must always produce the same sequence of commands for a given input.
- Non-determinism, such as using random values, can disrupt this process and cause errors during workflow recovery.

**Examples of Changes That May Lead to Non-Deterministic Errors**
- Adding or removing an Activity
- Switching the Activity Type used in a call to an Activity Method
- Adding or removing a Timer
- Altering the execution order of Activities or Timers relative to one another

**Examples of Changes That Do Not Lead to Non-Deterministic Errors**
- Modifying statements in a Workflow Definition, such as logging statements, that do not affect the Commands generated during Workflow Execution
- Changing attributes in a ActivityOptions or RetryPolicy
- Modifying code inside of an Activity Definition



## Overview of Temporal
- **Temporal**: Open-source durable execution system for scalable and reliable applications.
- **Key Features**: Supports recovery from crashes, state reconstruction using History Replay, and deterministic Workflow execution.

## Temporal Applications
- **Workflow and Activity Definitions**: Code representing business logic, while SDK components manage Workers and Clients.
- **Automatic Recovery**: Temporal automatically reconstructs state after failures using History Replay.

## Best Practices for Temporal Development
1. Use a single class for input/output parameters in Workflows and Activities for backward compatibility.
2. Avoid large data for inputs/outputs due to Temporal event size limits.
3. Ensure deterministic Workflow code (e.g., use `Workflow.sleep` instead of `Thread.sleep`).
4. Activities can fail and be retried; Workflows should fail less often.
5. Use Temporal's logging API to avoid duplicate logs during History Replay.
   
## Testing Temporal Applications
- **Automated Testing**: Use `io.temporal.testing` for unit tests, JUnit, Mockito, and time-skipping for Workflow tests.
- **Replaying Previous Executions**: Test compatibility of Workflow modifications by replaying past executions.

## Workflow Execution
- **Unique Workflow ID**: Ensure unique Workflow IDs across all Workflow Executions in the same namespace.
- **Open and Closed States**: Workflow starts in an open state and can close as Completed, Failed, Canceled, Terminated, etc.
- **Sticky Execution**: Optimizes execution by favoring the same Worker for multiple tasks.
- **Continue-As-New**: Used to split Workflow Execution to keep Event History manageable.

## Event History
- Logs all Workflow events with timestamps and attributes, up to a 50K event limit. 
- **Retention Period**: Workflow history is retained post-execution for a set period.

## Building and Running Temporal Applications
- **No Specific Tools**: Applications can be built and deployed using tools like Maven, CI/CD pipelines, and Docker/Kubernetes.
- **Production Setup**: Deploy multiple instances for scalability and availability.

## Temporal Cluster Components
- **Temporal Cluster**: Consists of services like History, Matching, and Worker Services, using gRPC for communication.
- **Temporal Cloud**: Managed service alternative to self-hosting.

## Deploying to Production
- **Frontend Service**: Clients connect via TCP (default port 7233).
- **Safe Activity Changes**: Activities can be modified freely, but Workflow changes require compatibility testing.

## Signals in Temporal

- **Signals**: Asynchronous messages used to change the state or control the flow of a running Workflow Execution.
- **Usage**: Suitable for workflows that need to react to external events, such as human task completions or user interactions.
- **Examples**: 
  - Modifying orders in e-commerce.
  - Confirming payment to proceed with shipping.
  - Handling frequently changing data like stock prices.

## DynamicSignalHandler
- **Purpose**: Handles unregistered or unexpected Signals in a workflow.
- **Usage**: Register a handler for undefined Signals using `Workflow.registerListener()`.

## When to Throw Exceptions in Temporal Workflows
- **Throw Exceptions**:
  - For non-recoverable errors (e.g., invalid inputs).
  - Explicit workflow cancellation (e.g., user cancellation).
  - Fatal system failures.
  - Exceeding retries or timeouts.
- **Do Not Throw Exceptions**:
  - For transient errors (Temporal handles retries).
  - For expected conditions (use conditional logic).
  - During graceful cancellations (use signals, not exceptions).
  
## Signal-With-Start
- **Feature**: Sends a signal to a Workflow and starts it if it is not running.
- **Usage**: Useful to ensure workflow execution when signaling.

## Common Signal Issues
- **Outgoing Signal Limit**: 2000 pending outgoing Signals per Workflow.
- **Receiving Signal Limit**: 10,000 Signals per Workflow; 51,200 event history limit.
- **Handling High Signal Volume**: Use batching to avoid UnhandledCommand errors or performance degradation.

## Summary of Cancellation Scopes in Temporal Java SDK

A **Cancellation Scope** in the Temporal Java SDK allows workflows to handle cancellation requests in a controlled manner. Each part of a workflow can be run inside its own cancellation scope, which can be canceled independently of other parts. Cancellation scopes help manage cleanup, timeouts, and resource management when a workflow or its activities are canceled.

Here are the main pointers and examples:

### 1. **Basic Cancellation Scope**
- **Purpose:** Cancels all child operations when the scope is canceled.
- **Usage:** Useful when you want to run a set of tasks that may need to be canceled if a condition arises.

**Example:**
```java
CancellationScope scope = Workflow.newCancellationScope(
    () -> {
        // Run multiple asynchronous activities
        for (String greeting : greetings) {
            results.add(Async.function(activities::composeGreeting, greeting, name));
        }
    });
scope.run(); // Non-blocking execution within the scope
String result = Promise.anyOf(results).get();
scope.cancel(); // Cancel all uncompleted tasks
```

### 2. **Cancellation Scope with Timeout**
- **Purpose:** Automatically cancels operations within the scope if they take too long.
- **Usage:** Suitable for scenarios where tasks should have a time limit.

**Example:**
```java
CancellationScope scope = Workflow.newCancellationScope(
    () -> {
        try {
            result = activities.updateInfo(input);
        } catch (ActivityFailure e) {
            throw e;
        }
    });

Workflow.newTimer(Duration.ofSeconds(3))
    .thenApply(result -> {
        scope.cancel(); // Cancel if timeout occurs
        return null;
    });

try {
    scope.run(); // Run the activity
} catch (ActivityFailure e) {
    if (e.getCause() instanceof CanceledFailure) {
        result = "Activity canceled due to timeout.";
    }
}
```

### 3. **Detached Cancellation Scope**
- **Purpose:** Performs cleanup after workflow cancellation without being canceled itself.
- **Usage:** Suitable for tasks like cleanup that need to complete even if the workflow is canceled.

**Example:**
```java
try {
    this.greeting = activities.sayHello(name);
    return greeting;
} catch (ActivityFailure af) {
    // Detached scope for cleanup after workflow cancellation
    CancellationScope detached = Workflow.newDetachedCancellationScope(
        () -> greeting = activities.sayGoodBye(name));
    detached.run();
    throw af;
}
```

### 4. **External Cancellation**
- **Purpose:** Allows an external source (e.g., user action) to trigger the cancellation of a workflow.
- **Usage:** Used when the workflow needs to be interrupted and properly cleaned up.

**Example:**
```java
public String orderProcessingWorkflow(String name) {
    try {
        // Workflow implementation
    } catch (ActivityFailure af) {
        if (af.getCause() instanceof CanceledFailure) {
            CancellationScope detached = Workflow.newDetachedCancellationScope(
                this::cleanup); // Perform necessary cleanup
            detached.run();
            throw af;
        }
    }
}
```

### 5. **Best Practices**
- Use **DetachedCancellationScopes** for critical operations that must run to completion.
- Handle external cancellation requests by catching `CanceledFailure` and performing necessary cleanup.
- Always rethrow `CanceledFailure` in activities to ensure Temporal correctly recognizes the cancellation.

By understanding and applying these patterns, you can handle workflow and activity cancellations gracefully in Temporal, ensuring efficient resource management and clean shutdowns.

## Asynchronous Activity Completion in Temporal

Asynchronous Activity Completion in Temporal allows an Activity to return without marking it as complete, enabling external systems to interact with Temporal before the activity is considered finished. This is particularly useful when an Activity involves long-running tasks or external dependencies, such as waiting for user input or handling operations on an external system.

#### Key Concepts:

1. **Asynchronous Activity Completion**: The Activity does not complete immediately after the method returns. Instead, it can stay "in progress" while awaiting an external trigger to mark it complete.
   
2. **Task Tokens**: These are unique identifiers used to track an Activity execution. They can be passed to external systems to allow completion later.

3. **Heartbeats**: While an Activity is in progress, periodic updates or "heartbeats" can be sent back to the Temporal server to keep the Activity alive and prevent it from timing out.

4. **Activity Execution Context**: The `ActivityExecutionContext` provides methods to control the lifecycle of the Activity, such as marking it as incomplete and sending heartbeats.

5. **Activity Completion Client**: The `ActivityCompletionClient` is used to signal the completion of an Activity from an external process, passing the Task Token and the result of the Activity.

#### Example Code: Asynchronous Activity Completion

##### Activity Implementation

```java
import io.temporal.activity.Activity;
import io.temporal.activity.ActivityExecutionContext;

public class VideoProcessingActivityImpl implements VideoProcessingActivity {

    @Override
    public String uploadVideo(String videoPath) {
        ActivityExecutionContext context = Activity.getExecutionContext();

        // Get the Task Token and log it securely (this can be sent to an external system)
        byte[] taskToken = context.getTaskToken();
        context.doNotCompleteOnReturn();

        // Simulate the upload task being handed over to an external system
        // The actual upload process would occur asynchronously outside of Temporal

        // Return immediately but do not complete the activity
        return "Upload initiated. Task completion will be handled asynchronously.";
    }
}
```

##### External Completion Service

```java
import io.temporal.client.ActivityCompletionClient;
import io.temporal.client.WorkflowClient;
import io.temporal.serviceclient.WorkflowServiceStubs;

import java.util.Base64;

public class ExternalUploadCompletionService {

    public static void main(String[] args) throws InterruptedException {
        WorkflowServiceStubs service = WorkflowServiceStubs.newLocalServiceStubs();
        WorkflowClient client = WorkflowClient.newInstance(service);
        ActivityCompletionClient completionClient = client.newActivityCompletionClient();

        // Simulate external task progress
        byte[] taskToken = Base64.getDecoder().decode(args[0]);

        for (int i = 1; i <= 10; i++) {
            Thread.sleep(3000); // Simulating a delay of 3 seconds
            completionClient.heartbeat(taskToken, i * 10 + "% complete");
        }

        // Complete the activity with the final result
        completionClient.complete(taskToken, "Upload successful. Video URL: https://example.com/video/1234");
    }
}
```

## Steps to Complete an Asynchronous Activity:

1. **Provide Task Token**: The `ActivityExecutionContext` provides a task token, which is passed to the external service to later mark the activity as complete.
   
2. **doNotCompleteOnReturn()**: The method `doNotCompleteOnReturn()` ensures that the Activity does not finish even after returning from the method.

3. **Heartbeats**: The external system periodically sends heartbeats to Temporal to inform it of ongoing progress, avoiding the Activity being marked as failed due to timeouts.

4. **Completion**: Once the external process completes, the `ActivityCompletionClient` uses the task token to notify Temporal that the Activity is complete.

#### Best Practices:

- **Secure Task Tokens**: Treat task tokens as sensitive information and encrypt them before passing to external services.
- **Retry Handling**: Make sure to account for task retries, as each retry creates a new task token. 
- **Heartbeat Management**: Use heartbeats to track progress and avoid timeouts.

---

### Async Activity Completion Example with Percentage Updates (Every 3 Seconds) in Spring Boot

Here's how to implement an asynchronous activity where progress updates are sent every 3 seconds, with a 10% increment in progress, completing the task at 100%.

##### Activity Interface

```java
public interface VideoProcessingActivity {
    String uploadVideo(String videoPath);
}
```

##### Activity Implementation

```java
import io.temporal.activity.Activity;
import io.temporal.activity.ActivityExecutionContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class VideoProcessingActivityImpl implements VideoProcessingActivity {

    private static final Logger logger = LoggerFactory.getLogger(VideoProcessingActivityImpl.class);

    @Override
    public String uploadVideo(String videoPath) {
        ActivityExecutionContext context = Activity.getExecutionContext();

        // Retrieve task token
        byte[] taskToken = context.getTaskToken();
        logger.info("Task Token for async completion: {}", Base64.getEncoder().encodeToString(taskToken));

        // Mark activity as "in-progress"
        context.doNotCompleteOnReturn();

        // Simulate handing over the task to another service (asynchronously)
        new Thread(() -> processUpload(taskToken)).start();

        return "Video upload started";
    }

    private void processUpload(byte[] taskToken) {
        try {
            // Simulate upload progress (10% every 3 seconds)
            for (int i = 1; i <= 10; i++) {
                Thread.sleep(3000); // Wait for 3 seconds
                sendHeartbeat(taskToken, i * 10 + "% uploaded");
            }
            completeActivity(taskToken, "Upload complete. URL: https://example.com/video/1234");

        } catch (InterruptedException e) {
            logger.error("Upload process interrupted", e);
        }
    }

    private void sendHeartbeat(byte[] taskToken, String progress) {
        // Send heartbeat to Temporal to avoid timeout
        Activity.getExecutionContext().heartbeat(progress);
        logger.info("Heartbeat sent: {}", progress);
    }

    private void completeActivity(byte[] taskToken, String result) {
        // Use completion client to mark the activity as complete
        WorkflowServiceStubs service = WorkflowServiceStubs.newLocalServiceStubs();
        WorkflowClient client = WorkflowClient.newInstance(service);
        ActivityCompletionClient completionClient = client.newActivityCompletionClient();
        
        completionClient.complete(taskToken, result);
        logger.info("Activity completed with result: {}", result);
    }
}
```

This implementation leverages:

- **Heartbeats every 3 seconds**: Progress is sent as heartbeats at regular intervals (10% increments).
- **Task Completion**: After 10 heartbeats (i.e., 100%), the external system completes the activity.

### Key Points Summary: Temporal Workflows with Java

1. **Signaling & Querying Workflows**:
   - Signals can be sent from a client to a Workflow or from one Workflow to another using `newExternalWorkflowStub()`.
   - A Workflow can receive up to 10,000 signals, after which batching signals can help prevent overload.
   - Handling asynchronous signal actions: Queue signals instead of processing immediately.
   - Queries can be sent by getting a handle on a Workflow.

2. **Search Attributes**:
   - **List Filter**: Acts like a SQL-like query to find open Workflow Executions.
   - **Search Attributes**: Default attributes are created automatically, while custom attributes can be set in client code or via Workflow logic.

3. **Workflow Execution Cancellations**:
   - **Heartbeats**: Periodic pings sent to indicate progress and Worker health.
   - **Heartbeat Timeout**: If a timeout occurs due to missed heartbeats, the activity can resume using the last heartbeat data.
   - **Workflow Cancellations**: Cancellations terminate Workflow gracefully, catching exceptions with `CancelledFailure` for cleanup.
   - **Non-Cancellable Scopes**: Protect critical operations by defining non-cancellable parts of the Workflow.
   
4. **Asynchronous Activity Completion**:
   - Allows the Activity method to return without marking the Activity as complete.
   - Useful for long-running, unpredictable, or external system-dependent tasks.
   - Task Token is a unique identifier for an Activity Execution across machines.

These points capture the essentials of interacting with workflows, signals, queries, search attributes, and cancellation handling within the Temporal platform, with a focus on Java.

### CancellationScope in Temporal with Java 21 and Spring Boot: Practical Example

#### **Scenario**: Payment Processing Workflow with Cleanup in Case of Cancellation

Imagine a payment processing system where the system performs several steps, including charging a customer, updating the order status, and sending a confirmation email. If the user cancels the payment midway through the process, you want to ensure that any reserved resources (e.g., holding inventory or creating an order) are released properly, but the charge should not be applied to the user’s account.

To achieve this, you can use Temporal's **CancellationScope** to define how the system responds to cancellation requests while still performing necessary cleanup actions. We’ll integrate this with **Java 21** and **Spring Boot** following best practices.

### Steps:

1. **Create a Workflow to handle payment processing.**
2. **Introduce a cancellable scope** for the payment charge.
3. **Handle cleanup operations** (like rolling back transactions or releasing resources) in case of cancellation.
4. **Use Spring Boot with Temporal SDK** to define the workflow and activities.

---

### **1. Project Setup (Spring Boot and Temporal SDK)**

Make sure to include the required dependencies in your `build.gradle` or `pom.xml` for Temporal and Spring Boot.

#### `build.gradle`
```groovy
plugins {
    id 'org.springframework.boot' version '3.1.0'
    id 'io.spring.dependency-management' version '1.1.0'
    id 'java'
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter'
    implementation 'io.temporal:temporal-sdk:1.14.0'
    implementation 'io.temporal:spring-boot-starter-temporal:1.0.0'
}
```

---

### **2. Workflow Interface**

We’ll define the `PaymentWorkflow` that will handle the steps for payment processing.

#### `PaymentWorkflow.java`
```java
package com.example.payment.workflow;

import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

@WorkflowInterface
public interface PaymentWorkflow {
    @WorkflowMethod
    void processPayment(String orderId, String customerId, double amount);
}
```

---

### **3. Workflow Implementation with Cancellation Scope**

We'll use the `CancellationScope` to wrap the `chargeCustomer` activity, which can be canceled if requested.

#### `PaymentWorkflowImpl.java`
```java
package com.example.payment.workflow;

import io.temporal.workflow.CancellationScope;
import io.temporal.workflow.Workflow;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PaymentWorkflowImpl implements PaymentWorkflow {

    private static final Logger logger = LoggerFactory.getLogger(PaymentWorkflowImpl.class);

    private final PaymentActivities paymentActivities = Workflow.newActivityStub(PaymentActivities.class);

    @Override
    public void processPayment(String orderId, String customerId, double amount) {
        logger.info("Starting payment workflow for Order ID: {}", orderId);

        try {
            // Create a cancellable scope around charging the customer
            CancellationScope chargeScope = Workflow.newCancellationScope(() -> {
                paymentActivities.chargeCustomer(customerId, amount);
            });

            chargeScope.run();  // Execute the scope (charge the customer)
            logger.info("Customer charged successfully!");

            // Update the order status after payment succeeds
            paymentActivities.updateOrderStatus(orderId, "PAID");

            // Send confirmation email to the customer
            paymentActivities.sendConfirmationEmail(customerId, orderId);
        } catch (Exception e) {
            // If any cancellation happens or failure occurs, handle it.
            logger.error("Payment failed or was canceled for Order ID: {}. Performing cleanup.", orderId);

            // Cleanup the order by marking it as canceled
            paymentActivities.updateOrderStatus(orderId, "CANCELED");
        }
    }
}
```

### Key Points in Code:

- **CancellationScope**: The `CancellationScope` is created around the critical step where the customer is charged.
- **Graceful Handling**: If the workflow is canceled, it catches the exception and performs cleanup activities (e.g., marking the order as canceled).

---

### **4. Activities Interface**

Define the activities involved in the payment processing workflow, such as charging the customer, updating the order status, and sending a confirmation email.

#### `PaymentActivities.java`
```java
package com.example.payment.workflow;

import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;

@ActivityInterface
public interface PaymentActivities {
    @ActivityMethod
    void chargeCustomer(String customerId, double amount);

    @ActivityMethod
    void updateOrderStatus(String orderId, String status);

    @ActivityMethod
    void sendConfirmationEmail(String customerId, String orderId);
}
```

---

### **5. Activities Implementation**

Implement the activities. The payment charging activity will simulate a delay, and we'll include logging to track the flow of execution.

#### `PaymentActivitiesImpl.java`
```java
package com.example.payment.workflow;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class PaymentActivitiesImpl implements PaymentActivities {

    private static final Logger logger = LoggerFactory.getLogger(PaymentActivitiesImpl.class);

    @Override
    public void chargeCustomer(String customerId, double amount) {
        try {
            // Simulate a delay in processing the payment
            logger.info("Charging customer {} an amount of ${}", customerId, amount);
            Thread.sleep(5000);  // Simulate external processing time
            logger.info("Customer {} charged successfully.", customerId);
        } catch (InterruptedException e) {
            logger.error("Payment process interrupted for customer {}", customerId);
            throw new RuntimeException("Payment interrupted");
        }
    }

    @Override
    public void updateOrderStatus(String orderId, String status) {
        logger.info("Updating order {} status to '{}'", orderId, status);
        // Simulate order status update in the database
    }

    @Override
    public void sendConfirmationEmail(String customerId, String orderId) {
        logger.info("Sending confirmation email for Order ID: {} to Customer ID: {}", orderId, customerId);
        // Simulate email sending
    }
}
```

---

### **6. Spring Boot Configuration**

Configure Spring Boot to enable Temporal workers and define the worker that executes the `PaymentWorkflow`.

#### `TemporalConfig.java`
```java
package com.example.payment.config;

import com.example.payment.workflow.PaymentActivitiesImpl;
import com.example.payment.workflow.PaymentWorkflowImpl;
import io.temporal.worker.WorkerFactory;
import io.temporal.worker.WorkerFactoryOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TemporalConfig {

    @Bean
    public WorkerFactory workerFactory() {
        WorkerFactoryOptions options = WorkerFactoryOptions.newBuilder().build();
        return WorkerFactory.newInstance(TemporalWorkflowClient.getService(), options);
    }

    @Bean
    public void startWorkers(WorkerFactory factory) {
        var worker = factory.newWorker("payment-task-queue");
        worker.registerWorkflowImplementationTypes(PaymentWorkflowImpl.class);
        worker.registerActivitiesImplementations(new PaymentActivitiesImpl());
        factory.start();
    }
}
```

---

### **7. Handling Workflow Cancellation**

Finally, we'll simulate the client-side code to start and cancel the workflow execution.

#### `PaymentClient.java`
```java
package com.example.payment.client;

import com.example.payment.workflow.PaymentWorkflow;
import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowOptions;
import io.temporal.client.WorkflowStub;
import io.temporal.serviceclient.WorkflowServiceStubs;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class PaymentClient {

    private static final Logger logger = LoggerFactory.getLogger(PaymentClient.class);

    private final WorkflowClient workflowClient;

    public PaymentClient(WorkflowClient workflowClient) {
        this.workflowClient = workflowClient;
    }

    public void startPaymentWorkflow(String orderId, String customerId, double amount) {
        WorkflowOptions options = WorkflowOptions.newBuilder()
                .setTaskQueue("payment-task-queue")
                .build();

        PaymentWorkflow workflow = workflowClient.newWorkflowStub(PaymentWorkflow.class, options);

        WorkflowStub workflowStub = WorkflowStub.fromTyped(workflow);

        try {
            // Start the workflow asynchronously
            WorkflowClient.start(workflow::processPayment, orderId, customerId, amount);

            // Simulate a scenario where we cancel the workflow after 3 seconds
            Thread.sleep(3000);
            workflowStub.cancel();
            logger.info("Workflow for Order ID: {} canceled successfully", orderId);
        } catch (Exception e) {
            logger.error("Error starting or canceling the workflow", e);
        }
    }
}
```

---

### **8. Execution**

1. **Start the workflow**: The workflow starts by charging the customer and performing subsequent tasks.
2. **Cancel the workflow**: The workflow is canceled midway through the payment charge, and cleanup is performed to cancel the order.

---

## **Best Practices Applied**:

- **Graceful Cancellation**: By wrapping the critical `chargeCustomer` operation in a `CancellationScope`, we can ensure that if the operation is canceled, the workflow handles it gracefully and performs any necessary cleanup.
- **Asynchronous Activities**: The activities are kept short and simple, following the best practice of delegating longer operations to external services.
- **Spring Boot Integration**: Temporal SDK is seamlessly integrated with Spring Boot, and beans are used to configure the worker and client interactions.

This example demonstrates how you can implement cancellable workflows using Temporal's `CancellationScope` while following best practices for handling workflow cancellation, maintaining Spring Boot structure, and using Java 21 features.
