<template>
    <div v-if="isVisible" class="progress-bar-container">
      <div :style="progressBarStyle" class="progress-bar"></div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, onUnmounted, computed } from 'vue'
  
  export default {
    name: 'CustomProgressBar',
    setup() {
      const progress = ref(0)
      const isVisible = ref(true)
  
      const updateProgress = () => {
        const scrollTop = window.scrollY
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        progress.value = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      }
  
      const progressBarStyle = computed(() => {
        const backgroundColor = progress.value > 99
          ? '#4caf50'  // Fully green at 100% progress
          : `linear-gradient(90deg, #ff4e50, #ffba08 ${progress.value}%, #4caf50)`
          
        return {
          width: `${progress.value}%`,
          background: backgroundColor
        }
      })
  
      onMounted(() => {
        updateProgress()  // Initial progress
        window.addEventListener('scroll', updateProgress)  // Track scroll
      })
  
      onUnmounted(() => {
        window.removeEventListener('scroll', updateProgress)
      })
  
      return {
        progressBarStyle,
        isVisible
      }
    }
  }
  </script>
  
  <style scoped>
  .progress-bar-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 6px;
    background-color: rgba(0, 0, 0, 0.1);
    z-index: 9999;
  }
  
  .progress-bar {
    height: 100%;
    transition: width 0.1s ease, background-color 0.3s ease; /* Smooth transition */
  }
  
  @media (prefers-color-scheme: dark) {
    .progress-bar-container {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }
  </style>
  