// 1. Change the import to createWebHashHistory
import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import ListView from './views/ListView.vue'
import DetailView from './views/DetailView.vue'
import LoginView from './views/LoginView.vue'
import CreateUserView from './views/CreateUserView.vue'
import SettingsView from './views/SettingsView.vue'

const router = createRouter({
  // 2. Use Hash History here
  history: createWebHashHistory(),

  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: 'Home' } },
    { path: '/list', name: 'list', component: ListView, meta: { title: 'Creatures List' } },
    { path: '/creature/:id', name: 'detail', component: DetailView, meta: { title: 'Creature Detail' } },
    { path: '/login', name: 'login', component: LoginView, meta: { title: 'Login' } },
    { path: '/create-user', name: 'create-user', component: CreateUserView, meta: { title: 'Create User' } },
    { path: '/settings', name: 'settings', component: SettingsView, meta: { title: 'Settings' } }
  ],

  // 🔴 3. NEW: Scroll Behavior Logic
  scrollBehavior(to, from, savedPosition) {
    // If the browser has a "saved" position (because you clicked the Back button),
    // go to that position. This solves the "Return to ListView" requirement.
    if (savedPosition) {
      return savedPosition
    }

    // Otherwise (if you clicked a standard link), go to the top of the page.
    // This solves the "put me up on top" requirement for everything else.
    return { top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  const defaultTitle = 'Unique Beings';
  if (to.meta.title) {
    document.title = `${defaultTitle} - ${to.meta.title}`;
  } else {
    document.title = defaultTitle;
  }
  next();
});

export default router