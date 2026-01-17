import type {RouteRecordRaw} from "vue-router";

export const menus: Array<RouteRecordRaw> = [
    {
        path: 'gallery',
        name: 'Gallery',
        component: () => import('@/views/Gallery.vue'),
        meta: {title: '图库'}
    },
    {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: {title: '配置'}
    },
]