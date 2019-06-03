import { createSvelteStore } from '@storeon/svelte'

let counter = store => {
  store.on('@init', () => ({ count: 0 }))
  store.on('inc', ({ count }) => ({ count: count + 1 }))
}

export const connect = createSvelteStore([
  counter
])
