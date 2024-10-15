/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './.vitepress/**/*.{vue,js,ts,jsx,tsx}',  // VitePress files
    './docs/**/*.md',                         // Markdown content
    './.vitepress/**/*.vue',             // Vue components in .vitepress
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

