<script setup>
import { ref, computed } from 'vue'

const username = ref('')
const apiResponse = ref(null)
const activeTab = ref('formatted')

async function fetchGitHubProfile() {
  try {
    const response = await fetch(`https://api.github.com/users/${username.value}`)
    const data = await response.json()
    apiResponse.value = data
  } catch (error) {
    apiResponse.value = { error: error.message }
  }
}

const formattedJson = computed(() => {
  return JSON.stringify(apiResponse.value, null, 2)
})
</script>

<template>
  <div class="github-api-demo p-4 rounded-lg border border-divider">
    <div class="flex mb-4">
  <input
    v-model="username"
    placeholder="Enter GitHub username"
    class="flex-grow px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-l-md focus-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 dark:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800"
  />
  <button
  @click="fetchGitHubProfile"
  class="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-white hover:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 dark:text-white dark:focus:ring-blue-800"
>
  <span class="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 rounded-lg p-1 transition-all duration-300 ease-in-out opacity-0 group-hover:opacity-100"></span>
  
  <span class="relative px-5 py-2.5 text-white transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md">
    Fetch Profile
  </span>
</button>
    </div>
    <div v-if="apiResponse" class="mt-4">
      <div class="flex mb-2">
    <button
      @click="activeTab = 'formatted'"
      :class="[
        'relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium rounded-l-md group',
        activeTab === 'formatted' ? 'text-white' : 'bg-white text-gray-900 dark:text-white'
      ]"
    >
      <span class="relative px-5 py-2.5 transition-all ease-in duration-75 rounded-l-md group-hover:bg-opacity-0">
        Response Body JSON
      </span>
   <div :class="['absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-300', activeTab === 'formatted' ? 'opacity-100' : 'opacity-0']"></div>    </button>
    <button
      @click="activeTab = 'ui'"
      :class="[
        'relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium rounded-r-md group ',
        activeTab === 'ui' ? 'text-white' : 'text-gray-900 dark:text-white'
      ]"
    >
      <span class="relative px-5 py-2.5 transition-all ease-in duration-75 rounded-r-md group-hover:bg-opacity-0">
        User Profile
      </span>
      <div :class="['absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-300', activeTab === 'ui' ? 'opacity-100' : 'opacity-0']"></div>
    </button>
      </div>
      <div v-if="activeTab === 'formatted'" class="bg-background p-4 rounded-md border border-divider">
        <pre class="overflow-x-auto text-sm">{{ formattedJson }}</pre>
      </div>
      <div v-else-if="activeTab === 'ui'" class="bg-background p-4 rounded-md border border-divider">
        <div v-if="!apiResponse.error" class="flex items-start">
          <img :src="apiResponse.avatar_url" :alt="apiResponse.name" class="w-24 h-24 rounded-full mr-4">
          <div>
            <h4 class="text-xl font-bold">{{ apiResponse.name }}</h4>
            <p class="text-text-light">@{{ apiResponse.login }}</p>
            <p v-if="apiResponse.bio" class="mt-2">{{ apiResponse.bio }}</p>
            <div class="mt-2 flex space-x-4">
              <span><strong>{{ apiResponse.followers }}</strong> followers</span>
              <span><strong>{{ apiResponse.following }}</strong> following</span>
              <span><strong>{{ apiResponse.public_repos }}</strong> repos</span>
            </div>
            <a v-if="apiResponse.blog" :href="apiResponse.blog" target="_blank" class="text-accent hover:underline mt-2 block">{{ apiResponse.blog }}</a>
          </div>
        </div>
        <div v-else class="text-red-500">
          Error: {{ apiResponse.error }}
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.github-api-demo {
  /* Custom styles to match VitePress theme */
  --vp-c-bg-soft: var(--vp-c-bg-soft);
  --vp-c-divider: var(--vp-c-divider);
  --vp-c-text-1: var(--vp-c-text-1);
  --vp-c-text-2: var(--vp-c-text-2);
  --vp-c-brand: var(--vp-c-brand);
}

.github-api-demo {
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.github-api-demo input {
  box-shadow: 0 0 0 1px rgba(107, 114, 128, 0.2);
}

.github-api-demo input:focus {
  box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.5);
}

html.dark .github-api-demo input:focus {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.github-api-demo input,
.github-api-demo pre {
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.github-api-demo button {
  background-color: var(--vp-c-brand);
  color: white;
}

.github-api-demo button:hover {
  background-color: var(--vp-c-brand-dark);
}

.github-api-demo .text-text-light {
  color: var(--vp-c-text-2);
}

.github-api-demo .border-divider {
  border-color: var(--vp-c-divider);
}

.github-api-demo .bg-background {
  background-color: var(--vp-c-bg-soft);
}

.github-api-demo .text-accent {
  color: var(--vp-c-brand);
}

.github-api-demo button {
  transition: all 0.3s ease;
}

.github-api-demo button:hover {
  border-color: var(--vp-c-brand);
}

html:not(.dark) .github-api-demo button {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-text-1);
}

html.dark .github-api-demo button {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-text-1);
}

html.dark .github-api-demo button:hover {
  background-color: var(--vp-c-brand);
  color: white;
}
</style>
