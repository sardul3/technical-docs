<template>
    <div class="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-4 flex flex-col justify-center items-center w-full max-w-[100%] mx-auto min-h-[100vh] box-border">
      <h1 v-if="!isLoading" class="text-2xl font-bold mb-5 mt-1 text-center">Data-Intensive Application Principles</h1>
  
      <div class="w-full max-w-4xl relative">
        <transition name="fade" mode="out-in">
          <div v-if="isLoading" class="absolute inset-0 bg-gray-800 bg-opacity-75 rounded-xl flex items-center justify-center">
            <Spinner />
          </div>
  
          <div v-else key="card.id" class="bg-white text-gray-800 rounded-xl shadow-1xl overflow-hidden">
            <div class="p-6">
              <div class="flex items-center">
                <span class="text-2xl font-bold">{{ card.title }}</span>
              </div>
              <p class="text-xl">{{ card.content }}</p>
  
              <!-- Code to Avoid Block -->
              <div class="mb-6">
                <h3 class="text-xl font-semibold mb-2">Avoid</h3>
                <div class="bg-red-100 p-4 rounded-md overflow-x-auto text-sm" v-html="renderMarkdown(card.codeToAvoid)"></div>
              </div>
  
              <!-- Preferred Code Block -->
              <div class="mb-6">
                <h3 class="text-xl font-semibold mb-2">Prefer</h3>
                <div class="bg-green-100 p-4 rounded-md overflow-x-auto text-sm" v-html="renderMarkdown(card.codeToPrefer)"></div>
              </div>
  
              <!-- Benefits Section -->
              <div>
                <h3 class="text-xl font-semibold mb-2">Benefits:</h3>
                <ul class="list-disc list-inside">
                  <li v-for="(benefit, index) in card.benefits" :key="index" class="text-lg">{{ benefit }}</li>
                </ul>
              </div>
            </div>
          </div>
        </transition>
  
        <!-- Navigation Buttons -->
        <button
          @click="prevCard"
          class="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2 bg-white text-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-200"
          :disabled="isLoading"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
  
        <button
          @click="nextCard"
          class="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 bg-white text-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-200"
          :disabled="isLoading"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
  
      <!-- Dots Navigation -->
      <div class="mt-8 flex space-x-2">
        <button
          v-for="(_, index) in dataIntensiveLessons"
          :key="index"
          @click="setCurrentIndex(index)"
          class="w-3 h-3 rounded-full"
          :class="index === currentIndex ? 'bg-blue-500' : 'bg-gray-400'"
          :disabled="isLoading"
          v-if="!isLoading"
        />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import { dataIntensiveLessons } from './dataIntensiveLessons.js'; // Import the data from external file
  import Spinner from './Spinner.vue';
  import MarkdownIt from 'markdown-it';
  
  // Initialize markdown-it
  const md = new MarkdownIt();
  
  const currentIndex = ref(0);
  const isLoading = ref(false);
  
  // Navigation logic to move between cards
  const nextCard = () => {
    isLoading.value = true;
    setTimeout(() => {
      currentIndex.value = (currentIndex.value + 1) % dataIntensiveLessons.length;
      isLoading.value = false;
      highlightCode(); // Re-apply syntax highlighting after navigation
    }, 500);
  };
  
  const prevCard = () => {
    isLoading.value = true;
    setTimeout(() => {
      currentIndex.value = (currentIndex.value - 1 + dataIntensiveLessons.length) % dataIntensiveLessons.length;
      isLoading.value = false;
      highlightCode(); // Re-apply syntax highlighting after navigation
    }, 500);
  };
  
  const setCurrentIndex = (index) => {
    isLoading.value = true;
    setTimeout(() => {
      currentIndex.value = index;
      isLoading.value = false;
      highlightCode(); // Re-apply syntax highlighting when manually changing cards
    }, 500);
  };
  
  const card = computed(() => dataIntensiveLessons[currentIndex.value]);
  
  // Function to highlight code blocks using highlight.js
  const highlightCode = () => {
    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach((block) => {
    //   hljs.highlightElement(block); // Highlight each code block
    });
  };
  
  // Apply syntax highlighting when the component is mounted
  onMounted(() => {
    highlightCode();
  });
  
  // Watch for changes in currentIndex and re-apply highlighting
  watch(currentIndex, () => {
    highlightCode();
  });
  
  // Function to render Markdown
  const renderMarkdown = (markdownContent) => {
    return md.render(markdownContent); // Convert markdown to HTML
  };
  </script>
  