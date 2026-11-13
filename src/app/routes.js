// Components are lazy so each space can grow without entering the startup bundle.
const countryPage = () => import('../features/travel/pages/CountryPage.vue')
export const routes = [
  {
    path: '/', component: () => import('../features/experience/layouts/ExperienceLayout.vue'), children: [
      { path: '', name: 'home', component: () => import('../features/home/pages/HomePage.vue') },
      { path: 'eresh', name: 'eresh', component: () => import('../features/experience/pages/EreshPage.vue') },
      { path: 'archer', name: 'archer', component: () => import('../features/experience/pages/ArcherPage.vue') },
      {
        path: 'travel', component: () => import('../features/travel/layouts/TravelLayout.vue'), children: [
          { path: '', name: 'globe', component: () => import('../features/travel/pages/GlobePage.vue') },
          { path: ':country', name: 'country', component: countryPage },
          { path: ':country/trips/:tripId', name: 'trip', component: countryPage },
        ],
      },
      { path: 'blog/:slug', component: () => import('../features/blog/pages/BlogPostPage.vue') },
      { path: ':pathMatch(.*)*', redirect: '/' },
    ],
  },
  { path: '/passport', redirect: '/travel/jp' },
]

export function scrollBehavior(to, from, saved) {
  if (to.params.country === from.params.country && (to.name === 'trip' || from.name === 'trip')) return false
  return saved || { top: 0 }
}
