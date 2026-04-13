import { useAdminStore } from '../store/useAdminStore'

/** Roll a CP value with variance from base.
 *  Reads cpVariance from admin config. */
export function rollCP(baseCP: number): number {
  const { catchConfig } = useAdminStore.getState()
  const variance = baseCP * catchConfig.cpVariance
  const cp = baseCP + (Math.random() * 2 - 1) * variance
  return Math.max(10, Math.round(cp))
}

/** Generate a unique ID */
export function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
