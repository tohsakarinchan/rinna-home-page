// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../App.vue'
import BlogList from '../views/BlogList.vue'
import BlogPost from '../views/BlogPost.vue'

export default createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: Home },
        { path: '/blog', component: BlogList },
        { path: '/blog/:slug', component: BlogPost },
    ]
})