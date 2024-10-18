import DefaultTheme from 'vitepress/theme'
import Testimonial from './components/Testimonial.vue'
import CleanCodeCard from './components/CleanCodeCard.vue'
import LiveHttpView from './components/LiveHttpView.vue'
import Label from './components/Label.vue'
import TextToSpeech from './components/TextToSpeech.vue'
import './tailwind.css'  // Import Tailwind CSS

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component('Testimonial', Testimonial)
    app.component('CleanCodeCard', CleanCodeCard)
    app.component('LiveHttpView', LiveHttpView)
    app.component('Label', Label)
    app.component('TextToSpeech', TextToSpeech)
  }
}
