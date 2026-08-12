import { createWebHashHistory, createRouter } from "vue-router"

const Layout = () => import("@/layout/index.vue")

export const constantRoutes = [
  {
    path: "/",
    component: Layout,
    redirect: "/bluetooth/version",
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
        meta: {
          title: "未交订单",
          icon: "Tickets",
          permissions: [
            "supplier:delivery:query",
            "supplier:delivery:myPurchaseOrders",
            "vendor:delivery:query",
            "vendor:delivery:myPurchaseOrders",
          ],
        },
      },
      {
        path: "delivery/my-confirmations",
        component: () => import("@/views/supplier/delivery/my-confirmations.vue"),
        name: "MyConfirmations",
        meta: {
          title: "已交订单",
          icon: "DocumentCopy",
          permissions: [
            "supplier:delivery:query",
            "supplier:delivery:myConfirmations",
            "vendor:delivery:query",
            "vendor:delivery:myConfirmations",
          ],
        },
      },
      // {
      //   path: "delivery/my-forecast",
      //   component: () => import("@/views/supplier/delivery/my-forecast.vue"),
      //   name: "MyForecast",
      //   meta: { title: "预测订单", icon: "Tickets" },
      // },
    ],
  },
  {
    path: "/assessment",
    component: Layout,
    redirect: "/assessment/incoming-quality",
    alwaysShow: true,
    meta: { title: "质量情况", icon: "DataAnalysis" },
    children: [
      // {
      //   path: "specs-drawings",
      //   component: () => import("@/views/supplier/quality/specs-drawings.vue"),
      //   name: "SpecsDrawings",
      //   meta: { title: "规格&图纸", icon: "Document" },
      // },
      {
        path: "incoming-quality",
        component: () => import("@/views/supplier/delivery/incoming-quality.vue"),
        name: "IncomingQuality",
        meta: {
          title: "来料质量",
          icon: "Histogram",
          permissions: [
            "supplier:quality:query",
            "supplier:assessment:query",
            "supplier:quality:incoming",
            "vendor:quality:query",
          ],
        },
      },
      // {
      //   path: "process-quality",
      //   component: () => import("@/views/supplier/quality/process-quality.vue"),
      //   name: "ProcessQuality",
      //   meta: { title: "制程质量", icon: "Setting" },
      // },
      // {
      //   path: "after-sales-quality",
      //   component: () => import("@/views/supplier/quality/after-sales-quality.vue"),
      //   name: "AfterSalesQuality",
      //   meta: { title: "售后质量", icon: "Service" },
      // },
    ],
  },
  {
    path: "/bluetooth",
    component: Layout,
    redirect: "/bluetooth/version",
    meta: { title: "蓝牙管理", icon: "Cpu" },
    children: [
      {
        path: "version",
        component: () => import("@/views/supplier/bluetooth/bluetooth-version.vue"),
        name: "BluetoothVersion",
        meta: { title: "正式版本", icon: "Connection" },
      },
      {
        path: "records",
        component: () => import("@/views/supplier/bluetooth/bluetooth-records.vue"),
        name: "BluetoothRecords",
        meta: { title: "申请记录", icon: "Tickets" },
      },
    ],
  },
  {
    path: "/timeliness",
    component: Layout,
    redirect: "/timeliness/index",
    meta: { title: "季度考核", icon: "DataLine" },
    children: [
      {
        path: "index",
        component: () => import("@/views/supplier/delivery/my-timeliness.vue"),
        name: "AssessmentRecords",
        meta: {
          title: "季度考核",
          icon: "DataLine",
          permissions: [
            "supplier:assessment:query",
            "vendor:assessment:query",
            "supplier:timeliness:query",
            "vendor:delivery:timeliness:query",
          ],
        },
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
    component: Layout,
    hidden: true,
    children: [
      {
        path: "",
        component: () => import("@/views/error/401.vue"),
        name: "Page401",
        meta: { title: "无权限" }
      }
    ]
  },
  {
    path: "/:pathMatch(.*)*",
    component: () => import("@/views/error/404.vue"),
    hidden: true,
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

export default router
