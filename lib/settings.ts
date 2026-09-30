import { prisma } from "./prisma";

let _cache: Map<string, string> | null = null;
let _cacheAt = 0;
const TTL = 60_000;

async function loadSettings(): Promise<Map<string, string>> {
  const now = Date.now();
  if (_cache && now - _cacheAt < TTL) return _cache;
  const rows = await prisma.setting.findMany();
  _cache = new Map(rows.map((r) => [r.key, r.value]));
  _cacheAt = now;
  return _cache;
}

export async function getSetting(key: string, defaultValue = ""): Promise<string> {
  const map = await loadSettings();
  return map.get(key) ?? defaultValue;
}

export async function getSettings(): Promise<Record<string, string>> {
  const map = await loadSettings();
  return Object.fromEntries(map);
}

export function refreshSettings(): void {
  _cache = null;
}