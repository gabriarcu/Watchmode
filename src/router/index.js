import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/explore',
    name: 'Explore',
    component: () => import('../views/Explore.vue')
  },
  {
    path: '/title/:id',
    name: 'TitleDetail',
    component: () => import('../views/TitleDetail.vue')
  },
  {
    path: '/upcoming',
    name: 'Upcoming',
    component: () => import('../views/Upcoming.vue')
  },
  {
    path: '/person/:id',
    name: 'PersonDetail',
    component: () => import('../views/PersonDetail.vue')
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
