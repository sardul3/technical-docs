<template>
    <div class="testimonials flex flex-wrap justify-center mt-12">
      <div v-for="testimonial in testimonials" :key="testimonial.name" class="bg-white shadow-lg rounded-lg p-6 m-4 w-full sm:w-1/3">
        <p class="text-gray-700 italic">"{{ testimonial.text }}"</p>
        <div class="mt-4 text-right">
          <h5 class="font-bold">{{ testimonial.name }}</h5>
          <p class="text-sm text-gray-600">{{ testimonial.role }}</p>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        testimonials: [
          { text: "Great to work with, always professional.", name: "John Doe", role: "CEO at SomeCompany" },
          { text: "Amazing developer, highly recommended.", name: "Jane Smith", role: "CTO at AnotherCompany" },
          // Add more testimonials here
        ],
      };
    },
  };
  </script>
  
  <style scoped>
  /* Add any specific styles here */
  </style>
  