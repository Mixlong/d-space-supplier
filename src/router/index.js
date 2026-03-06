import { createWebHistory, createRouter } from "vue-router"

const Layout = () => import("@/layout/index.vue")

export const constantRoutes = [
  {
    path: "/",
    component: Layout,
    redirect: "/supplier/delivery/my-purchase-orders",
    hidden: true,
    children: [
      {
        path: "dashboard",
        component: () => import("@/views/dashboard/index.vue"),
        name: "Dashboard",
        hidden: true,
        meta: { title: "首页", icon: "HomeFilled", affix: true },
      },
    ],
  },
  {
    path: "/supplier",
    component: Layout,
    redirect: "/supplier/delivery/my-purchase-orders",
    meta: { title: "订单交付", icon: "OfficeBuilding" },
    children: [
      {
        path: "delivery/my-purchase-orders",
        component: () => import("@/views/supplier/delivery/my-purchase-orders.vue"),
        name: "MyPurchaseOrders",
        meta: { title: "未交订单", icon: "Tickets" },
      },
      {
        path: "delivery/my-confirmations",
        component: () => import("@/views/supplier/delivery/my-confirmations.vue"),
        name: "MyConfirmations",
        meta: { title: "已交订单", icon: "DocumentCopy" },
      },
    ],
  },
  {
    path: "/assessment",
    component: Layout,
    redirect: "/assessment/records",
    meta: { title: "质量考核", icon: "DataAnalysis" },
    children: [
      {
        path: "records",
        component: () => import("@/views/supplier/delivery/my-timeliness.vue"),
        name: "AssessmentRecords",
        meta: { title: "质量考核", icon: "DataLine" },
      },
    ],
  },
  {
    path: "/redirect",
    component: Layout,
    hidden: true,
    children: [
      {
        path: "/redirect/:path(.*)",
        component: () => import("@/views/redirect/index.vue"),
      },
    ],
  },
  {
    path: "/login",
    component: () => import("@/views/login/index.vue"),
    hidden: true,
  },
  {
    path: "/401",
    component: () => import("@/views/error/401.vue"),
    hidden: true,
  },
  {
    path: "/:pathMatch(.*)*",
    component: () => import("@/views/error/404.vue"),
    hidden: true,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

export default router
