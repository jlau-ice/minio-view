import type {RouteRecordRaw} from 'vue-router'
import {menus} from './menus.ts'

export const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: () => import('@/layouts/index.vue'),
    redirect: '/dashboard',
    children: [
      ...menus
    ]
  }
]