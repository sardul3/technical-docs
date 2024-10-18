# Database Integration and More <Label text="M2" type="milestone" />

::: tip
This guide builds upon the basics learned in [Milestone #1](/api-dev-mile1), introducing database integration, more complex entity relationships, and advanced API features.
:::

## Introduction

In this milestone, we'll enhance our e-commerce API by integrating a database, implementing more complex entity relationships, and adding advanced features such as input validation and error handling.

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
Structured data is organized in a predefined format, typically in tables with rows and columns. For example, a "Customer" table might have columns for ID, Name, Email, and Address, with each row representing a unique customer.
:::

::: tip ACID Properties
- Atomicity: All operations in a transaction succeed or all fail.
- Consistency: The database remains in a valid state before and after a transaction.
- Isolation: Concurrent transactions don't interfere with each other.
- Durability: Completed transactions are permanently saved.

These properties ensure reliable processing of database transactions.
:::

#### Database Normalization

Normalization is the process of organizing data to reduce redundancy and improve data integrity. The main normal forms are:

1. First Normal Form (1NF): Eliminate repeating groups
2. Second Normal Form (2NF): Remove partial dependencies
3. Third Normal Form (3NF): Remove transitive dependencies

::: info Normalization Example
Consider a table "Orders" with columns: OrderID, CustomerName, ProductID, ProductName, Quantity.

To normalize:
1. 1NF: Ensure each column contains atomic values (already satisfied).
2. 2NF: Create separate tables for Customers and Products, linking them to Orders via IDs.
3. 3NF: Move any columns that depend on non-key fields (e.g., ProductName depends on ProductID) to their respective tables.

Result: 
- Orders (OrderID, CustomerID, ProductID, Quantity)
- Customers (CustomerID, CustomerName)
- Products (ProductID, ProductName)

This structure reduces data redundancy and improves data integrity.
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

   ```yaml
   spring:
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
Let's define our main entities: Products, Categories, Customers, and Orders.

### Product Entity
```java{1,2,6,7,8,9,11,13,15,16}
@Entity // 1️⃣
@Table(name = "products") // 2️⃣
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    @Id // 3️⃣
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 4️⃣
    private Long id;

    @Column(nullable = false) // 5️⃣
    private String name;

    private String description;

    @Column(nullable = false) // 5️⃣
    private BigDecimal price;

    @ManyToOne // 6️⃣
    @JoinColumn(name = "category_id") // 9️⃣
    private Category category;
}
```
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
   - 🔗 A product can be part of multiple orders
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

Create repository interfaces for each entity:

```java
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
```java
@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    // ... other methods
}
```

::: warning PRACTICE
Implement similar service classes for other entities.
:::

## Input Validation and DTOs

### Using Bean Validation Annotations

Bean Validation annotations provide a powerful way to enforce data integrity in your DTOs (Data Transfer Objects). Here's an example of a ProductDTO with validation annotations:


```java{2,5,8,9,12}
public class ProductDTO {
    @NotBlank(message = "Product name is required")
    private String name;

    @Size(max = 500, message = "Description must be less than 500 characters")
    private String description;

    @Positive(message = "Price must be positive")
    @DecimalMin(value = "0.01", message = "Price must be at least 0.01")
    private BigDecimal price;

    @NotNull(message = "Category ID is required")
    private Long categoryId;
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

## New Endpoints

Add these new endpoints to your controllers:

1. Add a category:
   ```java
   @PostMapping("/categories")
   public ResponseEntity<CategoryDTO> createCategory(@Valid @RequestBody CategoryDTO categoryDTO) {
       Category category = categoryService.createCategory(categoryDTO);
       return ResponseEntity.status(HttpStatus.CREATED).body(mapToDTO(category));
   }
   ```

2. Place an order:
   ```java
   @PostMapping("/orders")
   public ResponseEntity<OrderDTO> placeOrder(@Valid @RequestBody OrderRequestDTO orderRequestDTO) {
       Order order = orderService.placeOrder(orderRequestDTO);
       return ResponseEntity.status(HttpStatus.CREATED).body(mapToDTO(order));
   }
   ```

3. Track order status:
   ```java
   @GetMapping("/orders/{id}/status")
   public ResponseEntity<OrderStatusDTO> getOrderStatus(@PathVariable Long id) {
       OrderStatus status = orderService.getOrderStatus(id);
       return ResponseEntity.ok(new OrderStatusDTO(id, status));
   }
   ```

4. Create a new customer:
   ```java
   @PostMapping("/customers")
   public ResponseEntity<CustomerDTO> createCustomer(@Valid @RequestBody CustomerDTO customerDTO) {
       Customer customer = customerService.createCustomer(customerDTO);
       return ResponseEntity.status(HttpStatus.CREATED).body(mapToDTO(customer));
   }
   ```

### Explanation of Annotations and DTOs

1. `@Valid`: This annotation triggers validation of the annotated argument. When applied to a method parameter, it tells Spring to validate the object before invoking the method.

2. `@RequestBody`: This annotation indicates that the method parameter should be bound to the body of the web request. Spring automatically deserializes the JSON into a Java type.

3. DTOs (Data Transfer Objects): We use DTOs (e.g., `CategoryDTO`, `OrderRequestDTO`) to define the structure of the data being sent to or from the API. This allows us to control exactly what data is exposed and validate it independently of our domain model.

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

## Lombok: Reducing Boilerplate Code

Lombok is a Java library that helps reduce boilerplate code in your Java classes. It uses annotations to automatically generate common code patterns at compile-time, such as getters, setters, constructors, and more. This leads to cleaner, more readable code and saves developers time and effort.

### How Lombok Helps Developers

1. **Code Reduction**: Lombok significantly reduces the amount of code you need to write manually. For example, instead of writing dozens of lines for getters and setters, you can use a single `@Data` annotation.

2. **Improved Readability**: By eliminating boilerplate code, your classes become more concise and easier to read, focusing on the essential business logic.

3. **Reduced Error Potential**: Automatically generated code is less prone to errors that can occur when manually writing repetitive code.

4. **Easy Maintenance**: When you need to add or remove fields, Lombok automatically updates related methods, reducing the risk of inconsistencies.

5. **Flexibility**: Lombok provides fine-grained control over generated code through its various annotations and parameters.

### Common Lombok Annotations

We've already used Lombok annotations in our entity classes. Here's a quick overview of useful Lombok annotations:

- `@Data`: Generates getters, setters, toString, equals, and hashCode methods
- `@NoArgsConstructor`: Generates a no-args constructor
- `@AllArgsConstructor`: Generates a constructor with all fields as arguments
- `@Builder`: Implements the Builder pattern
- `@Slf4j`: Adds a logger field
- `@Getter` / `@Setter`: Generates getters and setters for fields
- `@EqualsAndHashCode`: Generates `equals()` and `hashCode()` methods
- `@ToString`: Generates a `toString()` method

::: tip
While Lombok can greatly reduce boilerplate code, it's important to understand what code it's generating. IDEs with Lombok plugins can help you view the generated code.
:::

::: info
By using Lombok, you can write more concise and maintainable Java code, allowing you to focus on the core functionality of your application rather than repetitive boilerplate code.
:::

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

## Summary

In this milestone, we've covered:
- Database selection considerations
- Integrating H2 database
- Modeling entity relationships
- Implementing repositories and services
- Input validation and centralized error handling
- Adding new endpoints for extended functionality
- Refactoring with Lombok
- Instructions for switching to a production database

These enhancements provide a solid foundation for building a robust, scalable e-commerce API.

<TextToSpeech />
