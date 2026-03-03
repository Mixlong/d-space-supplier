import { createApp } from "vue"

import ElementPlus from "element-plus"
import "element-plus/dist/index.css"
import locale from "element-plus/es/locale/lang/zh-cn"

import * as ElementPlusIconsVue from "@element-plus/icons-vue"

import "@/assets/styles/index.scss"

import App from "./App.vue"
import store from "./store"
import router from "./router"
import plugins from "./plugins"

import SearchBar from "@/components/SearchBar/index.vue"
import PageTable from "@/components/PageTable/index.vue"

import "./permission"

const app = createApp(App)

app.use(router)
app.use(store)
app.use(plugins)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus, {
  locale: locale,
  size: localStorage.getItem("size") || "small",
})

app.component("SearchBar", SearchBar)
app.component("PageTable", PageTable)

app.mount("#app")

router.isReady().then(() => {
  document.body.classList.add("loaded")
})
