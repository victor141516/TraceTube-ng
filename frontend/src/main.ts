import App from '@/App.vue'
import { router } from '@/routes'
import '@/style.css'
import { createApp } from 'vue'

createApp(App).use(router).mount('#app')
