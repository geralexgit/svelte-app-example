import { createSvelteStore } from '@storeon/svelte'
import devTools from 'storeon/devtools'

let counter = store => {
  store.on('@init', () => ({ count: 0 }))
  store.on('inc', ({ count }) => ({ count: count + 1 }))
}

let currentUser = store => {
  store.on('@init', () => ({ currentUser: {} }))
  store.on('user/auth', ({ currentUser }, user) => {
    return { currentUser: { ...user } }
  })
}

export const connect = createSvelteStore([counter, currentUser, devTools])
