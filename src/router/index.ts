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
    path: '/register',
    name: 'Register',
    component: () => import('../components/auth/Register.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/create-organization',
    name: 'CreateOrganization',
    component: () => import('../components/auth/CreateOrganization.vue'),
    meta: { requiresAuth: true, skipOrgCheck: true },
  },
  {
    path: '/',
    component: () => import('../components/layout/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
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
        path: 'workflows/:workflowId/detail',
        name: 'WorkflowDetail',
        component: () => import('../components/workflow/WorkflowDetail.vue'),
        props: true,
      },
      {
        path: 'workflows/:workflowId/executions',
        name: 'WorkflowExecutions',
        component: () => import('../components/workflow/WorkflowExecutions.vue'),
        props: true,
      },
      {
        path: 'workflows/executions/:executionId',
        name: 'ExecutionDetail',
        component: () => import('../components/workflow/ExecutionDetail.vue'),
        props: true,
      },
      {
        path: 'datasources',
        name: 'Datasources',
        component: () => import('../components/datasource/DatasourceManager.vue'),
      },
      {
        path: 'members',
        name: 'Members',
        component: () => import('../components/organization/MemberManager.vue'),
      },
      {
        path: 'templates',
        name: 'Templates',
        component: () => import('../components/template/TemplateMarket.vue'),
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

  // 检查是否需要认证
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/login';
  }

  // 已登录用户访问登录页或注册页，重定向到首页
  if ((to.path === '/login' || to.path === '/register') && authStore.isAuthenticated) {
    return '/';
  }

  // 检查是否需要创建组织
  if (
    to.meta.requiresAuth &&
    !to.meta.skipOrgCheck &&
    authStore.isAuthenticated &&
    authStore.needsOrganization &&
    authStore.organizations.length === 0
  ) {
    return '/create-organization';
  }
});

export default router;
