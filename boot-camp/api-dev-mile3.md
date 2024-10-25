<ProgressBar />

# Exception Handling and Best Practices <Label text="M3" type="milestone" />

## Objective

In this milestone, we'll enhance our product catalog API by implementing robust exception handling, improving error messages, using MapStruct for object mapping, and refactoring our code for better testability and adherence to best practices.

## Exception Handling and Error Messages

Exception handling is crucial for building robust and user-friendly APIs. It helps manage unexpected situations gracefully, provides meaningful feedback to clients, and improves the overall reliability of your application. Here are some reasons why exception handling is important:

1. **Improved user experience**: Instead of generic error messages, you can provide specific, actionable information to API consumers.

   Example without exception handling:
   ```json
   {
     "status": 500,
     "error": "Internal Server Error"
   }
   ```

   Example with proper exception handling:
   ```json
   {
     "status": 404,
     "error": "Product not found",
     "message": "The product with ID 123 does not exist in our catalog"
   }
   ```

2. **Better debugging and logging**: Custom exceptions allow you to log detailed information about errors, making it easier to identify and fix issues.

3. **Graceful degradation**: Proper exception handling ensures that your application continues to function even when unexpected errors occur.

   Example:
   ```java
   try {
       // Attempt to process an order
       processOrder(orderId);
   } catch (ProductOutOfStockException e) {
       // Handle the specific exception
       notifyUserAndSuggestAlternatives(e.getProductId());
   } catch (Exception e) {
       // Handle any other unexpected exceptions
       logError(e);
       showGenericErrorMessage();
   }
   ```

4. **Security**: Exception handling helps prevent sensitive information from being exposed in error messages, which could be exploited by malicious users.

5. **API contract maintenance**: By defining specific exceptions and error responses, you can maintain a consistent API contract, making it easier for clients to integrate with your service.

### Create Custom Exceptions

Designing custom exceptions is a crucial step in implementing robust error handling. Here's a guide on how to create effective custom exceptions:

1. **Identify exception scenarios**: Analyze your application's flow and identify potential error situations. Common scenarios include:
   - Resource not found (e.g., product, user, order)
   - Invalid input (e.g., malformed data, out-of-range values)
   - Business rule violations (e.g., insufficient inventory, expired coupon)
   - Authentication and authorization failures
   - External service failures (e.g., payment gateway timeout)

2. **Create specific exception classes**: For each identified scenario, create a custom exception class. Follow these best practices:
   - Name exceptions clearly and specifically (e.g., `ProductNotFoundException`, `InvalidInputException`)
   - Extend appropriate base exception classes (e.g., `RuntimeException` for unchecked exceptions)
   - Include relevant error details in the exception

Here's an example of a custom exception:

```java
public class ProductNotFoundException extends RuntimeException {
    private final Long productId;

    public ProductNotFoundException(Long productId) {
        super("Product not found with id: " + productId);
        this.productId = productId;
    }

    public Long getProductId() {
        return productId;
    }
}
```

3. **Best practices for error messages**:
   - Be specific and clear about what went wrong
   - Provide actionable information when possible
   - Avoid exposing sensitive information or implementation details
   - Use a consistent format across all error messages
   - Consider internationalization for multi-language support

Example of a well-phrased error message:
```java
throw new InvalidInputException("Invalid price: $" + price + ". Price must be a positive number.");
```

4. **Additional best practices**:
   - Use checked exceptions for recoverable errors and unchecked exceptions for programming errors
   - Create a hierarchy of custom exceptions if needed (e.g., `ApiException` as a base class)
   - Include relevant context in exceptions (e.g., request ID, timestamp)
   - Consider creating an enum for error codes to maintain consistency


By following these guidelines, you can create a robust set of custom exceptions that improve error handling and provide clear, actionable information to API consumers.

Now, let's create all the custom exceptions applicable for our product catalog API we have built so far within a new package `exception` under 'com.example.productapi':

::: code-group

```java [ProductNotFoundException.java]
package com.example.productapi.exception;

public class ProductNotFoundException extends RuntimeException {
    private final Long productId;

    public ProductNotFoundException(Long productId) {
        super("Product not found with id: " + productId);
        this.productId = productId;
    }

    public Long getProductId() {
        return productId;
    }
}
```

```java [InvalidInputException.java]
package com.example.productapi.exception;

public class InvalidInputException extends RuntimeException {
    public InvalidInputException(String message) {
        super(message);
    }
}
```

```java [DuplicateProductException.java]
package com.example.productapi.exception;


public class DuplicateProductException extends RuntimeException {
    private final String productName;

    public DuplicateProductException(String productName) {
        super("Product with name '" + productName + "' already exists");
        this.productName = productName;
    }

    public String getProductName() {
        return productName;
    }
}
```
:::

These custom exceptions cover various scenarios that might occur in our product catalog API:

| Exception Name | Description | Use Case |
|----------------|-------------|----------|
| `ProductNotFoundException` | Thrown when a requested product is not found in the database. | When retrieving or updating a non-existent product |
| `InvalidInputException` | Used for general input validation errors. | When user input fails validation checks |
| `InsufficientInventoryException` | Thrown when trying to order more items than available in stock. | During order placement or inventory updates |
| `DuplicateProductException` | Used when attempting to create a product with a name that already exists. | When creating a new product |
| `CategoryNotFoundException` | Thrown when a requested category is not found in the database. | When retrieving or updating a non-existent category |
| `ApiException` | A base exception class for all our custom API exceptions. | Base class for other exceptions |

These exceptions provide specific error messages and include relevant data (such as IDs or quantities) to help diagnose and handle errors effectively.

###  Implement Global Exception Handler

After defining custom exceptions, the next logical step is to implement a Global Exception Handler. First, let's create an `ErrorResponse` class to structure our error responses:

```java
package com.example.productapi.exception;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ErrorResponse {
    private String error;
    private String message;
    private String status;

    public ErrorResponse(String error, String message, String status) {
        this.error = error;
        this.message = message;
        this.status = status;
    }
}
```

Now, let's implement the Global Exception Handler using this `ErrorResponse` class:

```java{9,12,19}
package com.example.productapi.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleProductNotFoundException(ProductNotFoundException ex) {
        log.info("handling not found");
        ErrorResponse error = new ErrorResponse(
            "PRODUCT_NOT_FOUND", 
            ex.getMessage(), 
            HttpStatus.NOT_FOUND.toString());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(InvalidInputException.class)
    public ResponseEntity<ErrorResponse> handleInvalidInputException(InvalidInputException ex) {
        log.info("invalid input");
        ErrorResponse error = new ErrorResponse(
            "INVALID_INPUT", 
            ex.getMessage(), 
            HttpStatus.BAD_REQUEST.toString());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(DuplicateProductException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateProductException(DuplicateProductException ex) {
        log.info("invalid input");
        ErrorResponse error = new ErrorResponse(
            "DUPLICATE_PRODUCT", 
            ex.getMessage(), 
            HttpStatus.BAD_REQUEST.toString());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        log.info("handling other exception");
        ErrorResponse error = new ErrorResponse(
            "INTERNAL_SERVER_ERROR", 
            "An unexpected error occurred", 
            HttpStatus.INTERNAL_SERVER_ERROR.toString());
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Add more exception handlers for other custom exceptions
}
```

Let's break down the key components:

::: info Key Annotations
- `@ControllerAdvice`: Indicates that this class provides global exception handling.
- `@ExceptionHandler`: Specifies which exception type each method handles.
:::

1. The class is annotated with `@ControllerAdvice` telling Spring that this class will handle exceptions globally across the entire application.

2. Each method is annotated with `@ExceptionHandler` specifying which exception type it handles.

3. Exception-specific handlers handle specific custom exceptions. They create an `ErrorResponse` object with an error code, message, and status, then return it wrapped in a `ResponseEntity` with the appropriate HTTP status code.

4. Generic exception handler catches any unhandled exceptions, providing a fallback for unexpected errors. It returns a generic error message to avoid exposing sensitive information.

5. `ResponseEntity<ErrorResponse>` allows us to set both the response body (the `ErrorResponse` object) and the HTTP status code in a single object.

The `GlobalExceptionHandler` provides several benefits:

| Benefit | Description |
|---------|-------------|
| Centralized error handling | All exception handling logic is in one place, making it easier to maintain and update. |
| Consistent error responses | Ensures that all error responses follow the same structure, improving API consistency. |
| Separation of concerns | Controllers can focus on happy-path logic, while error handling is managed separately. |
| Flexibility | You can easily add new exception handlers or modify existing ones without changing controller code. |

::: tip
Remember to log detailed error information in your global exception handler, especially for unexpected exceptions. This will help with debugging and monitoring your application.
:::

## Implementing Custom Exceptions

Now that we have defined our custom exceptions and set up a global exception handler, let's implement them throughout our application.

### Throwing Custom Exceptions

Replace generic exceptions or error-prone code with our new custom exceptions. Here is what our `ProductService` class looks like after implementing the custom exceptions:

::: code-group
```java [ changelog - ProductService.java]
package com.example.productapi.service;

import com.example.productapi.model.Product;
import com.example.productapi.repository.ProductRepository;
import com.example.productapi.exception.ProductNotFoundException; // [!code ++]
import com.example.productapi.exception.DuplicateProductException; // [!code ++]
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found")); // [!code --]
            .orElseThrow(() -> new ProductNotFoundException(id)); // [!code ++]
    }

    public Product createProduct(Product product) {
        if (productRepository.existsByName(product.getName())) { // [!code ++]
            throw new DuplicateProductException(product.getName()); // [!code ++]
        } // [!code ++]
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product productDetails) {
        Product product = getProductById(id); // [!code --]
        Product existingProduct = productRepository.findById(id) // [!code ++]
            .orElseThrow(() -> new ProductNotFoundException(id)); // [!code ++]
        
        if (!existingProduct.getName().equals(productDetails.getName()) && // [!code ++]
            productRepository.existsByName(productDetails.getName())) { // [!code ++]
            throw new DuplicateProductException(productDetails.getName()); // [!code ++]
        } // [!code ++]
        
        existingProduct.setName(productDetails.getName()); // [!code ++]
        existingProduct.setDescription(productDetails.getDescription()); // [!code ++]
        existingProduct.setPrice(productDetails.getPrice()); // [!code ++]
        return productRepository.save(existingProduct); // [!code ++]
        product.setName(productDetails.getName()); // [!code --]
        product.setDescription(productDetails.getDescription()); // [!code --]
        product.setPrice(productDetails.getPrice()); // [!code --]
        return productRepository.save(product); // [!code --]
    }

    public void deleteProduct(Long id) {
        Product product = getProductById(id); // [!code --]
        if (!productRepository.existsById(id)) { // [!code ++]
            throw new ProductNotFoundException(id); // [!code ++]
        } // [!code ++]
        productRepository.deleteById(id); // [!code ++]
        productRepository.delete(product); // [!code --]
    }
}
```
``` java [Actual Code - ProductService.java]
package com.example.productapi.service;

import com.example.productapi.model.Product;
import com.example.productapi.repository.ProductRepository;
import com.example.productapi.exception.ProductNotFoundException;
import com.example.productapi.exception.DuplicateProductException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));
    }

    public Product createProduct(Product product) {
        if (productRepository.existsByName(product.getName())) {
            throw new DuplicateProductException(product.getName());
        }
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product productDetails) {
        Product existingProduct = productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));
        
        if (!existingProduct.getName().equals(productDetails.getName()) &&
            productRepository.existsByName(productDetails.getName())) {
            throw new DuplicateProductException(productDetails.getName());
        }
        
        existingProduct.setName(productDetails.getName());
        existingProduct.setDescription(productDetails.getDescription());
        existingProduct.setPrice(productDetails.getPrice());
        return productRepository.save(existingProduct);
    }

    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ProductNotFoundException(id);
        }
        productRepository.deleteById(id);
    }
}
```

```java [Changelog - ProductRepository.java]
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    boolean existsByName(String name); // [!code ++]
}
```
:::

::: warning
Make sure to add `existsByName` method signature to your `ProductRepository` interface.
:::

::: tip
The `existsByName` method is a query method in Spring Data JPA. It's automatically implemented by Spring based on the method name. Here's how it works:

1. `exists`: This keyword tells Spring to check for the existence of an entity.
2. `By`: This is a separator that indicates the start of the condition.
3. `Name`: This refers to the `name` property of the `Product` entity.

Spring Data JPA will automatically generate the appropriate SQL query to check if a product with the given name exists in the database. You don't need to write the implementation yourself!

This method is equivalent to the following SQL:

```sql
SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM product WHERE name = ?
```

Spring Data JPA provides many such keywords for method names. You can create complex queries just by naming your methods appropriately!
:::
### Expected Behavior

After implementing custom exceptions and the global exception handler, your API will respond with consistent, informative error messages. For example:

1. When requesting a non-existent product:
   ```json
   {
     "error": "PRODUCT_NOT_FOUND",
     "message": "Product not found with id: <<requested id>>",
     "status": "404 NOT_FOUND"
   }
   ```

2. When trying to create a duplicate product:
   ```json
   {
     "error": "DUPLICATE_PRODUCT",
     "message": "Product with name '<<product name>>' already exists",
     "status": "409 CONFLICT"
   }
   ```

3. When an unexpected error occurs:
   ```json
   {
     "error": "INTERNAL_SERVER_ERROR",
     "message": "An unexpected error occurred",
     "status": "500 INTERNAL_SERVER_ERROR"
   }
   ```

These structured responses make it easier for API consumers to handle errors programmatically and provide better user experiences.

## API Testing with Postman

To help you test our API, we've prepared a Postman collection that covers all the endpoints and various scenarios. You can download and use this collection to interact with the API and verify its behavior.

[Download Postman Collection](/Product_API_Tests.postman_collection.json)

To use this collection:

1. Download the JSON file
2. Open Postman
3. Click on "Import" in the top left corner
4. Choose "File" and select the downloaded JSON
5. The collection will now be available in your Postman workspace

Alternatively, you can view the API documentation directly in your browser:
[<img src="https://run.pstmn.io/button.svg" alt="Run In Postman" style="width: 128px; height: 32px;">](https://app.getpostman.com/run-collection/10048771-4562a789-9ab6-47d5-b8dc-54aab505d3a2?action=collection%2Ffork&source=rip_markdown&collection-url=entityId%3D10048771-4562a789-9ab6-47d5-b8dc-54aab505d3a2%26entityType%3Dcollection%26workspaceId%3D8c561acb-06d3-445c-a7af-44b0ce1f3bae)

::: tip
This collection includes tests for all CRUD operations, both success and error scenarios, ensuring comprehensive coverage of the API's functionality.
:::

## Implementing Logging with SLF4J

Before we move on to MapStruct, let's implement a simple logging mechanism using SLF4J (Simple Logging Facade for Java).

### Using Lombok's @Slf4j Annotation

Since we're already using Lombok in our application, we can take advantage of its `@Slf4j` annotation to easily add logging to our classes. This annotation automatically creates a `private static final` logger field in the class, saving us from having to declare it manually.

Here's how to use it:


1. Add the `@Slf4j` annotation to your class:

```java
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ProductService {
    // Your code here
}
```

2. Use the `log` object directly in your methods:

```java
public Product getProductById(Long id) {
    log.debug("Fetching product with id: {}", id);
    return productRepository.findById(id)
        .orElseThrow(() -> {
            log.warn("Product not found with id: {}", id);
            return new ProductNotFoundException(id);
        });
}
```

By using Lombok's `@Slf4j` annotation, we simplify our code and avoid the need for additional dependencies or manual logger declarations.


### Log Levels and When to Use Them

SLF4J provides several log levels. Here's when to use each:

| Log Level | Description | Use Case |
|:---------:|-------------|----------|
| <span style="color: #8B8B8B;">TRACE</span> | Very detailed information | Typically only used when debugging |
| <span style="color: #6495ED;">DEBUG</span> | Debugging information | Less detailed than TRACE |
| <span style="color: #32CD32;">INFO</span> | General information | Application progress |
| <span style="color: #FFD700;">WARN</span> | Potentially harmful situations | Issues that don't prevent the application from working |
| <span style="color: #FF4500;">ERROR</span> | Error conditions | Errors that might still allow the application to continue running |
| <span style="color: #8B0000;">FATAL</span> | Severe errors | Issues that will likely lead the application to abort |

::: tip
Remember to use log levels appropriately to maintain clean and informative logs. Overuse of higher-level logs (like ERROR) can make it difficult to identify real issues when they occur.
:::

### Customizing Log Statements

You can include variables in your log statements using placeholders:

```java
log.info("Processing order {} for customer {}", orderId, customerId);
```

### Using MDC (Mapped Diagnostic Context)

MDC (Mapped Diagnostic Context) is a feature provided by logging frameworks that allows you to enrich log messages with contextual information. It's particularly useful in multi-threaded applications, such as web services, where you want to associate certain information with the current thread of execution.

MDC works like a map that is bound to the current thread. You can put key-value pairs into this map, and these values will be automatically included in your log messages, providing additional context for each log entry.

One common use of MDC is to include a correlation ID in your logs. A correlation ID is a unique identifier that is associated with a request or a transaction, allowing you to trace the flow of that request through your system, even across multiple services or threads.

Here's how to use MDC to add a correlation ID to your log messages:

1. Add a filter to your Spring Boot application by creating a new class in `com.example.productapi.filter` package:

```java
package com.example.productapi.filter;

import java.io.IOException;
import java.util.UUID;

import org.jboss.logging.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class MDCFilter extends OncePerRequestFilter { // [!code focus]

    @Override
    @SuppressWarnings("null")
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String correlationId = UUID.randomUUID().toString();
            MDC.put("correlationId", correlationId); // [!code focus]
            filterChain.doFilter(request, response);
        } finally {
            MDC.clear(); // [!code focus]
        }
    }
}
```
Explanations:

1. `extends OncePerRequestFilter`:
   `OncePerRequestFilter` is a base class for filters in Spring that ensures the filter is only executed once per request, even if the request is dispatched to another servlet. This is important for our MDC filter because we want to set the correlation ID only once at the beginning of the request processing.

2. `MDC.put("correlationId", correlationId);`:
   This line adds the `correlationId` to the MDC. The `correlationId` is a unique identifier generated for each request. By putting it in the MDC, we make it available for all subsequent log statements within the same thread (i.e., for the duration of processing this request).

3. `MDC.clear();`:
   This line clears all values from the MDC at the end of request processing. This is crucial to prevent information leakage between requests. Without this, the correlation ID from one request might accidentally be included in log messages for a subsequent request.

These highlighted lines are key to implementing the MDC functionality:
- We extend `OncePerRequestFilter` to ensure our filter runs once per request.
- We add a unique correlation ID to the MDC at the start of request processing.
- We clear the MDC at the end of request processing to maintain clean separation between requests.

This implementation ensures that each request gets a unique correlation ID, which will be included in all log messages for that request, and that this ID doesn't leak into logs for other requests.

2. Update your `application.yml` to include a logging pattern override as below:

```yml
logging:
  pattern:
    console: "%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} [%X{correlationId}] - %msg%n"
```


Now, each log message will include a unique correlation ID for the request.
```log
01:39:44.084 [http-nio-8080-exec-1] INFO  c.e.p.controller.ProductController [06ddf2ce-a14b-4ecc-87b4-f0a160f26319] - Returning 0 products
```
::: tip
A correlation ID is a unique identifier assigned to each incoming request or transaction. It helps in tracing the flow of a request through your system, which is especially useful when debugging issues in distributed systems or microservices architectures. By including the correlation ID in your logs, you can easily filter and track all log messages related to a specific request across different components or services.
:::

::: warning
Remember to clear the MDC at the end of each request (as shown in the `finally` block of the filter) to prevent information leakage between requests.
:::


::: tip
By implementing these logging practices, you'll have better visibility into your application's behavior, making it easier to debug issues and monitor performance.
:::


## Summary

In this milestone, we've learned and implemented several crucial aspects of building a robust and maintainable API:

1. **Custom Exception Handling**: We created specific exception classes for different error scenarios, allowing for more precise error reporting and handling.

2. **Global Exception Handler**: We implemented a centralized mechanism for catching and processing exceptions, ensuring consistent error responses across the API.

3. **Improved Error Messages**: We designed our error responses to provide clear, actionable information to API consumers, enhancing the overall user experience.

4. **Logging with SLF4J**: We integrated logging throughout our application, using Lombok's @Slf4j annotation for easy logger creation and learning about different log levels and their appropriate uses.

5. **Mapped Diagnostic Context (MDC)**: We implemented MDC to include correlation IDs in our logs, greatly improving our ability to trace requests through the system.

6. **API Testing**: We created a Postman collection to thoroughly test our API, covering both success and error scenarios for all CRUD operations.

These enhancements significantly improve the reliability, maintainability, and observability of our product catalog API. By implementing proper exception handling and logging, we've made our API more robust and easier to debug and monitor in production environments.

[View Complete Code Here](https://github.com/sardul3/product-api/tree/milestone-3)



