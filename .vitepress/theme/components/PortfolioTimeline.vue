<template>
    <div class="timeline flex flex-wrap justify-center items-start gap-6 mt-8">
      <div v-for="item in timelineItems" :key="item.title" class="w-full sm:w-1/2 lg:w-1/3 bg-gray-100 p-6 rounded-lg shadow-lg">
        <h3 class="font-bold text-lg mb-2">{{ item.title }}</h3>
        <p class="text-gray-600">{{ item.company }} - {{ item.year }}</p>
        <p class="text-gray-500 mt-2">{{ item.description }}</p>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        timelineItems: [
          { title: "Position 1", company: "Company Name", year: "2021", description: "Description of work or project carried out..." },
          { title: "Position 2", company: "Company Name", year: "2020", description: "Description of work or project carried out..." },
          // Add more timeline items here
        ],
      };
    },
  };
  </script>
  
  <style scoped>
  /* Add any specific styles here */
  </style>
  