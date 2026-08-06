import { apiFetch } from '@/lib/api'

export interface Item {
  id: number
  name: string
  description: string | null
  quantity: number
}

export interface CreateItemRequest {
  name: string
  description?: string
  quantity: number
}

export class ItemService {
  static async list(): Promise<Item[]> {
    const response = await apiFetch('/api/items')
    if (!response.ok) {
      throw new Error(`Failed to load items (${response.status})`)
    }
    return (await response.json()) as Item[]
  }

  static async create(request: CreateItemRequest): Promise<Item> {
    const response = await apiFetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    if (!response.ok) {
      throw new Error(`Failed to create item (${response.status})`)
    }
    return (await response.json()) as Item
  }

  static async remove(id: number): Promise<void> {
    const response = await apiFetch(`/api/items/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      throw new Error(`Failed to delete item (${response.status})`)
    }
  }
}
