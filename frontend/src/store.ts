import { reactive, watch } from 'vue'
import { z } from 'zod'

const SerializedStore = z.object({
  auth: z
    .object({
      authenticated: z.boolean().default(false),
      token: z.string().nullable().optional().default(null),
    })
    .optional()
    .default({}),
  settings: z
    .object({
      preferredResultsView: z.enum(['cards', 'list']).optional().default('cards'),
    })
    .optional()
    .default({}),
})

type Store = z.output<typeof SerializedStore>

const parseLocalStorage = () => {
  try {
    const data = JSON.parse(localStorage.getItem('store') ?? '{}')
    return SerializedStore.parse(data)
  } catch (e) {
    return SerializedStore.parse({})
  }
}

export const store = reactive<Store>(parseLocalStorage())

watch(store, () => {
  localStorage.setItem('store', JSON.stringify(store))
})
