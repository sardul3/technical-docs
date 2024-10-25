<ProgressBar />

# API Development with Spring Boot <Label text="M1" type="milestone" />
::: tip
This guide is the first step to learn the basics of API development with Spring Boot.
:::

## Introduction
In this milestone, we will learn the basics of API development with Spring Boot. We will create a simple RESTful web service that allows us to manage a inventory catalog for an ecommerce store. 
::: info
We will build on top of what we have every new milestone untill we have a fully functional API that is enterprise grade
:::

### **Practical Introduction to APIs**

#### How APIs Work

An API (Application Programming Interface) acts as a messenger between different software systems. It allows one application to request data or services from another application, without needing to know the internal workings of that application.

Here's a simple analogy:
- You (the client) want to order food from a restaurant (the server).
- The waiter (the API) takes your order, communicates it to the kitchen, and brings back your food.
- You don't need to know how the kitchen works; you just interact with the waiter.

![An image](/server-client-interaction.png)

In technical terms, here is a summary of what happens:
| Step | Description |
|------|-------------|
| 1    | The client sends a request to the API endpoint. |
| 2    | The API processes the request and interacts with the server's database or services. |
| 3    | The server sends a response back through the API. |
| 4    | The client receives the data in a format it can understand (usually JSON). |

#### Real-world API Example: GitHub API

The GitHub API allows developers to interact with GitHub repositories, issues, pull requests, and more programmatically.

1. **Get a list of repositories for a user**
   ```bash
   curl https://api.github.com/users/sardul3/repos
   ```
   This will return a JSON array of repository objects for the user "sardul3".

2. **Get details of a specific repository**
   ```bash
   curl https://api.github.com/repos/sardul3/lms-sardul
   ```
   This will return details for the "lms-sardul" repository owned by "sardul3".

3. **Create a new issue**
   ```bash
   curl -X POST -H "Authorization: token YOUR_ACCESS_TOKEN" -H "Content-Type: application/json" -d '{"title":"New Issue","body":"This is the issue description"}' https://api.github.com/repos/octocat/Hello-World/issues
   ```
   This creates a new issue in the "Hello-World" repository and returns the created issue object with an ID.

::: info
Note: Replace `YOUR_ACCESS_TOKEN` with a valid GitHub personal access token to authenticate the request.
:::

These examples demonstrate how to use the GitHub API to perform common operations using different HTTP methods (GET and POST). The GitHub API is RESTful and follows similar patterns to the API we'll be building in this course.

#### Hands-on Demo: Using a Public API
<LiveHttpView />

These examples demonstrate the basic HTTP methods (GET and POST) used in RESTful APIs. As we progress through this course, we'll dive deeper into building our own API with similar functionality.

### HTTP Methods & Status Codes

Understanding HTTP methods and status codes is crucial for effective API development and consumption.

#### HTTP Methods

HTTP methods define the type of action to be performed on a resource. Here are the most common methods:

| Method | Purpose | Example | Best Practice |
|--------|---------|---------|---------------|
| GET    | Retrieve a resource | `GET /api/users/123` | Should be idempotent |
| POST   | Create a new resource | `POST /api/users` | Return created resource or identifier |
| PUT    | Update an existing resource (replace entirely) | `PUT /api/users/123` | Should be idempotent |
| PATCH  | Partially update an existing resource | `PATCH /api/users/123` | Use for partial updates |
| DELETE | Remove a resource | `DELETE /api/users/123` | Should be idempotent |

::: tip
**Idempotent**: 
Multiple identical requests should have the same effect as a single request.<br/>
We will cover this later in the course.
:::

#### HTTP Status Codes

Status codes indicate the result of the HTTP request. Here are some common ones:

| Code | Name | Use Case | Best Practice |
|------|------|----------|---------------|
| 200  | OK | Successful GET, PUT, PATCH, or DELETE | Use for any successful request that doesn't create a new resource |
| 201  | Created | Successful POST | Include the location of the new resource in the response header |
| 204  | No Content | Successful operation with no content to return (e.g., DELETE) | Use when the client doesn't need a response body |
| 400  | Bad Request | Invalid request payload or parameters | Provide clear error messages to help the client correct the request |
| 401  | Unauthorized | Accessing a protected resource without proper authentication | Use when authentication is required and has failed or not been provided |
| 403  | Forbidden | Authenticated user doesn't have access rights | Use when authentication succeeded but access is not allowed |
| 404  | Not Found | Accessing a non-existent resource | Use for missing resources, not for authorization issues |
| 500  | Internal Server Error | Unhandled exceptions, database connection failures | Log error details server-side, return generic error message to client |

#### Best Practices for HTTP Methods and Status Codes

::: tip
Use status codes consistently across your API.
:::

::: tip
Provide meaningful error messages along with error status codes.
:::

::: tip
Use 200 range status codes for successful operations, 400 range for client errors, and 500 range for server errors.
:::


#### Visual Guide: Choosing the Right HTTP Method
![An image](/http-method-decision.png)

By following these practices and understanding HTTP methods and status codes, you'll create more intuitive and standards-compliant APIs that are easier for developers to work with.


# Building Your First API (Simple CRUD)

In this section, we'll implement a simple CRUD (Create, Read, Update, Delete) API for a `Product` entity using Spring Boot. We'll create a basic project structure, and demonstrate how to set up and run the application.

## Setting up a Spring Boot Project

To generate a new Spring Boot project with all required dependencies, you can use the [Spring Initializer](https://start.spring.io/). Here are commands for both Gradle and Maven to easily setup your project instead of using the Starter UI:

::: code-group
```bash [gradle]
curl https://start.spring.io/starter.tgz -d type=gradle-project -d language=java -d bootVersion=3.2.3 -d baseDir=product-api -d groupId=com.example -d artifactId=product-api -d name=product-api -d description="Product API" -d packageName=com.example.productapi -d packaging=jar -d javaVersion=21 -d dependencies=web | tar -xzvf -
```

```bash [maven]
curl https://start.spring.io/starter.tgz -d type=maven-project -d language=java -d bootVersion=3.2.3 -d baseDir=product-api -d groupId=com.example -d artifactId=product-api -d name=product-api -d description="Product API" -d packageName=com.example.productapi -d packaging=jar -d javaVersion=21 -d dependencies=web | tar -xzvf -
```
:::


These commands will create a new directory called `product-api` with a basic Spring Boot project structure.

## Project Structure

After generating the project, you'll have a structure similar to this:

```
product-api/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── productapi/
│   │   │               └── ProductApiApplication.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│       └── java/
│           └── com/
│               └── example/
│                   └── productapi/
│                       └── ProductApiApplicationTests.java
├── .gitignore
├── build.gradle (or pom.xml for Maven)
└── README.md
```

## Maven vs Gradle

Both Maven and Gradle are build automation tools used for managing dependencies and building Java projects.

### Maven
- Uses XML for configuration (pom.xml)
- Has a fixed and opinionated build lifecycle
- Widely used and has extensive plugin ecosystem

### Gradle
- Uses Groovy or Kotlin DSL for configuration (build.gradle)
- More flexible and performant than Maven
- Gaining popularity, especially in Android development

## How to Start the Application

To start the Spring Boot application:

1. Navigate to the project directory:
   ```bash
   cd product-api
   ```

2. Run the application:

   ::: code-group
   ```bash [gradle]
   ./gradlew bootRun
   ```
   ```bash [maven]
   ./mvnw spring-boot:run
   ```
   :::

The application will start, and you should see output indicating that it's running, typically on `http://localhost:8080`.

## Implementing CRUD for Product Entity

Now, let's implement CRUD operations for the `Product` entity. We'll work on four main components: the main application class, the model, the service, and the controller.

### 1. Main Application Class `[Auto-Generated]`

```java:src/main/java/com/example/productapi/ProductApiApplication.java {6,9}
package com.example.productapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ProductApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProductApiApplication.class, args);
    }
}
```

This is the entry point of the Spring Boot application.
::: info
The `@SpringBootApplication` annotation combines `@Configuration`, `@EnableAutoConfiguration`, and `@ComponentScan`.
:::

### 2. Product Model

> Create a new package called `model` or `models` under `src/main/java/com/example/productapi/` and create the `Product.java` file inside it.

::: tip
This class represents your real life product entity you want to model.
Its attributes are the properties of the product. And the methods are the actions you can perform on the product.
:::

```java:src/main/java/com/example/productapi/model/Product.java
package com.example.productapi.model;

public class Product {
    private Long id;
    private String name;
    private String description;
    private double price;

    // Constructors, getters, and setters
    public Product() {}

    public Product(Long id, String name, String description, double price) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
}
```

This is a simple POJO (Plain Old Java Object) representing a Product.

### 3. Product Service

::: info
A service in Spring Boot is a component that encapsulates the business logic of an application. 
:::

::: tip 
This is a simple in-memory service that stores products in a list.
In a real-world application, you would use a database to store your data.
:::

> Create a new package called `service` or `services` under `src/main/java/com/example/productapi/` and create the `ProductService.java` file inside it.

```java:src/main/java/com/example/productapi/service/ProductService.java {10}
package com.example.productapi.service;

import com.example.productapi.model.Product;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {
    private List<Product> products = new ArrayList<>();
    private long nextId = 1;

    public List<Product> getAllProducts() {
        return new ArrayList<>(products);
    }

    public Optional<Product> getProductById(Long id) {
        return products.stream()
                .filter(product -> product.getId().equals(id))
                .findFirst();
    }

    public Product createProduct(Product product) {
        product.setId(nextId++);
        products.add(product);
        return product;
    }

    public Product updateProduct(Long id, Product productDetails) {
        for (int i = 0; i < products.size(); i++) {
            Product product = products.get(i);
            if (product.getId().equals(id)) {
                productDetails.setId(id);
                products.set(i, productDetails);
                return productDetails;
            }
        }
        throw new RuntimeException("Product not found");
    }

    public void deleteProduct(Long id) {
        products.removeIf(product -> product.getId().equals(id));
    }
}
```

This service class manages the business logic for products. It uses an in-memory list to store products instead of a database. The `@Service` annotation marks this as a Spring-managed service bean.

### 4. Product Controller
::: info
A controller in Spring Boot is a component that handles HTTP requests and responses.
:::

::: tip
 Make controllers as simple as possible and delegate the business logic to the service layer.
:::

> Create a new package called `controller` or `controllers` under `src/main/java/com/example/productapi/` and create the `ProductController.java` file inside it.

```java:src/main/java/com/example/productapi/controller/ProductController.java {11,12,14-15,22,29,34,44}
package com.example.productapi.controller;

import com.example.productapi.model.Product;
import com.example.productapi.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    @Autowired
    private ProductService productService;

    @GetMapping
    public List<Product> getAllProducts() {
        return productService.getAllProducts();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return productService.getProductById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Product createProduct(@RequestBody Product product) {
        return productService.createProduct(product);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product productDetails) {
        try {
            Product updatedProduct = productService.updateProduct(id, productDetails);
            return ResponseEntity.ok(updatedProduct);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok().build();
    }
}
```

The controller handles HTTP requests and responses. It's annotated with `@RestController`, which combines `@Controller` and `@ResponseBody`. The `@RequestMapping("/api/products")` sets the base path for all endpoints in this controller.

Key points:
- `@GetMapping`, `@PostMapping`, `@PutMapping`, and `@DeleteMapping` define the HTTP methods and paths for each operation.
- `@PathVariable` extracts values from the URL path.
- `@RequestBody` deserializes the request body into a Java object.
- `ResponseEntity` allows us to customize the HTTP response, including status codes.

## Testing the API

To test this API:

1. Start the application using `./gradlew bootRun` or `./mvnw spring-boot:run`.
2. Use tools like cURL, Postman, or any HTTP client to send requests to `http://localhost:8080/api/products`.

Example cURL commands:

1. Create a product:
   ```bash
   curl -X POST -H "Content-Type: application/json" -d '{"name":"Example Product","description":"This is a test product","price":19.99}' http://localhost:8080/api/products
   ```

2. Get all products:
   ```bash
   curl http://localhost:8080/api/products
   ```

3. Get a specific product (replace {id} with an actual id):
   ```bash
   curl http://localhost:8080/api/products/{id}
   ```

4. Update a product (replace {id} with an actual id):
   ```bash
   curl -X PUT -H "Content-Type: application/json" -d '{"name":"Updated Product","description":"This is an updated product","price":29.99}' http://localhost:8080/api/products/{id}
   ```

5. Delete a product (replace {id} with an actual id):
   ```bash
   curl -X DELETE http://localhost:8080/api/products/{id}
   ```

::: warning
Remember that this in-memory implementation will lose all data when the application is restarted. In a real-world scenario, you'd typically use a database for persistent storage.
:::

This completes the basic CRUD API implementation for the `Product` entity using Spring Boot.

## Summary

In this milestone, we've covered:

- The basics of API development and the role of HTTP methods and status codes.
- How to set up and run a Spring Boot project.
- How to implement CRUD operations for a `Product` entity.
- How to test the API using cURL commands.

[View Complete Code Here](https://github.com/sardul3/product-api/tree/milestone-1)
<TextToSpeech />