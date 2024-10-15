import DefaultTheme from 'vitepress/theme'
import Testimonial from './components/Testimonial.vue'
import './tailwind.css'  // Import Tailwind CSS

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component('Testimonial', Testimonial)
  }
}
