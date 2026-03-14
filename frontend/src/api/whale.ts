import { apiClient, getBackendBaseUrl } from './client'

const WHALE_PATH = '/api/v1/plugins/ctfd-whale/container'

function whaleUrl(): string {
  const base = getBackendBaseUrl()
  return base ? `${base}${WHALE_PATH}` : WHALE_PATH
}

export interface WhaleContainerData {
  lan_domain?: string
  user_access?: string
  remaining_time?: number
}

export interface WhaleContainerResponse {
  success: boolean
  data?: WhaleContainerData
  message?: string
}

/** GET container status for a challenge. Returns empty data if no instance running. */
export async function getWhaleContainer(
  challengeId: number
): Promise<WhaleContainerResponse> {
  const res = await apiClient.get<WhaleContainerResponse>(whaleUrl(), {
    params: { challenge_id: challengeId },
    validateStatus: (s) => s === 200 || s === 403,
  })
  return res.data
}

/** POST — start a new container for the challenge */
export async function startWhaleContainer(
  challengeId: number
): Promise<WhaleContainerResponse> {
  const res = await apiClient.post<WhaleContainerResponse>(
    whaleUrl(),
    null,
    {
      params: { challenge_id: challengeId },
      validateStatus: (s) => s === 200 || s === 403,
    }
  )
  return res.data
}

/** PATCH — renew/extend the current container */
export async function renewWhaleContainer(
  challengeId: number
): Promise<WhaleContainerResponse> {
  const res = await apiClient.patch<WhaleContainerResponse>(whaleUrl(), null, {
    params: { challenge_id: challengeId },
    validateStatus: (s) => s === 200 || s === 403,
  })
  return res.data
}

/** DELETE — destroy the current container */
export async function destroyWhaleContainer(): Promise<WhaleContainerResponse> {
  const res = await apiClient.delete<WhaleContainerResponse>(whaleUrl(), {
    validateStatus: (s) => s === 200 || s === 403,
  })
  return res.data
}
