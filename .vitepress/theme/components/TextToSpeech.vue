<template>
    <div class="fixed bottom-5 right-5 z-50 flex space-x-4">
      <!-- Play/Pause Button -->
      <button @click="toggleSpeech" :class="buttonClasses">
        <template v-if="isSpeaking && !isPaused">
          <!-- Pause Icon -->
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
            <path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clip-rule="evenodd" />
          </svg>

        </template>
        <template v-else>
          <!-- Play Icon -->
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
            <path fill-rule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clip-rule="evenodd" />
          </svg>
        </template>
      </button>
  
      <!-- Restart Button (Visible when speaking) -->
      <button v-if="isSpeaking" @click="restartSpeech" class="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center focus:outline-none">
        <!-- Restart Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
          <path fill-rule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        isSpeaking: false,
        isPaused: false,
        speechSynthesis: null, // Initialize as null
        utterance: null,
        voicesLoaded: false, // To track if voices are loaded
      };
    },
    mounted() {
      // Only run in browser environment
      if (typeof window !== 'undefined') {
        // Ensure voices are loaded before we start speech synthesis
        this.speechSynthesis = window.speechSynthesis;
        this.loadVoices();
        window.speechSynthesis.onvoiceschanged = this.loadVoices;
      }
    },
    beforeUnmount() {
      // Cancel speech when the component is about to be destroyed (page change)
      if (typeof window !== 'undefined') {
        this.resetSpeechProgress();
      }
    },
    methods: {
      loadVoices() {
        if (this.speechSynthesis) {
          const voices = this.speechSynthesis.getVoices();
          if (voices.length > 0) {
            this.voicesLoaded = true;
            console.log('Voices loaded:', voices);
          }
        }
      },
      toggleSpeech() {
        if (!this.speechSynthesis) {
          console.warn('SpeechSynthesis is not available');
          return;
        }
        // If the speech is already ongoing, allow pause/resume functionality
        if (this.isSpeaking) {
          if (this.isPaused) {
            this.resumeSpeech();
          } else {
            this.pauseSpeech();
          }
        } else {
          // If not already speaking, start speech
          this.startSpeech();
          this.resumeSpeech();
        }
      },
      startSpeech() {
        // Ensure voices are loaded
        if (!this.voicesLoaded || !this.speechSynthesis) {
          console.warn("Voices not loaded yet. Please wait.");
          return;
        }
  
        const contentElement = document.querySelector('.vp-doc'); // Ensure the correct selector
        if (!contentElement) {
          console.warn('Main content element not found');
          return;
        }
  
        const content = contentElement.innerText.trim(); // Retrieve text content and trim whitespace
        if (!content) {
          console.warn('No content available to read');
          return;
        }
  
        this.utterance = new SpeechSynthesisUtterance(content);
        this.utterance.rate = 1.05;
        this.utterance.pitch = 1;
        this.utterance.onend = () => {
          this.isSpeaking = false;
          this.isPaused = false;
        };
  
        console.log('Starting speech synthesis for content:', content); 
        this.speechSynthesis.speak(this.utterance);
        this.isSpeaking = true;
        this.isPaused = false;
      },
      pauseSpeech() {
        if (this.speechSynthesis) {
          this.speechSynthesis.pause();
          this.isPaused = true;
        }
      },
      resumeSpeech() {
        if (this.speechSynthesis) {
          this.speechSynthesis.resume();
          this.isPaused = false;
        }
      },
      restartSpeech() {
        if (this.speechSynthesis && this.utterance) {
          this.speechSynthesis.cancel(); 
          this.startSpeech(); 
        }
      },
      resetSpeechProgress() {
        if (this.speechSynthesis && (this.isSpeaking || this.isPaused)) {
          setTimeout(() => {
            this.speechSynthesis.cancel();
            this.isSpeaking = false;
            this.isPaused = false;
            console.log('Speech progress reset');
          }, 50);
        }
      },
    },
    computed: {
      buttonClasses() {
        return this.isSpeaking
          ? 'w-16 h-16 rounded-full bg-red-500 flex items-center justify-center focus:outline-none'
          : 'w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center focus:outline-none';
      },
    },
  };
  </script>
  
  
  <style scoped>
  /* Tailwind CSS styling */
  </style>
  