import App from '@/App.vue'
import { router } from '@/routes'
import '@/style.css'
import { useDark, useToggle } from '@vueuse/core'
import { createApp } from 'vue'

export const isDark = useDark({ selector: 'html', attribute: 'class', valueDark: 'dark', valueLight: '' })
export const toggleDark = useToggle(isDark)

createApp(App).use(router).mount('#app')
