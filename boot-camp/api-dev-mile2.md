# Database Integration and More <Label text="M2" type="milestone" />

::: tip
This guide builds upon the basics learned in [Milestone #1](/boot-camp/api-dev-mile1), introducing database integration and more.
:::

## Introduction

In this milestone, we'll enhance our e-commerce products API by integrating a database, and add advanced features such as input validation and error handling.

## Choosing the Right Database

When selecting a database for your application, consider the following factors:

| Factor | Consideration |
|--------|---------------|
| Data structure | Is your data relational or non-relational? |
| Scalability needs | How much data do you expect to handle? |
| Query complexity | Will you need to perform complex joins or aggregations? |
| Consistency requirements | Do you need strong consistency or is eventual consistency acceptable? |

### Relational Databases (e.g., PostgreSQL, MySQL)

Relational databases are ideal for structured data with complex relationships. They excel in:



- Ensuring data integrity through ACID properties
- Complex queries and joins
- Strict schema enforcement

::: info Structured Data
Structured data is organized in a predefined format, typically in tables with rows and columns. 
:::

::: tip ACID Properties
- Atomicity: All operations in a transaction succeed or all fail.
- Consistency: The database remains in a valid state before and after a transaction.
- Isolation: Concurrent transactions don't interfere with each other.
- Durability: Completed transactions are permanently saved.

These properties ensure reliable processing of database transactions.
:::

### NoSQL Databases (e.g., MongoDB)

NoSQL databases are suitable for:



- Handling large volumes of unstructured or semi-structured data
- Horizontal scaling
- Flexible schema design

::: info Unstructured Data
Unstructured data lacks a predefined model or organization. For example, social media posts, which can include text, images, videos, and varying metadata, are typically unstructured. NoSQL databases can easily store and retrieve such diverse data types.
:::

::: tip Horizontal Scaling
Horizontal scaling (or scaling out) means adding more machines to a system to handle increased load. NoSQL databases are designed to distribute data across multiple servers easily, allowing them to handle massive amounts of data and traffic by simply adding more servers to the cluster.
:::


::: info Flexible Schema
NoSQL databases often use flexible schemas, allowing you to store different types of data in the same collection. For example, in a document database like MongoDB, you could have a "Users" collection where some documents include a "phone" field while others don't, without needing to alter the schema.

Example:
```json
// User 1
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "phone": "123-456-7890"
}

// User 2
{
  "id": 2,
  "name": "Bob",
  "email": "bob@example.com"
}
```
Both documents can coexist in the same collection despite having different fields.
:::


They sacrifice some consistency for better performance and scalability.

### Our Choice: H2 Database

For this milestone, we'll use H2, an in-memory database. Here's a decision matrix explaining our choice:

| Factor | H2 | PostgreSQL | MongoDB |
|--------|-------|------------|---------|
| Ease of setup | ✅ Very easy, no installation required | ⚠️ Requires installation and configuration | ⚠️ Requires installation and configuration |
| In-memory capability | ✅ Built-in | ❌ Not available | ❌ Not available |
| Persistence | ✅ Optional (can be configured) | ✅ Built-in | ✅ Built-in |
| SQL compatibility | ✅ High | ✅ High | ❌ Limited (uses NoSQL query language) |
| Performance for small datasets | ✅ Excellent | ✅ Good | ✅ Good |
| Scalability for large datasets | ❌ Limited | ✅ Excellent | ✅ Excellent |
| Suitable for production | ❌ Not recommended | 

H2 is perfect for development and testing due to its ease of setup and in-memory capabilities. Later, we'll provide instructions on how to switch to a production-ready database like PostgreSQL.

## Integrating H2 Database

1. Add H2 dependency to your `build.gradle` or `pom.xml`:

   ::: code-group
   ```groovy [Gradle]
   dependencies {
       implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
       runtimeOnly 'com.h2database:h2'
   }
   ```
   ```xml [Maven]
   <dependencies>
       <dependency>
           <groupId>org.springframework.boot</groupId>
           <artifactId>spring-boot-starter-data-jpa</artifactId>
       </dependency>
       <dependency>
           <groupId>com.h2database</groupId>
           <artifactId>h2</artifactId>
           <scope>runtime</scope>
       </dependency>
   </dependencies>
   ```
   :::

2. Configure H2 in `application.yml`:
::: tip
 The auto-generated project already has a file `application.properties`
 It is my personal preference to use `application.yml` instead to manage app configurations
:::
Add the following to `application.yml`:
   ```yaml
   spring:
     application:
       name: product-api
     datasource:
       url: jdbc:h2:mem:testdb
       driver-class-name: org.h2.Driver
       username: sa
       password: password
     jpa:
       database-platform: org.hibernate.dialect.H2Dialect
     h2:
       console:
         enabled: true
   ```
::: tip What is JPA?
JPA (Java Persistence API) is a specification for accessing, persisting, and managing data between Java objects and a relational database. Spring Data JPA is a part of the larger Spring Data project and makes it easy to implement JPA-based repositories.
:::
## Model Entities and Relationships
Let's define our main entities.
For now, we can just get away with having Product entity with no relationships for simplicity's sake.
However, in a real-world application, we would want to have more entities and relationships to better model the problem we are trying to solve.
So, for this demo, just creating the Product entity will suffice but feel free to follow through and add the rest of the entities and relationships provided in this guide.


#### Introducing Lombok

Lombok is a Java library that helps reduce boilerplate code in your Java classes. It uses annotations to automatically generate common code patterns at compile-time, such as getters, setters, constructors, and more. This leads to cleaner, more readable code and saves developers time and effort.

Key benefits of using Lombok include:
- Reduced code verbosity
- Fewer errors from manually written boilerplate code
- Easier maintenance of classes
- Improved code readability

Now, let's add Lombok to our project:

::: code-group
```groovy [Gradle]
dependencies {
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
}
```

```xml [Maven]
<dependencies>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <version>1.18.22</version>
        <scope>provided</scope>
    </dependency>
</dependencies>
```
:::

::: tip
Make sure to enable annotation processing in your IDE to use Lombok effectively.
:::

### Product Entity
Now, we will refactor the `Product.java` file in the `src/main/java/com/example/demo/model` directory to use JPA annotations and Lombok, transforming it from a simple POJO to a DB entity:

```java{1-4,7-10,12,14,16,17,19,21,22}
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import javax.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    // TODO: Remove this if you want to just add Product entity with no relationships for now
    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;
}
```

Let's break down the changes:

1. We've added Lombok annotations:
   - `@Data`: Generates getters, setters, `toString()`, `equals()`, and `hashCode()` methods.
   - `@NoArgsConstructor`: Generates a no-args constructor.
   - `@AllArgsConstructor`: Generates a constructor with all fields as arguments.

2. We've added JPA annotations:
   - `@Entity`: Marks the class as a JPA entity.
   - `@Table(name = "products")`: Specifies the table name in the database.
   - `@Id`: Marks the field as the primary key.
   - `@GeneratedValue(strategy = GenerationType.IDENTITY)`: Configures the way of increment for the specified column (field).
   - `@Column(nullable = false)`: Specifies that the column cannot contain null values.
   - `@ManyToOne`: Defines a many-to-one relationship between Product and Category.
   - `@JoinColumn(name = "category_id")`: Specifies the foreign key column for the Category relationship.

These changes transform our simple POJO into a JPA entity with Lombok-generated boilerplate code, making it ready for database operations and reducing the amount of code we need to write manually.


### Category Entity
```java{1,2,6,7,8,11,13,14}
@Entity 
@Table(name = "categories") 
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Category {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    private Long id;

    @Column(nullable = false, unique = true) 
    private String name;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL) // 7️⃣
    private List<Product> products = new ArrayList<>();
}
```

### Customer Entity
```java
@Entity
@Table(name = "customers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL)
    private List<Order> orders = new ArrayList<>();
}
```

### Order Entity
```java{1,2,6,7,8,11,13,15,16}
@Entity 
@Table(name = "orders") 
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    private Long id;

    @ManyToOne 
    @JoinColumn(name = "customer_id", nullable = false) // 9️⃣
    private Customer customer;

    @ManyToMany 
    @JoinTable( // 🔟
        name = "order_products",
        joinColumns = @JoinColumn(name = "order_id"),
        inverseJoinColumns = @JoinColumn(name = "product_id")
    )
    private List<Product> products = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime orderDate;

    @Enumerated(EnumType.STRING) // 8️⃣
    private OrderStatus status;
}
```
| 🔖 | Annotation | Explanation |
|----|------------|-------------|
| 1️⃣ | `@Entity` | Marks the class as a JPA entity |
| 2️⃣ | `@Table` | Specifies the table name in the database |
| 3️⃣ | `@Id` | Marks the field as the primary key |
| 4️⃣ | `@GeneratedValue` | Configures the way of increment of the specified column(field) |
| 5️⃣ | `@Column` | Specifies the mapped column for a persistent property or field |
| 6️⃣ | `@ManyToOne` | Defines a many-to-one relationship between entities |
| 7️⃣ | `@OneToMany` | Defines a one-to-many relationship between entities |
| 8️⃣ | `@Enumerated` | Specifies that the field is an enumerated type |
| 9️⃣ | `@JoinColumn` | Specifies a column for joining an entity association |
| 🔟 | `@JoinTable` | Specifies the mapping of a many-to-many relationship |


These entities define the following relationships:
![db-flow](/db-flow.png)
Relationship Explanations:

1. Category to Products (One-to-Many)
   - 🔗 A category can contain multiple products
   - 🚫 A product must belong to one category
   - 🏷️ JPA: `@OneToMany` on Category, `@ManyToOne` on Product
   - ⚠️ Deleting a category may affect its products

2. Customer to Orders (One-to-Many)
   - 🔗 A customer can place multiple orders
   - 🚫 An order must be associated with one customer
   - 🏷️ JPA: `@OneToMany` on Customer, `@ManyToOne` on Order
   - ⚠️ Deleting a customer may affect their orders

3. Order to Products (Many-to-Many)
   - 🔗 An order can include multiple products
   - ��� A product can be part of multiple orders
   - 🏷️ JPA: `@ManyToMany` on both Order and Product
   - 📊 Requires a join table (e.g., `order_products`)

Key Considerations:
- 🔑 Use `mappedBy` to indicate the non-owning side of relationships
- 💾 The owning side (usually 'many' side) persists the relationship
- 🔄 Be cautious with cascade operations to avoid unintended data loss
- 🛠️ Customize join tables with `@JoinTable` if needed

::: info Understanding Cascading
Cascading in JPA defines how state changes are propagated from parent entities to child entities. For example, `CascadeType.ALL` means that all operations (PERSIST, MERGE, REMOVE, REFRESH, DETACH) on a parent entity will be cascaded to the associated child entities. Be cautious when using cascades, especially with REMOVE operations, as they can lead to unintended data loss.
:::

## Implementing Repositories and Services

Create repository interface for our entity under `src/main/java/com/example/productapi/repository` directory:

```java
package com.example.productapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.productapi.model.Product;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {}
```
::: info TASK
Implement the repository interfaces for the remaining entities.
:::

#### Service Layer
The service layer in a Spring Boot application serves several important purposes:

1. **Business Logic**: It encapsulates the core business logic of the application, separating it from the web layer and data access layer.

2. **Abstraction**: It provides an abstraction over the repository layer, allowing you to change the underlying data access implementation without affecting the rest of the application.

3. **Transaction Management**: Services are typically where you define transaction boundaries, ensuring that complex operations are atomic.

4. **Integration Point**: The service layer often integrates multiple repositories or external services to provide higher-level functionality.

5. **Validation and Error Handling**: While basic validation can be done at the DTO level, more complex validation logic often resides in the service layer.

6. **Security**: Authorization checks are often implemented at the service layer to ensure that operations are allowed before accessing the data layer.

::: tip
By using a service layer, you create a more modular, maintainable, and testable application structure.
:::
So, lets update the service class for the `Product` entity under `src/main/java/com/example/productapi/service` directory to 
account for the DB changes as opposed to in-memmory implementation we used in Milestone #1:
```java
package com.example.productapi.service;

import com.example.productapi.model.Product;
import com.example.productapi.repository.ProductRepository;
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
            .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product productDetails) {
        Product product = getProductById(id);
        product.setName(productDetails.getName());
        product.setDescription(productDetails.getDescription());
        product.setPrice(productDetails.getPrice());
        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        productRepository.delete(product);
    }
}
```

::: warning PRACTICE
Implement similar service classes for other entities.
:::

## Input Validation and DTOs

### Adding Spring Boot Validation Starter

Before we implement DTOs with validation, we need to add the Spring Boot validation starter to our project. This starter provides support for Java Bean Validation API.

Add the following dependency to your `build.gradle` or `pom.xml` file:

::: code-group
```groovy [Gradle]
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-validation'
}
```
```xml [Maven]
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
</dependencies>
```
:::

### Using Bean Validation Annotations

Bean Validation annotations provide a powerful way to enforce data integrity in your DTOs (Data Transfer Objects). Here's an example of a ProductDTO with validation annotations created under `src/main/java/com/example/productapi/dto` directory:

```java{12,15,18,21,22}
package com.example.productapi.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ProductDto {
    @NotBlank(message = "Name cannot be empty")
    private String name;

    @Size(max = 500, message = "Description must be less than 500 characters")
    private String description;

    @Positive(message = "Price must be positive")
    @DecimalMin(value = "0.01", message = "Price must be at least 0.01")
    private BigDecimal price;
}


```
<details>
  <summary>Other DTOs</summary>

```java
public class CategoryDTO {
    @NotBlank(message = "Category name is required")
    @Size(max = 100, message = "Category name must be less than 100 characters")
    private String name;
}
```
``` java
public class CustomerDTO {
    @NotBlank(message = "Customer name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
}
```
``` java
public class OrderDTO {
    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotEmpty(message = "Order must contain at least one product")
    private List<Long> productIds;

    @NotNull(message = "Order date is required")
    private LocalDateTime orderDate;

    @NotNull(message = "Order status is required")
    private OrderStatus status;
}
```
</details> 

::: tip Why Use DTOs?
DTOs (Data Transfer Objects) are used to transfer data between different layers of your application. They help to:
1. Decouple your API from your domain model
2. Control what data is exposed to the client
3. Version your API independently of your domain model
4. Optimize data transfer by including only necessary fields
:::

::: info Separating DTOs and Entity Classes
It's a good practice to keep DTOs separate from entity classes because:
1. It allows you to evolve your API and domain model independently
2. You can add validation specific to the API layer without affecting the domain model
3. It prevents accidental exposure of sensitive data or internal implementation details
4. It allows for easier versioning of your API
:::

### Common Validation Annotations

Here's a list of other commonly used validation annotations:

| Annotation | Description |
|------------|-------------|
| `@NotNull` | The value cannot be null |
| `@NotEmpty` | The value cannot be null or empty (for strings, collections, maps, and arrays) |
| `@NotBlank` | The value cannot be null and must contain at least one non-whitespace character |
| `@Min` | The value must be greater than or equal to the specified minimum |
| `@Max` | The value must be less than or equal to the specified maximum |
| `@Size` | The size of the value must be between the specified boundaries |
| `@Email` | The value must be a valid email address |
| `@Pattern` | The value must match the specified regular expression |
| `@Past` | The date must be in the past |
| `@Future` | The date must be in the future |
| `@AssertTrue` | The value must be true |
| `@AssertFalse` | The value must be false |

### Using Records for DTOs

Starting from Java 16, you can use records to create more concise DTOs. Here's an example of the ProductDTO as a record:

```java
public record ProductDTO(
    @NotBlank(message = "Product name is required")
    String name,

    @Size(max = 500, message = "Description must be less than 500 characters")
    String description,

    @Positive(message = "Price must be positive")
    @DecimalMin(value = "0.01", message = "Price must be at least 0.01")
    BigDecimal price,

    @NotNull(message = "Category ID is required")
    Long categoryId
) {}
```

Records automatically provide constructors, getters, `equals()`, `hashCode()`, and `toString()` methods, making them ideal for simple DTOs.

::: tip
While records are great for simple DTOs, traditional classes might be more suitable for complex DTOs that require additional methods or mutable fields.
:::

By using these validation annotations and DTOs, you can ensure that your API receives valid data and maintains a clean separation between your API contract and your domain model.

## Controller Endpoints Refactoring
Since, we have modified our service layer to use the database, our controller class is out of sync as it is not utilizing both the DTOs and the service layer.

Lets refactor the controller class to use the DTOs and the service layer so that when a user sends in a request, it is validated and then sent to the service layer to be processed. At the end, it is saved to the database.

Within `src/main/java/com/example/productapi/controller` directory, update the `ProductController` class to use the DTOs and the service layer:

```java
package com.example.productapi.controller;

import com.example.productapi.dto.ProductDto;
import com.example.productapi.model.Product;
import com.example.productapi.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<ProductDto>> getAllProducts() {
        List<ProductDto> products = productService.getAllProducts().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(products);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProductById(@PathVariable Long id) {
        try {
            Product product = productService.getProductById(id);
            return ResponseEntity.ok(convertToDTO(product));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<ProductDto> createProduct(@Valid @RequestBody ProductDto productDTO) {
        Product product = convertToEntity(productDTO);
        Product createdProduct = productService.createProduct(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(convertToDTO(createdProduct));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDto> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductDto productDTO) {
        try {
            Product product = convertToEntity(productDTO);
            Product updatedProduct = productService.updateProduct(id, product);
            return ResponseEntity.ok(convertToDTO(updatedProduct));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        try {
            productService.deleteProduct(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private ProductDto convertToDTO(Product product) {
        ProductDto dto = new ProductDto();
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setPrice(product.getPrice());
        return dto;
    }

    private Product convertToEntity(ProductDto dto) {
        Product product = new Product();
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        return product;
    }
}
```

::: tip
At the moment, we are using custom mappers. We can this further by using mapping libs like MapStruct or ModelMapper. We will cover this later in the course.
:::

::: info
As a general convention, all private methods tend to be located at the bottom of the class.
:::

::: warning Assignment
If you added other entities, practice by implementing the controller endpoints for the new entities and services as well.
Create API endpoints for the following usecases:
    - Create a new order
    - Update an existing order
    - Delete an existing order
    - Get all orders for a customer
    - Get all orders for a product
:::

### Explanation of Annotations and DTOs

1. `@Valid`: This annotation triggers validation of the annotated argument. When applied to a method parameter, it tells Spring to validate the object before invoking the method. This is where the DTO validation annotations we implemented earlier come into play.

2. `@RequestBody`: This annotation indicates that the method parameter should be bound to the body of the web request. Spring automatically deserializes the JSON into a Java type.

### Common REST Controller Annotations

Here are other commonly used annotations within a Spring Boot REST controller:

| Annotation | Description |
|------------|-------------|
| `@RestController` | Combines `@Controller` and `@ResponseBody`, simplifying the creation of RESTful web services |
| `@RequestMapping` | Maps HTTP requests to handler methods of MVC and REST controllers |
| `@GetMapping` | Shortcut for `@RequestMapping(method = RequestMethod.GET)` |
| `@PostMapping` | Shortcut for `@RequestMapping(method = RequestMethod.POST)` |
| `@PutMapping` | Shortcut for `@RequestMapping(method = RequestMethod.PUT)` |
| `@DeleteMapping` | Shortcut for `@RequestMapping(method = RequestMethod.DELETE)` |
| `@PatchMapping` | Shortcut for `@RequestMapping(method = RequestMethod.PATCH)` |
| `@PathVariable` | Indicates that a method parameter should be bound to a URI template variable |
| `@RequestParam` | Indicates that a method parameter should be bound to a web request parameter |
| `@RequestHeader` | Indicates that a method parameter should be bound to a web request header |

### Why Return ResponseEntity

We always return `ResponseEntity` instead of plain Java objects for several reasons:

1. **Status Code Control**: `ResponseEntity` allows us to set the HTTP status code explicitly. This is crucial for RESTful APIs to communicate the result of the operation accurately.

2. **Header Manipulation**: We can add or modify response headers when needed, which is not possible with plain Java objects.

3. **Body Flexibility**: `ResponseEntity` allows us to return different types of responses, including empty responses, which is useful for operations that don't need to return data.

4. **Consistency**: Using `ResponseEntity` consistently across all endpoints makes the API more predictable and easier to consume.

5. **Error Handling**: It's easier to handle errors uniformly when all endpoints return `ResponseEntity`.

::: tip
While it's possible to use `@ResponseStatus` on methods to set status codes and return plain objects, using `ResponseEntity` gives you more control and flexibility in a single, cohesive API.
:::

By using these annotations, DTOs, and `ResponseEntity`, we create a well-structured, validated, and flexible API that adheres to RESTful principles and provides clear, consistent responses to clients.

## Switching to a Production Database

To switch from H2 to a production database like PostgreSQL:

1. Add the appropriate dependency to your `build.gradle` or `pom.xml`:

   ::: code-group
   ```groovy [Gradle]
   dependencies {
       implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
       runtimeOnly 'com.h2database:h2' // [!code --]
       runtimeOnly 'org.postgresql:postgresql' // [!code ++]
   }
   ```
   ```xml [Maven]
   <dependencies>
       <dependency>
           <groupId>org.springframework.boot</groupId>
           <artifactId>spring-boot-starter-data-jpa</artifactId>
       </dependency>
       <dependency> // [!code --]
           <groupId>com.h2database</groupId> // [!code --]
           <artifactId>h2</artifactId> // [!code --]
           <scope>runtime</scope> // [!code --]
       </dependency> // [!code --]
       <dependency> // [!code ++]
           <groupId>org.postgresql</groupId> // [!code ++]
           <artifactId>postgresql</artifactId> // [!code ++]
           <scope>runtime</scope> // [!code ++]
       </dependency> // [!code ++]
   </dependencies>
   ```
   :::

2. Update `application.yml`:

   ```yaml
   spring:
     datasource:
       url: jdbc:h2:mem:testdb // [!code --]
       driver-class-name: org.h2.Driver // [!code --]
       username: sa // [!code --]
       password: password // [!code --]
       url: jdbc:postgresql://localhost:5432/your_database // [!code ++]
       username: your_username // [!code ++]
       password: your_password // [!code ++]
     jpa:
       database-platform: org.hibernate.dialect.H2Dialect // [!code --]
       properties:
         hibernate:
           dialect: org.hibernate.dialect.PostgreSQLDialect // [!code ++]
       hibernate:
         ddl-auto: update // [!code ++]
     h2: // [!code --]
       console: // [!code --]
         enabled: true // [!code --]
   ```

3. Remove H2-specific configurations and dependencies.

::: tip
Remember to create the PostgreSQL database and user before running your application with the new configuration.
:::

::: warning
When switching to a production database, ensure that you have proper security measures in place, such as using environment variables for sensitive information like database credentials.
:::

::: info Understanding spring.jpa.hibernate.ddl-auto
The `ddl-auto` setting controls how Hibernate handles database schema generation. Common values include:
- `update`: Update the schema if necessary
- `create`: Creates the schema, destroying previous data
- `create-drop`: Creates the schema and drops it when the SessionFactory closes
- `validate`: Validates the schema, makes no changes to the database
- `none`: Does nothing with the schema, makes no changes to the database

For production, it's often recommended to use `validate` or `none` and manage schema changes manually.
:::

## Testing Your Application

Now that you've set up your application, let's test it and verify that data is being saved to the database.

> Start your Spring Boot application (if it's not already running).

Test the endpoints using a tool like Postman or cURL:

    a. Create a product:
```bash
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "This is a test product",
    "price": 19.99
  }'
```

    b. Get all products:
```bash
curl http://localhost:8080/api/products
```

    c. Get a specific product:
```bash
curl http://localhost:8080/api/products/1
```

    d. Update a product:
```bash
curl -X PUT http://localhost:8080/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Product",
    "description": "This is an updated test product",
    "price": 24.99
  }'
```

::: warning
Sending in a invalid req such as invalid price or description length will result in a 400 Bad Request response but there is no appropriate and meaningful error message for the user. We will fix this in the next milestone where we will implement a global exception handler with meaningful error messages.
:::

 To verify if data was saved to the H2 database:
1. Access the H2 console by navigating to `http://localhost:8080/h2-console` in your web browser.

2. Use the following settings to connect:
    - JDBC URL: `jdbc:h2:mem:testdb`
    - User Name: `sa`
    - Password: `password`
3. Once connected, you can run SQL queries to check the data, e.g.:
       ```sql
       SELECT * FROM PRODUCTS;
       ```

By following these steps, you can test your application's endpoints and verify that data is being correctly saved to and retrieved from the H2 database.

## Summary

In this milestone, we've covered:
- Database selection considerations
- Integrating H2 database
- Modeling entity relationships
- Implementing repositories and services
- Simple Payload / Input validation 
- Refactoring with Lombok

These enhancements provide a solid foundation for building a robust, scalable e-commerce API.

[View Complete Code Here](https://github.com/sardul3/product-api/tree/milestone-2)

<TextToSpeech />





