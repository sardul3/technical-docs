<ProgressBar />
# API Documentation, Versioning and more <Label text="M5" type="milestone" />

In this milestone, we will cover:

| **Topic**                 | **Description**                                                                                         |
|---------------------------|---------------------------------------------------------------------------------------------------------|
| **API Documentation**      | Using tools like Swagger and OpenAPI to generate documentation and SDKs.                                |
| **API Versioning**         | Ensuring backward compatibility as your API evolves over time using various versioning strategies.      |


Let's dive into each topic step by step.

## API Documentation with Swagger & OpenAPI

### Why Document Your API?

API documentation is crucial for other developers and teams to understand how to use your API effectively. It reduces friction, minimizes support queries, and improves developer experience. Especially in enterprise environments, clear API documentation is essential for efficient collaboration and smooth integration. 

Here’s a table format for the scenarios, impacts, and tips:

Key Benefits:
- Provides clear guidelines for API consumption.
- Ensures consistency across endpoints.
- Enables SDK generation and automated testing.

### Swagger and OpenAPI

[**Swagger**](https://editor.swagger.io/) is a powerful toolset that allows you to define, document, and visualize your API.
 [**OpenAPI**](https://spec.openapis.org/oas/latest.html) is a standard specification for API documentation, and Swagger is its most widely-used implementation.

::: tip Key Concepts
- **OpenAPI Specification**: Defines the structure of your API.
- **Swagger UI**: Provides a visual interface to interact with the API.
- **Swagger Codegen**: Generates SDKs in various programming languages.
:::

### Setting Up Swagger

1. **Add Swagger Dependencies**
   Lets begin by adding the following dependencies to `build.gradle`:
::: code-group
   ```groovy [gradle]
   dependencies {
       implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.5.0'
   }
   ```
```xml [maven]
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.5.0</version> <!-- Check for the latest version -->
</dependency>
```
:::
2. **Configure Swagger**

   Swagger can automatically generate API documentation based on your controller classes and annotations. To enable it, simply configure your application properties:

   In `application.yml`:
   ```yaml
   springdoc:
     api-docs:
       path: /api-docs
     swagger-ui:
       path: /swagger-ui.html
   ```

3. **Testing Swagger**

   Run your application, then navigate to `http://localhost:8080/swagger-ui.html` to view your API documentation in Swagger UI.
The doc should look like [this](/boot-camp/api-spec-v1.md)

Right now, the generated doc looks very simple and is missing key details as we did not provide any context to the Swagger UI.
Lets do that next to improve the overall API documentation.


### Enhancing Documentation

You can enhance your API documentation using the following annotations:

- `@Operation`: To describe an API operation.
- `@Parameter`: To define and describe parameters.
- `@ApiResponse`: To document response types.

After applying some of these extra decorators, our controller class for the catalog API will look similar to this.


```java{14,21-24,31}
package com.example.productapi.controller;

// ... same code

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Products", description = "Operations related to products")
public class ProductController {
    private final ProductService productService;
    private final ProductMapper productMapper;
    private final ProductModelAssembler productModelAssembler;

    @GetMapping(value = "/{id}", produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE })
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Product retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Product not found")
    })
    public ResponseEntity<EntityModel<Product>> getProductById(@PathVariable("id") Long id) {
        // same code...

    }

    @PostMapping
    @Operation(summary = "Create a new product")
    public ResponseEntity<EntityModel<Product>> createProduct(@Valid @RequestBody ProductDto productDTO) {
        // same code...
    }

}

```

::: warning Covered Later
We are not using all the available decorators / annotations as there is a better way to handle this using API-first design, which we will cover later on
:::

### Generating SDKs

Using Swagger Codegen, you can generate SDKs for various languages. For example, in a product catalog API, an SDK simplifies API calls, making it easier to retrieve, create, or update product details without manually writing the HTTP request logic.

Imagine a team working on a React Native mobile app and a Python backend service that both rely on the product catalog API to display and manage product data. By using SDKs generated specifically for JavaScript and Python, these developers avoid writing repetitive code, and they can directly call functions like getProductById() instead of manually building requests. This simplifies development and reduces potential errors.

1. **Install Swagger Codegen**:
   ```bash
   brew install swagger-codegen
   ```

2. **Generate SDK**:
```bash
swagger-codegen generate -i http://localhost:8080/api-docs -l python -o ./generated-sdks/python
```
This will generate a Python SDK for your API. Similarly, you can generate SDKs for other languages like Java, JavaScript, etc.
::: tip
Use `-l` flag to specify the target language. Examples include:
:::

3. Use the generated SDK in the codebase
``` python
from generated_sdks.python.api import ProductApi
from generated_sdks.python import Configuration

# Set up configuration with API URL
config = Configuration()
config.host = "http://localhost:8080"  # API base URL

# Initialize the API client
product_api = ProductApi(configuration=config)

# Fetch product details
product_id = 1
try:
    product = product_api.get_product_by_id(product_id)
    print(f"Product Name: {product.name}")
    print(f"Product Description: {product.description}")
    print(f"Product Price: ${product.price}")
except Exception as e:
    print(f"An error occurred: {e}")
```



### Best Practices for Documentation

- Always include descriptions for your endpoints and parameters.
- Use examples to clarify API usage.
- Keep your API documentation up to date with version control.

## API Versioning

### Why Version our API?

API versioning is essential to ensure backward compatibility as our API evolves. It allows us to introduce new features or change existing ones without breaking clients that depend on the previous version. 

Key Benefits:
- Ensures backward compatibility.
- Allows continuous development without breaking existing clients.
- Supports API evolution over time.

### Versioning Strategies

1. **URI Versioning (Most Common)**:

   Version is added to the URI path, e.g., `/api/v1/products`.

   Example:
   ```java
   @RestController
   @RequestMapping("/api/v2/products")
   public class ProductV1Controller {
       @GetMapping("/{id}")
       public ProductDto getProductById(@PathVariable Long id) {
           // Implementation for version 2
       }
   }
   ```

2. **Header Versioning**:

   Version is specified in a custom HTTP header.

   Example:
   ```java
   @GetMapping("/{id}")
   public ResponseEntity<ProductDto> getProductById(
           @PathVariable Long id,
           @RequestHeader("API-Version") String apiVersion) {
       if ("v2".equals(apiVersion)) {
           // Handle version 2 logic
       }
       return ResponseEntity.ok(productMapper.productToProductDto(productService.getProductById(id)));
   }
   ```

3. **Query Parameter Versioning**:

   Version is added as a query parameter, e.g., `/api/products?id=1&version=1`.

   Example:
   ```java
   @GetMapping("/{id}")
   public ResponseEntity<ProductDto> getProductById(
           @PathVariable Long id,
           @RequestParam("version") String version) {
       if ("1".equals(version)) {
           // Handle version 1 logic
       }
       return ResponseEntity.ok(productMapper.productToProductDto(productService.getProductById(id)));
   }
   ```

### Best Practices for Versioning

- Always plan for future versions.
- Deprecate older versions with clear communication.
- Choose a versioning strategy that best suits your API.

## Summary

In this milestone, we covered three critical topics to enhance our API's usability, scalability, and backward compatibility:

| **Topic**                       | **Key Concepts Covered**                                                                                          |
|---------------------------------|--------------------------------------------------------------------------------------------------------------------|
| **API Documentation**           | Using **Swagger** and **OpenAPI** to create comprehensive API documentation. We set up Swagger, enhanced it with annotations like `@Operation`, `@Parameter`, and `@ApiResponse` to provide clear, consistent documentation. Additionally, we explored generating SDKs using Swagger Codegen to simplify cross-platform API usage.  |
| **API Versioning**              | Explored versioning strategies to maintain backward compatibility as the API evolves. Demonstrated **URI versioning**, **Header versioning**, and **Query Parameter versioning** with practical examples. Established guidelines for consistent versioning practices to ensure API evolution doesn’t disrupt existing clients. |

Each topic focuses on a key aspect of making the API more scalable, user-friendly, and adaptable to future growth. This milestone ensures that our API can handle complex use cases with clear documentation, efficient data handling, and a structure that supports ongoing enhancements without disrupting current functionality. 


