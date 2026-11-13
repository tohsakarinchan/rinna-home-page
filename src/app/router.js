import { createRouter, createWebHistory } from 'vue-router'
import { routes, scrollBehavior } from './routes.js'

export default createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior,
})
