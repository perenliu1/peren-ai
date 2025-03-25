import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useApiKeyStore = defineStore('apiKey', () => {
  const apiKey = ref(localStorage.getItem('apiKey') || '')

  const saveApiKey = (key) => {
    apiKey.value = key
    localStorage.setItem('apiKey', key)
  }

  return { apiKey, saveApiKey }
})