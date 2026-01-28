<template>
  <div class="w-full h-full overflow-hidden flex flex-col bg-white rounded-lg shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700/50">
    <img class="object-cover object-center w-full h-56 shrink-0" :src="profileImage" alt="avatar" />

    <div class="flex items-center px-6 py-3 bg-gray-900 shrink-0">
      <svg
        aria-label="status icon"
        class="w-6 h-6 text-white fill-current"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          v-if="status === 'Focusing'"
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M17 21C15.8954 21 15 20.1046 15 19V15C15 13.8954 15.8954 13 17 13H19V12C19 8.13401 15.866 5 12 5C8.13401 5 5 8.13401 5 12V13H7C8.10457 13 9 13.8954 9 15V19C9 20.1046 8.10457 21 7 21H3V12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12V21H17ZM19 15H17V19H19V15ZM7 15H5V19H7V15Z"
        />
        <path
          v-else-if="status === 'Relaxing'"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9c.83 0 1.5-.67 1.5-1.5S7.83 8 7 8s-1.5.67-1.5 1.5S6.17 11 7 11zm5-3c.83 0 1.5-.67 1.5-1.5S12.83 5 12 5s-1.5.67-1.5 1.5S11.17 8 12 8zm5 3c.83 0 1.5-.67 1.5-1.5S17.83 8 17 8s-1.5.67-1.5 1.5S16.17 11 17 11zm-5 3c-2.33 0-4.31 1.46-5.11 3.5h10.22c-.8-2.04-2.78-3.5-5.11-3.5z"
        />
        <path
          v-else-if="status === 'Sleeping'"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-3-8c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3-3-1.34-3-3z"
        />
        <path
          v-else-if="status === 'Working'"
          d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"
        />
        <path
          v-else-if="status === 'Building'"
          d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"
        />
      </svg>
      <span class="mx-3 text-lg font-semibold text-white">{{ status }}</span>
    </div>

    <div class="px-6 py-4 flex-1 flex flex-col min-h-0">
      <span class="text-xl font-semibold text-gray-800 dark:text-white">{{ name }}</span>
      <p class="py-2 text-gray-700 dark:text-gray-400">
        {{ description }}
      </p>

      <div class="flex items-center mt-4 text-gray-700 dark:text-gray-200">
        <svg aria-label="suitcase" class="w-5 h-5 fill-current text-gray-500 dark:text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 11H10V13H14V11Z" />
          <path fill-rule="evenodd" clip-rule="evenodd" d="M7 5V4C7 2.89545 7.89539 2 9 2H15C16.1046 2 17 2.89545 17 4V5H20C21.6569 5 23 6.34314 23 8V18C23 19.6569 21.6569 21 20 21H4C2.34314 21 1 19.6569 1 18V8C1 6.34314 2.34314 5 4 5H7ZM9 4H15V5H9V4ZM4 7v7h16V7H4zm-1 9v2h18v-2H3z"/>
        </svg>
        <span class="ml-2 text-sm text-gray-600 dark:text-gray-300">{{ company }}</span>
      </div>

      <div class="flex items-center mt-3 text-gray-700 dark:text-gray-200">
        <svg aria-label="location" class="w-5 h-5 fill-current text-gray-500 dark:text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <span class="ml-2 text-sm text-gray-600 dark:text-gray-300">{{ location }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    profileImage: {
      type: String,
      default: "/pp2.png",
    },
    name: {
      type: String,
      default: "Sagar Poudel",
    },
    description: {
      type: String,
      default: "Senior Software Engineer - 6+ years of experience architecting and building cloud-native, secure, and scalable systems",
    },
    company: {
      type: String,
      default: "Kroger",
    },
    location: {
      type: String,
      default: "Dallas, TX",
    },
  },
  data() {
    return {
      status: this.getStatus(),
    };
  },
  methods: {
    getStatus() {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();

      if (day === 0 || day === 6) {
        return "Relaxing";
      }

      if (hour < 8 || hour >= 23) {
        return "Sleeping";
      }

      if (hour >= 8 && hour < 15) {
        return "Working";
      }

      if (hour >= 15 && hour < 22) {
        return "Building";
      }

      return "Focusing";
    },
  },
  mounted() {
    this.status = this.getStatus();
    setInterval(() => {
      this.status = this.getStatus();
    }, 60000);
  },
};
</script>

<style scoped>
/* Add specific styles if necessary */
</style>
