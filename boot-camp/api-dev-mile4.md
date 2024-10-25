<ProgressBar />

# Content Negotiation, links and more <Label text="M4" type="milestone" />

In this milestone, we'll explore advanced techniques to enhance our API's functionality, flexibility, and developer experience. We'll cover object mapping, content negotiation, and HATEOAS

::: tip What you'll learn
- How to use MapStruct for efficient object mapping
- Implementing content negotiation in Spring Boot
- Adding HATEOAS to make your API more discoverable
:::

## Object Mapping with MapStruct

### Introduction to DTO Pattern

Data Transfer Objects (DTOs) are objects that carry data between processes or layers in an application. In the context of API development, DTOs are particularly useful for separating your internal data model (often represented by entity classes) from the data representation you expose to clients through your API.


::: info Why use DTOs?
- Control what data is exposed to clients
- Optimize network traffic by sending only necessary data
- Decouple your API contract from your internal data structures
:::

### Why Use MapStruct?

MapStruct is a code generator library that greatly simplifies the process of converting between different object types, such as entities and DTOs.

::: tip Benefits of MapStruct
- Reduced boilerplate code
- Type-safe mappings
- High performance
:::

### Implementing MapStruct in Our API

To add MapStruct to our project, we need to include the necessary dependencies and configure the build process. Here are the steps for both Maven and Gradle:

#### Maven Setup

1. Add the following dependencies to your `pom.xml`:

::: code-group

```groovy [gradle]
// ... rest of the file ... 

ext {
    mapstructVersion = "1.5.3.Final"
}

dependencies {
    implementation "org.mapstruct:mapstruct:${mapstructVersion}"
    annotationProcessor "org.mapstruct:mapstruct-processor:${mapstructVersion}"
}

tasks.withType(JavaCompile) {
    options.compilerArgs = [
        '-Amapstruct.defaultComponentModel=spring'
    ]
}
```

```xml [maven]
<properties>
    <org.mapstruct.version>1.5.3.Final</org.mapstruct.version>
</properties>

<dependencies>
    <dependency>
        <groupId>org.mapstruct</groupId>
        <artifactId>mapstruct</artifactId>
        <version>${org.mapstruct.version}</version>
    </dependency>
</dependencies>

 <!-- ... rest of the file ...  -->
...
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.8.1</version>
            <configuration>
                <source>1.8</source> <!-- or higher, depending on your Java version -->
                <target>1.8</target>
                <annotationProcessorPaths>
                    <path>
                        <groupId>org.mapstruct</groupId>
                        <artifactId>mapstruct-processor</artifactId>
                        <version>${org.mapstruct.version}</version>
                    </path>
                </annotationProcessorPaths>
            </configuration>
        </plugin>
    </plugins>
</build>
```

```groovy [changelog - build.gradle]
plugins {
	id 'java'
	id 'org.springframework.boot' version '3.2.3'
	id 'io.spring.dependency-management' version '1.1.4'
}

group = 'com.example'
version = '0.0.1-SNAPSHOT'

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(21)
	}
}

repositories {
	mavenCentral()
}

ext { // [!code ++] 
    mapstructVersion = "1.5.5.Final" // [!code ++]
} // [!code ++] 

dependencies {
	implementation 'org.springframework.boot:spring-boot-starter-web'
	testImplementation 'org.springframework.boot:spring-boot-starter-test'
	implementation 'org.springframework.boot:spring-boot-starter-validation'
	implementation "org.springframework.boot:spring-boot-starter-aop"

	testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    runtimeOnly 'com.h2database:h2'
    
    implementation "org.mapstruct:mapstruct:${mapstructVersion}" // [!code ++]
    annotationProcessor "org.mapstruct:mapstruct-processor:${mapstructVersion}" // [!code ++]
}

tasks.named('test') {
	useJUnitPlatform()
}

tasks.withType(JavaCompile) { // [!code ++]
    options.compilerArgs = [ // [!code ++]
        '-Amapstruct.defaultComponentModel=spring' // [!code ++]
    ] // [!code ++]
} // [!code ++]
```
:::

::: tip
The `defaultComponentModel=spring` compiler argument tells MapStruct to generate Spring-compatible mapper implementations.
:::

## Current Mapping Setup

Currently, you're using manual mapping methods to convert between `Product` entities and `ProductDto` objects:

```java
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
```

::: info Drawbacks of Manual Mapping
1. **Verbose**: You need to write and maintain separate methods for each conversion.
2. **Error-prone**: It's easy to miss a field or make a typo when manually mapping.
3. **Maintenance overhead**: When you add or modify fields, you need to remember to update these methods.
4. **Lack of compile-time safety**: Errors in mapping are only caught at runtime.
:::

## How MapStruct Will Help

MapStruct is a code generation tool that will create these mapping methods for you at compile-time. Lets see it in action:

## Refactoring with MapStruct

Let's refactor our code to use MapStruct:

1. First, create a mapper interface inside the `com.example.productapi.mapper` package:

```java
package com.example.productapi.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

import com.example.productapi.dto.ProductDto;
import com.example.productapi.model.Product;

@Mapper(componentModel = "spring")
public interface ProductMapper {
    ProductMapper INSTANCE = Mappers.getMapper(ProductMapper.class);

    ProductDto productToProductDto(Product product);
    
    @Mapping(target = "id", ignore = true)
    Product productDtoToProduct(ProductDto productDto);
}

```
::: tip
The `@Mapping(target = "id", ignore = true)` annotation tells MapStruct to ignore the `id` field when mapping from `ProductDto` to `Product`. This is useful when creating new entities, as the ID is typically generated by the database.
:::

# Changelog: Implementing MapStruct in ProductController

```java:src/main/java/com/example/productapi/controller/ProductController.java
package com.example.productapi.controller;

import com.example.productapi.dto.ProductDto;
import com.example.productapi.model.Product;
import com.example.productapi.service.ProductService;
import com.example.productapi.mapper.ProductMapper; // [!code ++]
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Slf4j
public class ProductController {
    private final ProductService productService;
    private final ProductMapper productMapper; // [!code ++]

    @GetMapping
    public ResponseEntity<List<ProductDto>> getAllProducts() {
        log.info("Received request to get all products");
        List<ProductDto> products = productService.getAllProducts().stream()
                .map(productMapper::productToProductDto) // [!code ++]
                .collect(Collectors.toList());
        log.info("Returning {} products", products.size());
        return ResponseEntity.ok(products);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProductById(@PathVariable("id") Long id) {
        log.info("Received request to get product with id: {}", id);
        Product product = productService.getProductById(id);
        ProductDto productDto = productMapper.productToProductDto(product); // [!code ++]
        log.info("Returning product with id: {}", id);
        return ResponseEntity.ok(productDto);
    }

    @PostMapping
    public ResponseEntity<ProductDto> createProduct(@Valid @RequestBody ProductDto productDTO) { // [!code ++]
        log.info("Received request to create new product: {}", productDTO.getName());
        Product product = productMapper.productDtoToProduct(productDTO); // [!code ++]
        Product createdProduct = productService.createProduct(product);
        ProductDto createdProductDto = productMapper.productToProductDto(createdProduct); // [!code ++]
        log.info("Created new product with id: {}", createdProduct.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdProductDto); // [!code ++]
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDto> updateProduct(@PathVariable("id") Long id, @Valid @RequestBody ProductDto productDTO) {
        log.info("Received request to update product with id: {}", id);
        Product product = productMapper.productDtoToProduct(productDTO); // [!code ++]
        Product updatedProduct = productService.updateProduct(id, product);
        ProductDto updatedProductDto = productMapper.productToProductDto(updatedProduct); // [!code ++]
        log.info("Updated product with id: {}", id);
        return ResponseEntity.ok(updatedProductDto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable("id") Long id) {
        log.info("Received request to delete product with id: {}", id);
        productService.deleteProduct(id);
        log.info("Deleted product with id: {}", id);
        return ResponseEntity.noContent().build();
    }

    private ProductDto convertToDTO(Product product) { // [!code --]
        ProductDto dto = new ProductDto(); // [!code --]
        dto.setName(product.getName()); // [!code --]
        dto.setDescription(product.getDescription()); // [!code --]
        dto.setPrice(product.getPrice()); // [!code --]
        return dto; // [!code --]
    } // [!code --]

    private Product convertToEntity(ProductDto dto) { // [!code --]
        Product product = new Product(); // [!code --]
        product.setName(dto.getName()); // [!code --]
        product.setDescription(dto.getDescription()); // [!code --]
        product.setPrice(dto.getPrice()); // [!code --]
        return product; // [!code --]
    } // [!code --]
}
````


## Key Changes:

1. Imported the `ProductMapper` class.
2. Added `ProductMapper` as a dependency in the controller.
3. Replaced all calls to `convertToDTO` with `productMapper.productToProductDto`.
4. Replaced all calls to `convertToEntity` with `productMapper.productDtoToProduct`.
5. Updated the `createProduct` method to return `ProductDto` instead of `Product`.
6. Removed the manual `convertToDTO` and `convertToEntity` methods.

::: tip Benefits
- The code is now more concise and easier to maintain.
- Mapping logic is centralized in the `ProductMapper` interface.
- Reduced risk of mapping errors as MapStruct handles the conversions.
:::

::: warning Note
Make sure that your `ProductMapper` interface is properly set up with the `@Mapper(componentModel = "spring")` annotation to enable dependency injection in the controller.
:::

This refactoring simplifies your controller code, removes duplicate mapping logic, and leverages the power of MapStruct for object conversions. The controller now focuses on handling HTTP requests and responses, while the mapping logic is abstracted away in the `ProductMapper`.
2. Now, in your service class, replace the manual mapping methods with the MapStruct mapper:


## Optimizing and Cleaning Up

1. **Remove manual mapping methods**: You can now remove the `convertToDTO` and `convertToEntity` methods from your service class.

2. **Handle null values**: Add null checks with MapStruct:

```java
@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ProductMapper {
    // ... existing methods
}
```

3. **Custom mappings**: If you need to map fields with different names or types, use `@Mapping` annotations:

```java
@Mapper(componentModel = "spring")
public interface ProductMapper {
    @Mapping(target = "categoryName", source = "category.name")
    ProductDto productToProductDto(Product product);

    @Mapping(target = "category.name", source = "categoryName")
    Product productDtoToProduct(ProductDto productDto);
}
```

4. **Reusable mappings**: For common conversions (like `Date` to `String`), define methods in the mapper interface:

```java
@Mapper(componentModel = "spring")
public interface ProductMapper {
    // ... existing methods

    default String mapDateToString(Date date) {
        return date != null ? new SimpleDateFormat("yyyy-MM-dd").format(date) : null;
    }
}
```

By implementing these changes, you'll significantly clean up your codebase, reduce the potential for errors, and make your mapping logic more maintainable and flexible.

::: warning
Remember to rebuild your project after adding MapStruct. The mappers are generated during the compilation process.
:::

By following these steps, you'll have MapStruct set up in your Spring Boot project, ready to use for object mapping between your entities and DTOs.

### Best Practices for Object Mapping

- Keep mappings simple and focused on a single responsibility
- Use MapStruct's features like custom mappings for complex conversions
- Regularly update mappings as your data model evolves

::: tip Pro Tip
Consider creating separate DTOs for input and output if they have different requirements.
:::

## Content Negotiation in Spring Boot

Spring Boot actually comes with built-in support for content negotiation, including JSON and XML, without requiring additional dependencies in most cases.

### Built-in Support

By default, Spring Boot includes support for:
- JSON (using Jackson)
- XML (if Jackson's XML extension is on the classpath)

For XML support, you might need to add the following dependency if it's not already included:

::: code-group
```xml [maven]
<dependency>
    <groupId>com.fasterxml.jackson.dataformat</groupId>
    <artifactId>jackson-dataformat-xml</artifactId>
</dependency>
```
```groovy [gradle]
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'com.fasterxml.jackson.dataformat:jackson-dataformat-xml' // [!code ++]
}
```
:::
### Implementing Content Negotiation

To enable content negotiation in your API, you can use the `produces` attribute in your controller methods:

```java{3,7}
import org.springframework.http.MediaType;
// ... existing implementation ...

@GetMapping(produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE })
public ResponseEntity<List<ProductDto>> getAllProducts() {
        // ... existing implementation ...
}
@GetMapping(value = "/{id}", produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE })
public ResponseEntity<ProductDto> getProductById(@PathVariable("id") Long id) {
    // ... existing implementation ...
}
```

Our API now supports both XML and JSON formats. Here are examples of the responses for the same resource (`/api/products/1`) requested with different `Accept` headers instead of `409 Conflict`:

::: code-group

```xml [XML Response]
curl -H "Accept: application/xml" http://localhost:8080/api/products/1

<ProductDto>
    <name>Test Product 1729649611112</name>
    <description>Test product description</description>
    <price>9.99</price>
</ProductDto>
```

```json [JSON Response]
curl -H "Accept: application/json" http://localhost:8080/api/products/1

{
    "name": "Test Product 1729649611112",
    "description": "Test product description",
    "price": 9.99
}
```
:::

::: tip
Notice how the same data is represented differently based on the `Accept` header:
- With `Accept: application/xml`, the response is in XML format.
- With `Accept: application/json`, the response is in JSON format.
:::

This demonstrates that our API is correctly implementing content negotiation, allowing clients to request data in their preferred format.

::: warning Note
Ensure that your `ProductDto` class is properly annotated for both JSON and XML serialization. For example:

```java
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
// If we want the root element to be named differently from the class name
// from: <ProductDto> to: <ProductDetails>
@JacksonXmlRootElement(localName = "ProductDetails")
public class ProductDto {
    // ... other code is same as before ...
}
```

This annotation helps in proper XML serialization.
:::

## HATEOAS

### Introduction to HATEOAS

HATEOAS (Hypermedia as the Engine of Application State) is a constraint of REST that allows clients to navigate the API dynamically by including links in responses. It's a crucial concept for creating truly RESTful APIs, but it's often overlooked or misunderstood.


### Key Benefits of HATEOAS

| Benefit | Description |
|---------|-------------|
| Self-descriptive APIs | HATEOAS makes APIs self-descriptive, allowing clients to understand and use the API without prior knowledge of its structure. |
| Decoupling | It reduces the coupling between client and server, as the client doesn't need to hard-code API endpoints. |
| Discoverability | Clients can discover available actions and resources dynamically. |
| Evolvability | The API can evolve over time without breaking clients, as they follow the provided links rather than hard-coded URLs. |
| State transitions | It clearly represents the possible state transitions for a resource. |

::: tip
These benefits contribute to creating more flexible, maintainable, and user-friendly APIs that adhere closely to RESTful principles.
:::

### Critique of Our Current API

Let's look at our current response for a GET request:

```json
GET {{baseUrl}}/api/products/{{createdProductId}}
{
    "name": "Test Product 1729649889889",
    "description": "Test product description",
    "price": 9.99
}
`````


This response has several limitations:

1. **Lack of context**: The client doesn't know what actions are possible with this resource.
2. **No navigation**: There are no links to related resources or actions.
3. **Limited discoverability**: The client needs prior knowledge of the API structure to use it effectively.
4. **Tight coupling**: Clients must hard-code URLs for different operations, making the API less flexible.

### Improving with HATEOAS

Here's how we can drastically improve our API using HATEOAS:

```json
GET {{baseUrl}}/api/products/{{createdProductId}}
{
    "name": "Test Product 1729649889889",
    "description": "Test product description",
    "price": 9.99,
    "_links": {
        "self": { "href": "/api/products/{{createdProductId}}" },
        "update": { "href": "/api/products/{{createdProductId}}", "method": "PUT" },
        "delete": { "href": "/api/products/{{createdProductId}}", "method": "DELETE" },
        "all-products": { "href": "/api/products" },
        "add-to-cart": { "href": "/api/cart/items", "method": "POST" }
    }
}
`````


### Benefits of this HATEOAS Approach

1. **Self-descriptive**: The response now includes possible actions (update, delete, view all products, add to cart).
2. **Discoverable**: Clients can discover new functionality without changing their code.
3. **Flexible**: The API can change URLs or add new actions without breaking existing clients.
4. **Context-aware**: The response provides context about the current state and possible transitions.
5. **Decoupled**: Clients don't need to construct URLs, reducing coupling between client and server.

### Implementing HATEOAS

To implement HATEOAS in your Spring Boot project, add the following dependency:

::: code-group
```groovy[gradle]
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-hateoas'
}
```

```xml [Maven]
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-hateoas</artifactId>
</dependency>
```
:::

::: tip
If you're using Spring Boot's dependency management, you don't need to specify the version. It will automatically use the version compatible with your Spring Boot version.
:::


Create a new class `ProductResProductModelAssembler` under `mapper`:
``````java
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.server.RepresentationModelAssembler;
import org.springframework.stereotype.Component;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Component
public class ProductModelAssembler implements RepresentationModelAssembler<Product, EntityModel<Product>> {

    @Override
    public EntityModel<Product> toModel(Product product) {
        return EntityModel.of(product,
            linkTo(methodOn(ProductController.class).getProductById(product.getId())).withSelfRel(),
            linkTo(methodOn(ProductController.class).getAllProducts()).withRel("products"));
    }

    @Override
    public CollectionModel<EntityModel<Product>> toCollectionModel(Iterable<? extends Product> entities) {
        CollectionModel<EntityModel<Product>> productModels = RepresentationModelAssembler.super.toCollectionModel(entities);
        return productModels.add(linkTo(methodOn(ProductController.class).getAllProducts()).withSelfRel());
    }
}
``````
Now, we can use  update the Controller class to use the `ProductModelAssembler` to return the `EntityModel<Product>` instead of `ProductDto`:

```java{9,19,25}
import org.springframework.hateoas.EntityModel;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final ProductModelAssembler productModelAssembler;

    public ProductController(ProductService productService, ProductModelAssembler productModelAssembler) {
        this.productService = productService;
        this.productModelAssembler = productModelAssembler;
    }

    @GetMapping("/{id}")
    public EntityModel<Product> getProductById(@PathVariable Long id) {
        Product product = productService.getProductById(id);
        return productModelAssembler.toModel(product);
    }

    @GetMapping
    public CollectionModel<EntityModel<Product>> getAllProducts() {
        List<Product> products = productService.getAllProducts();
        return productModelAssembler.toCollectionModel(products);
    }

    // Other methods (createProduct, updateProduct, deleteProduct) can be implemented similarly
}
```

By implementing HATEOAS, we transform our API from a simple data-serving endpoint to a rich, self-descriptive interface that clients can navigate and use dynamically. This approach aligns more closely with the true principles of REST and provides a more robust, flexible, and evolvable API.

## Expanding HATEOAS Implementation
HATEOAS Use Cases for Product Catalog API

| Use Case | Description | Link Relation |
|----------|-------------|----------------|
| Category | Link to product's category | `category` |
| Related Products | Links to similar or related products | `related-products` |
| Product Reviews | Link to product reviews | `reviews` |
| Product Images | Link to product images or galleries | `images` |
| Inventory Status | Link to check current inventory | `inventory-status` |
| Add to Cart | Link to add product to shopping cart | `add-to-cart` |
| Wishlist | Link to add product to wishlist | `add-to-wishlist` |
| Product Variants | Links to product variants (e.g., sizes, colors) | `variants` |
| Pricing History | Link to view product's pricing history | `pricing-history` |
| Product Specifications | Link to detailed technical specifications | `specifications` |
| User Manuals | Link to product manuals or documentation | `user-manual` |
| Warranty Information | Link to warranty details | `warranty` |
| Bulk Purchase | Link to bulk purchase options (B2B) | `bulk-purchase` |
| Product Comparison | Link to compare with other products | `compare` |
| Customer Q&A | Link to customer questions and answers | `questions-and-answers` |
| Return Policy | Link to product-specific return policy | `return-policy` |
| Shipping Information | Link to shipping details and options | `shipping-info` |
| Product Videos | Link to product demonstration videos | `videos` |
| Seller Information | Link to seller details (for marketplaces) | `seller` |
| Product Customization | Link to product customization options | `customize` |

General API Links and Variations

| Link Type | Description | Link Relation |
|-----------|-------------|----------------|
| API Documentation | Link to API documentation | `api-docs` |
| API Version | Link to current API version info | `version` |
| API Status | Link to API status page | `status` |
| API Terms of Service | Link to API terms of service | `terms-of-service` |
| API Rate Limits | Link to rate limiting information | `rate-limit-info` |
| API Authentication | Link to authentication documentation | `auth-docs` |
| API Changelog | Link to API changelog | `changelog` |
| API Support | Link to API support resources | `support` |
| API Console | Link to interactive API console | `api-console` |
| API SDKs | Links to available SDKs | `sdks` |
| API Webhooks | Link to webhook documentation | `webhooks` |
| API Health Check | Link to API health status | `health` |
| API Metrics | Link to API usage metrics | `metrics` |
| API Deprecation | Link to deprecation policy | `deprecation-policy` |
| API Examples | Link to usage examples | `examples` |
| API Best Practices | Link to API best practices guide | `best-practices` |
| API FAQ | Link to frequently asked questions | `faq` |
| API Service Level Agreement | Link to SLA information | `sla` |
| API Security | Link to security information and practices | `security` |
| API Roadmap | Link to future API plans and features | `roadmap` |

::: tip
These general API links enhance the overall API experience by providing easy access to important information and resources for API consumers.
:::

::: warning
Ensure that the linked resources actually exist and are maintained. Broken or outdated links can frustrate API users.
:::

::: tip
Implementing these links will significantly enhance the discoverability and usability of your Product Catalog API. It allows clients to navigate the API and access related functionalities without prior knowledge of the endpoint structure.
:::

::: warning
Remember to implement the corresponding controllers and methods for each of these links. The actual implementation will depend on your specific business logic and data model.
:::

## API Testing with Postman

To help you test our API, we've prepared a Postman collection that covers all the endpoints and various scenarios. You can download and use this collection to interact with the API and verify its behavior.

[Download Postman Collection](/Product_API_Tests_V2.postman_collection.json)

To use this collection:

1. Download the JSON file
2. Open Postman
3. Click on "Import" in the top left corner
4. Choose "File" and select the downloaded JSON
5. The collection will now be available in your Postman workspace

Alternatively, you can view the API documentation directly in your browser:
[<img src="https://run.pstmn.io/button.svg" alt="Run In Postman" style="width: 128px; height: 32px;">](https://app.getpostman.com/run-collection/10048771-282332bb-93d7-49d6-974f-6be2b1604915?action=collection%2Ffork&source=rip_markdown&collection-url=entityId%3D10048771-282332bb-93d7-49d6-974f-6be2b1604915%26entityType%3Dcollection%26workspaceId%3D8c561acb-06d3-445c-a7af-44b0ce1f3bae)

::: tip
This collection includes tests for all new changes we made including HATEOAS links and content negotiation, both success and error scenarios
:::


## Conclusion

In this milestone, we've enhanced our API with advanced features such as object mapping, content negotiation, and HATEOAS. These improvements make our API more flexible, easier to use, and better prepared for future changes.


::: tip Final Thoughts
Remember, these advanced techniques are tools in your API development toolkit. Not every API needs all of these features, so always consider your specific use case and requirements when deciding which to implement.
:::






