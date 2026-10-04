export interface StorageInfo {
  usage: number;
  quota: number;
  remaining: number;
}

export async function storageEstimate(): Promise<StorageInfo> {
  try {
    if (!navigator.storage?.estimate) {
      return { usage: 0, quota: 0, remaining: Number.POSITIVE_INFINITY };
    }
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return { usage, quota, remaining: Math.max(0, quota - usage) };
  } catch {
    return { usage: 0, quota: 0, remaining: Number.POSITIVE_INFINITY };
  }
}

export function quotaWarning(info: StorageInfo): string | null {
  if (!info.quota) return null;
  const ratio = info.usage / info.quota;
  if (ratio >= 0.95 || info.remaining < 8 * 1024 * 1024) {
    return "O armazenamento do Safari está quase cheio. Exporte uma cópia da biblioteca — o iOS pode apagar dados se faltar espaço.";
  }
  if (ratio >= 0.8) {
    return "Está a usar grande parte do espaço disponível. Considere exportar uma cópia de segurança.";
  }
  return null;
}
