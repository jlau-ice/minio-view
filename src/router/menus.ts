import type {RouteRecordRaw} from "vue-router";

export const menus: Array<RouteRecordRaw> = [
    {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: {title: '统计看板'}
    },
    {
        path: 'manager',
        name: 'manager',
        component: () => import('@/views/Users.vue'),
        meta: {title: '人员管理'}
    },
]