<ProgressBar />

# Filtering, Pagination, and Sorting <Label text="M6" type="milestone" />

## Introduction

Modern APIs need to handle large datasets efficiently while providing a great developer experience. This guide covers four essential features that make your API production-ready:

| Feature | Purpose | Real-World Example |
|---------|----------|-------------------|
| Filtering | Narrow down results by specific criteria | Finding products in a price range |
| Pagination | Split large datasets into manageable chunks | Showing 10 products per page |
| Sorting | Order results by specific fields | Sorting products by price |

## Filtering Implementation in Spring Boot

### Understanding Filtering
Filtering allows API consumers to retrieve exactly what they need, reducing unnecessary data transfer and processing.

 Currently, in our product catalog API, there is no way for users to get a specific list of products based on their price or other attributes. It was a good place to start but that won't be enough as we cannot always return all the products in our DB for all the queries. Lets improve this next:

#### Common Filter Operations:
- Equality (`=`): Exact matches
- Range (`>`, `<`, `>=`, `<=`): Numerical comparisons
- Like (`LIKE`): Partial text matching
- In (`IN`): Multiple possible values

### Implementation

#### 1. Create Filter Criteria Class
Create a new model class inside new package `filtering` and add the below classes `FilterCriteria` and `ProductSpecification` under `com/example/productapi/filter/FilterCriteria.java`

Also, we will create a JPA specification class that will help us create a specification which can be used to query the DB in JPA as shown in the second tab.
::: code-group
```java [Criteria]
package com.example.productapi.filtering;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FilterCriteria {
    private String field;
    private String operator;
    private Object value;
}

```
 
```java [Specification]
// This class builds database query specifications for filtering products
public class ProductSpecification {
    
    // Static method that takes a list of filter criteria and returns a Specification
    // Specification is a functional interface that defines database queries
    public static Specification withFilters(List<FilterCriteria> criteria) {
        
        // This is a lambda that implements the Specification interface
        // root: Represents the entity we're querying (like Product)
        // query: The query we're building
        // cb: CriteriaBuilder - helps create query conditions
        return (root, query, cb) -> {
            
            // List to hold all our filter conditions (predicates)
            List<Predicate> predicates = new ArrayList<>();
            
            // Loop through each filter criteria provided
            for (FilterCriteria filter : criteria) {
                
                // Switch based on what type of comparison we're doing
                switch (filter.getOperator()) {
                    
                    // Case: equals comparison (exact match)
                    case "eq":
                        predicates.add(
                            cb.equal(
                                root.get(filter.getField()),  // Get the field we're comparing
                                filter.getValue()             // The value to compare against
                            )
                        );
                        break;
                    
                    // Case: greater than comparison
                    case "gt":
                        predicates.add(
                            cb.greaterThan(
                                root.get(filter.getField()),        // Field to compare
                                (Comparable) filter.getValue()       // Value to compare against
                            )
                        );
                        break;
                    
                    // Case: less than comparison
                    case "lt":
                        predicates.add(
                            cb.lessThan(
                                root.get(filter.getField()),        // Field to compare
                                (Comparable) filter.getValue()       // Value to compare against
                            )
                        );
                        break;
                    
                    // Case: LIKE comparison (contains search)
                    case "like":
                        predicates.add(
                            cb.like(
                                cb.lower(root.get(filter.getField())),    // Convert field to lowercase
                                "%" + filter.getValue().toString().toLowerCase() + "%"    // Add wildcards and convert to lowercase
                            )
                        );
                        break;
                }
            }
            
            // Combine all predicates with AND logic
            // This means ALL conditions must be true
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
```

```java [Example Usage]
   
   // Create filter criteria
   List<FilterCriteria> filters = new ArrayList<>();
   
   // Add filters for:
   // 1. Price less than 50
   filters.add(new FilterCriteria("price", "lt", 50.0));
   
   // 2. Name contains "phone"
   filters.add(new FilterCriteria("name", "like", "phone"));
   
   // Create specification and query database
   Specification<Product> spec = ProductSpecification.withFilters(filters);
   List<Product> results = productRepository.findAll(spec);
```
:::

Now, lets update our existing repository and service layers to enable and use the above predicate and give us back a filtered list of products

#### Update Repository Layer
```java
public interface ProductRepository extends JpaRepository<Product, Long>, 
                                        JpaSpecificationExecutor<Product>  // [!code ++]
{

}
```

####  Update Service Layer
Add a new method to get filtered products back, we could replace the getAllProducts() method as well.
Note that we return a Page while taking in the filters

::: tip
Make sure to use imports from `org.springframework.data.domain`
:::

```java
// com/example/productapi/service/ProductService.java

import com.example.productapi.filtering.FilterCriteria;
import com.example.productapi.filtering.ProductSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

@Service
public class ProductService {
    private final ProductRepository productRepository;
    
    public Page<Product> getFilteredProducts(
            List<FilterCriteria> filters, 
            Pageable pageable) {
        Specification<Product> spec = ProductSpecification.withFilters(filters);
        return productRepository.findAll(spec, pageable);
    }
}
```

#### 4. Update Controller
At the end, we will update the controller layer
```java{6, 10, 11}
// com/example/productapi/controller/ProductController.java
@RestController
@RequestMapping("/api/products")
public class ProductController {
    @GetMapping
    public ResponseEntity<PagedModel<EntityModel<Product>>> getProducts(
            @RequestParam(required = false) Map<String, String> params,
            Pageable pageable) {
        
        List<FilterCriteria> filters = parseFilters(params);
        Page<Product> products = productService.getFilteredProducts(filters, pageable);
        
        // ... pagination handling (covered in next section)
        
        return ResponseEntity.ok(pagedModel);
    }
    
    // Helper method to parse the incoming filters (map)
    private List<FilterCriteria> parseFilters(Map<String, String> params) {
        List<FilterCriteria> filters = new ArrayList<>();
        
        // Parse standard filters
        if (params.containsKey("name")) {
            filters.add(new FilterCriteria("name", "like", params.get("name")));
        }
        if (params.containsKey("minPrice")) {
            filters.add(new FilterCriteria("price", "gt", 
                Double.valueOf(params.get("minPrice"))));
        }
        if (params.containsKey("maxPrice")) {
            filters.add(new FilterCriteria("price", "lt", 
                Double.valueOf(params.get("maxPrice"))));
        }
        
        return filters;
    }
}
```
Here, we read the list of query params passed, convert it to a known set of search filters, 
filter the list of all products off of it, and return a PagedModel of Products that match the filter criterias

Also, we need to change the way our ProductModelAssembler work as the method signature of our controller method has changed.
This file will now look like this:
```java
@Component
public class ProductModelAssembler implements RepresentationModelAssembler<Product, EntityModel<Product>> {

    @Override
    public EntityModel<Product> toModel(Product product) {
        // Default empty parameters for the getAllProducts link
        HashMap<String, String> emptyParams = new HashMap<>(); // [!code ++]
        Pageable defaultPageable = PageRequest.of(0, 10);  // [!code ++]
 
        return EntityModel.of(product,
            linkTo(methodOn(ProductController.class).getProductById(product.getId())).withSelfRel(),
            linkTo(methodOn(ProductController.class).getAllProducts(
                emptyParams, defaultPageable // [!code ++]
                )) 
                .withRel("products"));
    }

    @Override
    public CollectionModel<EntityModel<Product>> toCollectionModel(Iterable<? extends Product> entities) {
        // Default empty parameters for the getAllProducts link
        HashMap<String, String> emptyParams = new HashMap<>(); // [!code ++]
        Pageable defaultPageable = PageRequest.of(0, 10); // [!code ++]

        CollectionModel<EntityModel<Product>> productModels = 
            RepresentationModelAssembler.super.toCollectionModel(entities);
        
        return productModels.add(
            linkTo(methodOn(ProductController.class)
                .getAllProducts(
                    emptyParams, defaultPageable // [!code ++]
                    )) 
                .withSelfRel());
    }
}

```
::: tip
Right now, we are taking in a Map and converting to known sets of filters
Instead, it is a good practice to only enable fixed set of params such as `filter.name` and `filter.price`
:::

### Best Practices for Filtering
1. Validate the incoming filters as we do for request body and headers via **Input Validation**
   ```java{3,4}
   private void validateFilter(FilterCriteria filter) {
       // Whitelist allowed fields
       Set<String> allowedFields = Set.of("name", "price", "category");
       if (!allowedFields.contains(filter.getField())) {
           throw new InvalidFilterException("Invalid filter field: " + filter.getField());
       }
       
       // Validate operators
       Set<String> allowedOperators = Set.of("eq", "gt", "lt", "like");
       if (!allowedOperators.contains(filter.getOperator())) {
           throw new InvalidFilterException("Invalid operator: " + filter.getOperator());
       }
   }
   ```
2. Help the DB by **indexing** the fields that are commonly used in filter terms
   ```sql
   -- Add indexes for commonly filtered fields
   CREATE INDEX idx_product_name ON products(name);
   CREATE INDEX idx_product_price ON products(price);
   ```

3. Throw appropriate errors when the filters are not correct and let users know how to fix it
   ```java
   @ControllerAdvice
   public class FilterExceptionHandler {
       @ExceptionHandler(InvalidFilterException.class)
       public ResponseEntity<ErrorResponse> handleInvalidFilter(InvalidFilterException ex) {
           return ResponseEntity
               .badRequest()
               .body(new ErrorResponse("Invalid filter", ex.getMessage()));
       }
   }
   ```

##  Pagination Implementation with Spring Boot
Pagination is crucial for performance when dealing with large datasets. It:
- Reduces memory usage
- Improves response times
- Provides better user experience

### Implementation Approach


#### Update controller
This approach returns a PagedModel for consistent pagination response and uses @PageableDefault for default pagination settings

```java
// ... rest of the code ...
public class ProductController {
  
    @GetMapping
    @Operation(summary = "Get paginated products")
    public ResponseEntity<PagedModel<EntityModel<ProductDTO>>> getProducts(
            @ParameterObject @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)  // [!code ++]
            Pageable pageable, // [!code ++]
            @RequestParam(required = false) Map<String, String> filters) {
        
        Page<Product> products = productService.getProducts(filters, pageable);
        return ResponseEntity.ok(pagedResourcesAssembler.toModel(products));
    }
}
```

#### Service Layer remained unchanged
```java
@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final ProductSpecificationBuilder specificationBuilder;

    public Page<Product> getFilteredProducts(List<FilterCriteria> filters, Pageable pageable) {
        Specification<Product> spec = ProductSpecification.withFilters(filters);
        return productRepository.findAll(spec, pageable);
    }
}
```
And the configs if we need to override them will look like this for application yml
``` yaml
spring:
  data:
    web:
      pageable:
        default-page-size: 20
        max-page-size: 100
        one-indexed-parameters: true
        page-parameter: page
        size-parameter: size
        sort-parameter: sort
  jpa:
    properties:
      hibernate:
        default_batch_fetch_size: 30
```

### Pagination Best Practices
1. **Set Maximum Page Size**
2. **Include Pagination Metadata**
3. **Use HATEOAS Links**
4. **Handle Edge Cases**

## Sorting Implementation
Sorting should now be automatically enabled and ready to use



# Product Catalog API Testing Guide
Here are a common set of API endpoints to test and view the product catalog API
specifically for sorting, filtering, and pagination

## Basic Endpoints

### Default Pagination
```
GET /api/products
```
Returns first 20 products (default page size), sorted by createdAt in descending order

### Custom Pagination
```
GET /api/products?page=0&size=10
```
Returns first 10 products (page 0)

```
GET /api/products?page=1&size=15
```
Returns second page with 15 products per page

## Filtering Examples

### Price Filtering
```
GET /api/products?minPrice=10.00
```
Products with price greater than $10.00

```
GET /api/products?maxPrice=50.00
```
Products with price less than $50.00

```
GET /api/products?minPrice=10.00&maxPrice=50.00
```
Products with price between $10.00 and $50.00

### Name Filtering
```
GET /api/products?name=phone
```
Products with "phone" in their name (case-insensitive)

### Combined Filtering
```
GET /api/products?name=phone&maxPrice=500.00
```
Products with "phone" in their name and price less than $500.00

## Sorting Examples

### Single Field Sorting
```
GET /api/products?sort=price
```
Sort by price ascending (default)

```
GET /api/products?sort=price,desc
```
Sort by price descending

```
GET /api/products?sort=name,asc
```
Sort by name ascending

### Multiple Field Sorting
```
GET /api/products?sort=category,asc&sort=price,desc
```
Sort by category ascending, then by price descending

## Combined Examples

### Filtering + Sorting + Pagination
```
GET /api/products?name=phone&minPrice=100&sort=price,desc&page=0&size=10
```
First 10 products with:
- "phone" in the name
- Price >= $100
- Sorted by price (highest first)

```
GET /api/products?maxPrice=1000&sort=name,asc&page=1&size=20
```
Second page of 20 products with:
- Price <= $1000
- Sorted alphabetically by name

## Error Cases to Test

### Invalid Page Size
```
GET /api/products?size=1000
```
Should return error (exceeds max page size of 100)

### Invalid Sort Field
```
GET /api/products?sort=invalidField,desc
```
Should return appropriate error message

### Invalid Filter Values
```
GET /api/products?minPrice=invalid
```
Should return error (invalid number format)

### Notes:
1. All numeric values (prices) should be positive numbers
2. Page numbers are zero-based by default unless `one-indexed-parameters` is set to true in configuration
3. Sort direction defaults to ascending ("asc") if not specified
4. Invalid filter combinations will be ignored
5. Maximum page size is 100 as configured
6. Default sort is by createdAt in descending order if no sort parameter is provided

## Response Format
The API returns a HATEOAS-compliant response with:
- Embedded product data
- Page metadata (total elements, total pages, current page)
- Navigation links (first, prev, self, next, last)

```json [API Response]
{
  "_embedded": {
    "products": [
      {
        "id": 1,
        "name": "Product 1",
        "_links": {
          "self": {
            "href": "http://api/products/1"
          }
        }
      }
    ]
  },
  "_links": {
    "first": { "href": "http://api/products?page=1" },
    "self": { "href": "http://api/products?page=2" },
    "next": { "href": "http://api/products?page=3" },
    "last": { "href": "http://api/products?page=10" }
  },
  "page": {
    "size": 20,
    "totalElements": 198,
    "totalPages": 10,
    "number": 1
  }
}
```

## Conclusion
Efficiently handling large datasets is essential in modern API development. In this milestone, we implemented filtering, pagination, and sorting features to enhance the functionality of our product catalog API.

By enabling dynamic filters, we allow users to retrieve targeted data, reducing unnecessary load and enhancing responsiveness. Pagination improves usability by delivering manageable chunks of data, while sorting lets users organize results according to their needs.
 
Together, these features create a powerful, scalable API that provides an optimized, developer-friendly experience. The enhancements not only improve performance but also make our API robust and ready for production-level use cases, ensuring it can handle complex queries with ease.