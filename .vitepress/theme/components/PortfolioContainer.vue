<template>
  <section class="bg-transparent dark:bg-[#1b1b1f] rounded-lg shadow-lg text-gray-800 dark:text-gray-200">
    <div class="container max-w-5xl px-4 py-12 mx-auto">
      <div class="grid gap-4 mx-4 sm:grid-cols-12">
        <div class="col-span-12 sm:col-span-3">
          <div class="text-center sm:text-left mb-14 before:block before:w-24 before:h-3 before:mb-5 before:rounded-md before:mx-auto sm:before:mx-0 before:bg-indigo-600 dark:before:bg-indigo-400">
            <h3 class="text-3xl font-semibold">Work Experience</h3>
            <span class="text-sm font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400">Professional Journey</span>
          </div>
        </div>
        <div class="relative col-span-12 px-4 space-y-6 sm:col-span-9">
          <div
            v-for="(experience, index) in experiences"
            :key="index"
            class="col-span-12 space-y-12 relative px-4 sm:col-span-8 sm:space-y-8 sm:before:absolute sm:before:top-2 sm:before:bottom-0 sm:before:w-0.5 sm:before:-left-3 before:bg-gray-300 dark:before:bg-gray-700"
          >
            <div class="flex flex-col sm:relative sm:before:absolute sm:before:top-2 sm:before:w-4 sm:before:h-4 sm:before:rounded-full sm:before:left-[-35px] sm:before:z-[1] before:bg-indigo-600 dark:before:bg-indigo-400">
              <h3 class="text-xl font-semibold tracking-wide">{{ experience.title }}</h3>
              <time class="text-xs tracking-wide uppercase text-indigo-600 dark:text-indigo-400">{{ experience.date }}</time>
              <p class="mt-3">{{ experience.description }}</p>
              <ul class="mt-3 space-y-2">
                <li v-for="(task, taskIndex) in experience.tasks" :key="taskIndex" class="flex items-start space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-4 h-4 fill-current text-indigo-600 dark:text-indigo-400">
                    <path d="M10 17l5-5-5-5v10z" />
                  </svg>
                  <span>{{ task }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import experienceData from "./experienceData"; // Import from config file

export default {
  data() {
    return {
      experiences: experienceData, // Load experiences from external config
    };
  },
};
</script>

<style scoped>
/* Add any specific styles you need */
</style>
