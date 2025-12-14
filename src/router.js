// 1. Change the import to createWebHashHistory
import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import ListView from './views/ListView.vue'
import DetailView from './views/DetailView.vue'
import LoginView from './views/LoginView.vue'
import CreateUserView from './views/CreateUserView.vue'

const router = createRouter({
  // 2. Use Hash History here
  history: createWebHashHistory(), 
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/list', name: 'list', component: ListView },
    { path: '/creature/:id', name: 'detail', component: DetailView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/create-user', name: 'create-user', component: CreateUserView }
  ]
})

export default router