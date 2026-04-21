import { getCache, setCache, deleteCache, clearCache, pruneExpired, loadCache } from './cache';

export function printUsage(): void {
  console.log(`Usage: stacktrace-link cache <command> [args]

Commands:
  get <key>              Retrieve a cached value by key
  set <key> <value>      Store a value (JSON) under key
  delete <key>           Remove a cached entry
  list                   List all cache keys
  clear                  Remove all cache entries
  prune                  Remove expired entries
`);
}

export function runGet(key: string): void {
  const val = getCache(key);
  if (val === undefined) {
    console.error(`Cache miss: '${key}'`);
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify(val, null, 2));
  }
}

export function runSet(key: string, rawValue: string): void {
  let value: unknown;
  try {
    value = JSON.parse(rawValue);
  } catch {
    value = rawValue;
  }
  setCache(key, value);
  console.log(`Cached '${key}'.`);
}

export function runDelete(key: string): void {
  const removed = deleteCache(key);
  if (removed) {
    console.log(`Deleted '${key}'.`);
  } else {
    console.error(`Key '${key}' not found.`);
    process.exitCode = 1;
  }
}

export function runList(): void {
  const cache = loadCache();
  const keys = Object.keys(cache.entries);
  if (keys.length === 0) {
    console.log('Cache is empty.');
  } else {
    keys.forEach(k => console.log(k));
  }
}

export function runCacheCli(args: string[]): void {
  const [cmd, ...rest] = args;
  switch (cmd) {
    case 'get': return runGet(rest[0]);
    case 'set': return runSet(rest[0], rest[1]);
    case 'delete': case 'del': return runDelete(rest[0]);
    case 'list': return runList();
    case 'clear': clearCache(); console.log('Cache cleared.'); break;
    case 'prune': {
      const n = pruneExpired();
      console.log(`Pruned ${n} expired entr${n === 1 ? 'y' : 'ies'}.`);
      break;
    }
    default: printUsage();
  }
}
