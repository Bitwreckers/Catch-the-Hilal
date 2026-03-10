import { apiClient } from './client'

export async function getAnnouncements() {
  const res = await apiClient.get('/api/v1/notifications')
  return res.data.data ?? []
}

