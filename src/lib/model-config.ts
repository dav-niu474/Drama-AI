/**
 * DramaAI - Shared Model Config Helper
 * Centralizes the getModelConfig logic used across all generate routes
 */

import { db } from './db'
import { getApiKey } from './providers'

export interface ResolvedModelConfig {
  provider: string
  modelId: string
  apiKey: string
  config: Record<string, unknown>
  enabled: boolean
}

/** Read model config from database, returning provider/model/apiKey/config */
export async function getModelConfig(category: string): Promise<ResolvedModelConfig | null> {
  try {
    const record = await db.modelConfig.findUnique({ where: { category } })
    if (record) {
      return {
        provider: record.provider,
        modelId: record.modelId,
        apiKey: record.apiKey,
        config: JSON.parse(record.config),
        enabled: record.enabled,
      }
    }
  } catch {
    // fallback to null
  }
  return null
}

/** Resolve the API key: user-provided key takes priority over env var */
export function resolveApiKey(providerId: string, userKey?: string): string | undefined {
  if (userKey) return userKey
  return getApiKey(providerId)
}
