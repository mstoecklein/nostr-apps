export function getReadRelays(relays = {}) {
  return Object.entries(relays)
    .filter(([_, { read }]) => read)
    .map(([url]) => url);
}

export function getWriteRelays(relays = {}) {
  return Object.entries(relays)
    .filter(([_, { write }]) => write)
    .map(([url]) => url);
}
