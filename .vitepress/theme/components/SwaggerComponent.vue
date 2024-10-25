// components/SwaggerUI.vue
<template>
  <div class="swagger-container">
    <div v-if="error" class="error-message">{{ error }}</div>
    <div id="swagger-ui"></div>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue'
import SwaggerUIBundle from 'swagger-ui-dist/swagger-ui-bundle.js'
import 'swagger-ui-dist/swagger-ui.css'

export default {
  name: 'SwaggerUI',
  props: {
    spec: {
      type: String,
      required: true
    },
    darkMode: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const error = ref('')

    onMounted(async () => {
      try {
        const specPath = props.spec.startsWith('/') ? props.spec.slice(1) : props.spec
        const response = await fetch(`/${specPath}`)
        
        if (!response.ok) {
          throw new Error(`Failed to load spec: ${response.status} ${response.statusText}`)
        }
        
        const content = await response.text()
        const specObj = JSON.parse(content)

        SwaggerUIBundle({
          spec: specObj,
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIBundle.SwaggerUIStandalonePreset
          ],
          layout: "BaseLayout",
          defaultModelsExpandDepth: -1, // Hide schemas section
          docExpansion: "list", // Expand by default
          filter: true, // Enable filtering
          persistAuthorization: true,
          displayRequestDuration: true,
          plugins: [
            // Remove side nav plugin
            () => ({
              wrapComponents: {
                sidebar: () => () => null
              }
            })
          ]
        })
      } catch (err) {
        console.error('Error in SwaggerUI:', err)
        error.value = `Error: ${err.message}`
      }
    })

    return { error }
  }
}
</script>

<style>
/* .swagger-container {
  margin: 0 auto;
  padding: 1rem;
  background: white;
  border-radius: 4px;
}

.error-message {
  color: red;
  padding: 1rem;
  margin-bottom: 1rem;
  background-color: #fff3f3;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
}

/* Override VitePress dark mode for Swagger UI */
.dark .swagger-container {
  background: white !important;
}

/* Remove filter inversion for dark mode */
.dark .swagger-ui,
.dark .swagger-ui .highlight-code,
.dark .swagger-ui .microlight {
  filter: none !important;
}

/* Hide the models section by default */
.swagger-ui .models {
  display: none;
}

/* Optional: Make the top bar more compact */
.swagger-ui .topbar {
  display: none;
}

/* Optional: Improve spacing in dark mode */
.dark .swagger-ui select {
  background: white;
  color: #333;
}

/* Optional: Improve readability of operation titles */
.swagger-ui .opblock-summary-description {
  color: #3b4151;
} */

/* General dark mode container styling */
.dark .swagger-container {
  background-color: #1e1e1e !important; /* Dark background for the container */
  color: #c7c7c7 !important; /* Light gray text for readability */
}

/* Override for the Swagger UI body in dark mode */
.dark .swagger-ui,
.dark .swagger-ui .highlight-code,
.dark .swagger-ui .microlight {
  filter: none !important;
  background-color: #2d2d2d !important; /* Darker background for Swagger UI */
  color: #e0e0e0 !important; /* Lighter text color for better contrast */
}

/* Styling for inputs in dark mode */
.dark .swagger-ui input,
.dark .swagger-ui select,
.dark .swagger-ui textarea {
  background-color: #3a3a3a !important; /* Dark background for input fields */
  color: #f0f0f0 !important; /* Light text color inside input fields */
  border: 1px solid #555 !important; /* Subtle border for inputs */
  border-radius: 4px;
  padding: 0.5rem;
}

/* Input focus state for better visibility */
.dark .swagger-ui input:focus,
.dark .swagger-ui select:focus,
.dark .swagger-ui textarea:focus {
  border-color: #007bff !important; /* Highlight input border on focus */
  outline: none; /* Remove default outline */
}

/* Button styles for dark mode */
.dark .swagger-ui .btn {
  background-color: #4a4a4a !important; /* Darker background for buttons */
  color: #ffffff !important; /* White text on buttons */
  border: 1px solid #007bff !important; /* Border for buttons */
  border-radius: 4px;
}

/* Button hover state for a slightly brighter look */
.dark .swagger-ui .btn:hover {
  background-color: #5a5a5a !important; /* Slightly lighter background on hover */
}

/* Textarea styling in dark mode */
.dark .swagger-ui textarea {
  background-color: #3a3a3a !important; /* Dark background */
  color: #f0f0f0 !important; /* Light text */
}

/* Styling for operation summary and other text in Swagger */
.dark .swagger-ui .opblock-summary-description {
  color: #e0e0e0 !important; /* Light color for better readability */
}

/* Links in dark mode */
.dark .swagger-ui a {
  color: #4ca8ff !important; /* Light blue for links */
}

/* Placeholder styling in input fields */
.dark .swagger-ui input::placeholder {
  color: #b0b0b0 !important; /* Lighter gray for placeholders */
}

/* Headers and titles for better readability */
.dark .swagger-ui h1,
.dark .swagger-ui h2,
.dark .swagger-ui h3 {
  color: #ffffff !important; /* White for headings */
}

/* Response code blocks in dark mode */
.dark .swagger-ui .response-col_status {
  background-color: #3e3e3e !important; /* Dark background for status codes */
  color: #f0f0f0 !important; /* Light text for status codes */
}

/* Top bar hidden for a cleaner look */
.swagger-ui .topbar {
  display: none !important;
}

/* Improve button accessibility in dark mode */
.dark .swagger-ui .btn-clear,
.dark .swagger-ui .btn.authorize {
  background-color: #4a4a4a !important;
  color: #ffffff !important;
  border: 1px solid #007bff !important;
}

.dark .swagger-ui .btn-clear:hover,
.dark .swagger-ui .btn.authorize:hover {
  background-color: #5a5a5a !important;
}

/* Adjust dropdowns (select) for dark mode */
.dark .swagger-ui select {
  background-color: #3a3a3a !important;
  color: #f0f0f0 !important;
  border: 1px solid #555 !important;
  border-radius: 4px;
}

/* Adjust modal dialogs in Swagger for dark mode */
.dark .swagger-ui .dialog-ux {
  background-color: #3a3a3a !important;
  color: #e0e0e0 !important;
}

/* Dark mode table styling */
.dark table {
  color: #ffffff !important; /* Make all table text white */
  border-color: #555 !important; /* Lighten the border for better visibility */
}

.dark table th,
.dark table td {
  color: #ffffff !important; /* Make header and cell text white */
  border-color: #555 !important; /* Lighten the border between cells */
}

.dark table thead {
  background-color: #333 !important; /* Dark background for table headers */
}

.dark table tbody tr:nth-child(odd) {
  background-color: #2d2d2d !important; /* Alternate row background color */
}

.dark table tbody tr:nth-child(even) {
  background-color: #3a3a3a !important; /* Alternate row background color */
}

.dark table th {
  background-color: #444 !important; /* Dark background for table header cells */
}

.dark table td {
  background-color: #2d2d2d !important; /* Dark background for table data cells */
}

.dark table th, 
.dark table td {
  padding: 0.75rem; /* Add padding for readability */
}

/* Make links inside tables visible */
.dark table a {
  color: #4ca8ff !important; /* Light blue links for visibility */
}

.dark table a:hover {
  color: #80cfff !important; /* Slightly lighter blue on hover */
}

/* Dark mode for scheme-container */
.dark .scheme-container {
  background-color: #2b2b2b !important; /* Dark background for the scheme container */
  padding: 1rem;
  border-radius: 8px;
}

/* Dark mode for 'Servers' text */
.dark .scheme-container .servers-title {
  color: #ffffff !important; /* Make 'Servers' text white */
  font-weight: bold;
}

/* Button in bright color */
.dark .opblock-control-arrow {
  background-color: #4ca8ff !important; /* Bright background for the button */
  border: none;
}

.dark .opblock-control-arrow svg {
  fill: #ffffff !important; /* White arrow color */
}

.dark .opblock-control-arrow:hover {
  background-color: #80cfff !important; /* Lighter color on hover */
}

/* Text inside parameters table cell */
.dark .parameters-col_name .parameter__name,
.dark .parameters-col_name .parameter__type,
.dark .parameters-col_name .parameter__in {
  color: #ffffff !important; /* White text for 'id', 'integer($int64)', and '(path)' */
}

/* White color for any span inside the table cells */
.dark .parameters-col_name .prop-format,
.dark .parameters-col_name span {
  color: #cccccc !important; /* Light grey for additional text like '$int64' */
}

/* Dark mode for tabs */
.dark .tab {
  background-color: #333 !important; /* Dark background for tab container */
  border-radius: 4px;
  padding: 0.5rem;
}

.dark .tabitem {
  margin-right: 8px;
}

.dark .tabitem button {
  color: #bbb !important; /* Lighter color for inactive tabs */
  background: #444 !important; /* Darker background for tabs */
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.3s ease;
}

.dark .tabitem.active button {
  color: #fff !important; /* White color for active tab */
  background: #4ca8ff !important; /* Bright background for active tab */
}

.dark .tabitem button:hover {
  background: #555 !important; /* Slightly lighter background on hover */
}

/* Dark mode for code view */
.dark .highlight-code {
  background-color: #2b2b2b !important; /* Dark background for the code container */
  color: #ffffff !important; /* White text for the code */
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #4ca8ff; /* Clear boundary for the code view */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.dark .highlight-code code {
  color: #f8f8f2 !important; /* Light color for the code inside the pre */
}

/* Dark mode for schema object table */
.dark .model-box .model {
  background-color: #2b2b2b !important; /* Dark background for object table */
  color: #ffffff !important; /* White text for the object schema */
}

.dark .model-box .model-box-control {
  color: #ffffff !important; /* White color for expand/collapse button */
}

.dark .model-box .model-title__text {
  color: #ffffff !important; /* White color for model title */
}

.dark .model-box table.model td {
  color: #ffffff !important; /* White text inside the table */
  border-color: #444 !important; /* Border for table cells */
}

.dark .model-box .property-row td {
  padding: 0.5rem;
  border-bottom: 1px solid #444 !important; /* Darker separator between rows */
}

/* Buttons and arrows */
.dark .model-box .model-toggle {
  fill: #ffffff !important; /* White color for toggle arrows */
}

.dark .model-box-control:hover {
  background-color: #555 !important; /* Slight hover effect for the buttons */
}

/* Model box control button for expand/collapse */
.dark .model-box-control {
  background-color: transparent !important; /* Keep the background transparent */
  color: #ffffff !important; /* Set text color to white for readability */
  border: none;
  cursor: pointer;
}

.dark .model-box-control:hover {
  background-color: #444 !important; /* Slightly lighter background on hover */
}

/* Collapsed model button */
.dark .model-box-control .model-toggle {
  fill: #ffffff !important; /* White color for the toggle arrow */
}

.dark .model-box-control .model-toggle.collapsed {
  color: #ffffff !important; /* White color for the collapsed button */
}

.dark .model-box-control .model-toggle:hover {
  fill: #4ca8ff !important; /* Highlight with bright color on hover */
}

/* Expand operation button for arrows */
.dark .expand-operation {
  background-color: transparent !important;
  color: #ffffff !important;
  border: none;
  cursor: pointer;
}

.dark .expand-operation:hover {
  color: #4ca8ff !important; /* Highlight with bright color on hover */
}

.dark .expand-operation svg {
  fill: #ffffff !important; /* White color for the arrow */
}

.dark .expand-operation svg:hover {
  fill: #4ca8ff !important; /* Bright color for the arrow on hover */
}

/* Property type text for prop type (e.g., string, integer) */
.dark .prop .prop-type {
  color: #f8f8f2 !important; /* Light readable color for prop types */
}

/* Ensure that the 'span' inside the prop-type has high contrast */
.dark .prop span {
  color: #ffffff !important; /* White for better contrast in dark mode */
}

/* Dark mode styling for the collapsed model toggle */
.dark .model-toggle.collapsed {
  background-color: transparent !important;
  color: #ffffff !important; /* Set text color to white */
  fill: #ffffff !important;  /* Ensure icons are also white */
}

.dark .model-toggle.collapsed:hover {
  color: #4ca8ff !important; /* Bright blue on hover */
  fill: #4ca8ff !important;  /* Bright blue icon on hover */
}

</style>