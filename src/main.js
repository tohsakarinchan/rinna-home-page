import { createApp } from 'vue'
import RootApp from './app/App.vue'
import router from './app/router.js'

import { vuetify } from './app/plugins/vuetify.js'
import './styles/index.css'

const app = createApp(RootApp);
app.use(vuetify).use(router).mount('#app')



