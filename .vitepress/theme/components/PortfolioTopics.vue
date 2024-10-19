<template>
    <div class="topics flex flex-wrap justify-center gap-6 mt-12">
      <div v-for="topic in topics" :key="topic.title" class="bg-blue-100 p-6 rounded-lg shadow-lg w-full sm:w-1/3">
        <h4 class="text-lg font-bold">{{ topic.title }}</h4>
        <p class="mt-2 text-gray-600">{{ topic.description }}</p>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        topics: [
          { title: "Topic 1", description: "Short description or statement about this topic." },
          { title: "Topic 2", description: "Short description or statement about this topic." },
          // Add more topics here
        ],
      };
    },
  };
  </script>
  
  <style scoped>
  /* Add any specific styles here */
  </style>
  