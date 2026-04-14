import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../components/auth/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../components/layout/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/workflows/create',
      },
      {
        path: 'workflows/create',
        name: 'CreateWorkflow',
        component: () => import('../components/workflow/CreateWorkflow.vue'),
      },
      {
        path: 'workflows/published',
        name: 'PublishedWorkflows',
        component: () => import('../components/workflow/PublishedWorkflows.vue'),
      },
      {
        path: 'datasources',
        name: 'Datasources',
        component: () => import('../components/datasource/DatasourceManager.vue'),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/login';
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    return '/';
  }
});

export default router;
