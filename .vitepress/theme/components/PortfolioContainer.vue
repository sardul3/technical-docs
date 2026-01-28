<template>
  <div class="space-y-16 sm:space-y-20">
  <section class="bg-white dark:bg-[#1b1b1f] rounded-lg shadow-md dark:shadow-lg border border-gray-100 dark:border-transparent text-gray-800 dark:text-gray-200">
    <div class="container max-w-5xl px-4 py-12 mx-auto">
      <div class="grid gap-4 mx-4 sm:grid-cols-12">
        <div class="col-span-12 sm:col-span-3">
          <div class="text-center sm:text-left mb-14 before:block before:w-24 before:h-3 before:mb-5 before:rounded-md before:mx-auto sm:before:mx-0 before:bg-indigo-600 dark:before:bg-indigo-400">
            <h3 class="text-3xl font-semibold">Professional Summary</h3>
            <span class="text-sm font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400">What I Bring</span>
          </div>
        </div>
        <div class="col-span-12 px-4 sm:col-span-9">
          <p class="text-lg font-medium text-gray-800 dark:text-gray-100">{{ summary.headline }}</p>
          <p class="mt-1 text-indigo-600 dark:text-indigo-400">{{ summary.subheadline }}</p>
          <ul class="mt-4 space-y-2">
            <li v-for="(bullet, i) in summary.bullets" :key="i" class="flex items-start space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-4 h-4 mt-0.5 shrink-0 fill-current text-indigo-600 dark:text-indigo-400">
                <path d="M10 17l5-5-5-5v10z" />
              </svg>
              <span>{{ bullet }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <section class="bg-white dark:bg-[#1b1b1f] rounded-lg shadow-md dark:shadow-lg border border-gray-100 dark:border-transparent text-gray-800 dark:text-gray-200">
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
              <p v-if="experience.company" class="text-sm text-indigo-600 dark:text-indigo-400">{{ experience.company }}</p>
              <time class="text-xs tracking-wide uppercase text-indigo-600 dark:text-indigo-400">{{ experience.date }}</time>
              <p class="mt-3">{{ experience.description }}</p>
              <ul class="mt-3 space-y-2">
                <li v-for="(task, taskIndex) in experience.tasks" :key="taskIndex" class="flex items-start space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-4 h-4 shrink-0 fill-current text-indigo-600 dark:text-indigo-400">
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

  <section class="bg-white dark:bg-[#1b1b1f] rounded-lg shadow-md dark:shadow-lg border border-gray-100 dark:border-transparent text-gray-800 dark:text-gray-200">
    <div class="container max-w-5xl px-4 py-12 mx-auto">
      <div class="grid gap-4 mx-4 sm:grid-cols-12">
        <div class="col-span-12 sm:col-span-3">
          <div class="text-center sm:text-left mb-14 before:block before:w-24 before:h-3 before:mb-5 before:rounded-md before:mx-auto sm:before:mx-0 before:bg-indigo-600 dark:before:bg-indigo-400">
            <h3 class="text-3xl font-semibold">Contract & Freelance</h3>
            <span class="text-sm font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400">Selected Projects</span>
          </div>
        </div>
        <div class="relative col-span-12 px-4 space-y-6 sm:col-span-9">
          <div
            v-for="(item, index) in contracts"
            :key="index"
            class="col-span-12 space-y-12 relative px-4 sm:col-span-8 sm:space-y-8 sm:before:absolute sm:before:top-2 sm:before:bottom-0 sm:before:w-0.5 sm:before:-left-3 before:bg-gray-300 dark:before:bg-gray-700"
          >
            <div class="flex flex-col sm:relative sm:before:absolute sm:before:top-2 sm:before:w-4 sm:before:h-4 sm:before:rounded-full sm:before:left-[-35px] sm:before:z-[1] before:bg-indigo-500 dark:before:bg-indigo-500">
              <h3 class="text-xl font-semibold tracking-wide">{{ item.title }}</h3>
              <p class="text-sm text-indigo-600 dark:text-indigo-400">{{ item.company }}</p>
              <time class="text-xs tracking-wide uppercase text-indigo-600 dark:text-indigo-400">{{ item.date }}</time>
              <p class="mt-3">{{ item.description }}</p>
              <ul class="mt-3 space-y-2">
                <li v-for="(task, taskIndex) in item.tasks" :key="taskIndex" class="flex items-start space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-4 h-4 shrink-0 fill-current text-indigo-600 dark:text-indigo-400">
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

  <section class="bg-white dark:bg-[#1b1b1f] rounded-lg shadow-md dark:shadow-lg border border-gray-100 dark:border-transparent text-gray-800 dark:text-gray-200">
    <div class="container max-w-5xl px-4 py-12 mx-auto">
      <div class="grid gap-4 mx-4 sm:grid-cols-12">
        <div class="col-span-12 sm:col-span-3">
          <div class="text-center sm:text-left mb-8 before:block before:w-24 before:h-3 before:mb-5 before:rounded-md before:mx-auto sm:before:mx-0 before:bg-indigo-600 dark:before:bg-indigo-400">
            <h3 class="text-3xl font-semibold">Education</h3>
            <span class="text-sm font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400">Academic Background</span>
          </div>
        </div>
        <div class="relative col-span-12 px-4 sm:col-span-9">
          <div
            v-for="(edu, index) in education"
            :key="index"
            class="flex flex-col py-4 border-b border-gray-200 dark:border-gray-700 last:border-0"
          >
            <h3 class="text-lg font-semibold">{{ edu.degree }}</h3>
            <p class="text-indigo-600 dark:text-indigo-400">{{ edu.school }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ edu.date }} · {{ edu.location }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="bg-white dark:bg-[#1b1b1f] rounded-lg shadow-md dark:shadow-lg border border-gray-100 dark:border-transparent text-gray-800 dark:text-gray-200">
    <div class="container max-w-5xl px-4 py-12 mx-auto">
      <div class="grid gap-4 mx-4 sm:grid-cols-12">
        <div class="col-span-12 sm:col-span-3">
          <div class="text-center sm:text-left mb-8 before:block before:w-24 before:h-3 before:mb-5 before:rounded-md before:mx-auto sm:before:mx-0 before:bg-indigo-600 dark:before:bg-indigo-400">
            <h3 class="text-3xl font-semibold">Technical Skills</h3>
            <span class="text-sm font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400">Technologies & Practices</span>
          </div>
        </div>
        <div class="col-span-12 px-4 sm:col-span-9">
          <div v-for="(items, category) in skills" :key="category" class="mb-6 last:mb-0">
            <h4 class="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">{{ category }}</h4>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(skill, i) in items"
                :key="i"
                class="px-3 py-1 text-sm rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              >
                {{ skill }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  </div>
</template>

<script>
import experienceData from "./experienceData";
import contractData from "./contractData";
import educationData from "./educationData";
import skillsData from "./skillsData";
import summaryData from "./summaryData";

export default {
  data() {
    return {
      summary: summaryData,
      experiences: experienceData,
      contracts: contractData,
      education: educationData,
      skills: skillsData,
    };
  },
};
</script>

<style scoped>
/* Add any specific styles you need */
</style>
