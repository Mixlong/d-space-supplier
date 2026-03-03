import { defineStore } from 'pinia'

const useAppStore = defineStore('app', {
  state: () => ({
    sidebar: {
      opened: true,
    },
  }),
  actions: {
    toggleSideBar() {
      this.sidebar.opened = !this.sidebar.opened
    },
  },
})

export default useAppStore
