import { createRouter, createWebHistory } from 'vue-router'
import Home from '../features/home/pages/HomePage.vue'

export default createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: Home },
        { path: '/blog/:slug', component: () => import('../features/blog/pages/BlogPostPage.vue') },
    ]
})
