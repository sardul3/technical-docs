import DefaultTheme from 'vitepress/theme'
import Testimonial from './components/Testimonial.vue'
import CleanCodeCard from './components/CleanCodeCard.vue'
import LiveHttpView from './components/LiveHttpView.vue'
import Label from './components/Label.vue'
import TextToSpeech from './components/TextToSpeech.vue'
import PortfolioTopics from './components/PortfolioTopics.vue'
import PortfolioTimeline from './components/PortfolioTimeline.vue'
import PortfolioTestimonials from './components/PortfolioTestimonials.vue'
import PortfolioHeader from './components/PortfolioHeader.vue'
import LanguageLogos from './components/LanguageLogos.vue'
import PortfolioContainer from './components/PortfolioContainer.vue'
import DataIntensiveLessons from './components/DataIntensiveLessons.vue'

import './tailwind.css'  // Import Tailwind CSS
import SwaggerComponent from './components/SwaggerComponent.vue'


export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component('Testimonial', Testimonial)
    app.component('CleanCodeCard', CleanCodeCard)
    app.component('LiveHttpView', LiveHttpView)
    app.component('Label', Label)
    app.component('TextToSpeech', TextToSpeech)
    app.component('PortfolioTopics', PortfolioTopics)
    app.component('PortfolioTimeline', PortfolioTimeline)
    app.component('PortfolioTestimonials', PortfolioTestimonials)
    app.component('PortfolioTopics', PortfolioTopics)
    app.component('PortfolioHeader', PortfolioHeader)
    app.component('LanguageLogos', LanguageLogos)
    app.component('PortfolioContainer', PortfolioContainer)
    app.component('DataIntensiveLessons', DataIntensiveLessons)
    app.component('SwaggerComponent', SwaggerComponent)
  }
}
