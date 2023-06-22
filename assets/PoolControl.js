import eventPolicy from "./core/EventPolicy.js";
import { getId } from "./core/helpers.js";

const poolCallbacks = new Map();
const poolHashes = new Map();
const requestQueue = [];
let port = null;

function sendRequest(request) {
  if (!port) {
    requestQueue.push(request);
    return;
  }
  port.postMessage(request);
}

/**
 * Subscribe to events from the pool worker
 * @param {({id: string; type: 'event' | 'eose'; event: any}) => void} callback
 * @param {string} [predefinedId] - optional predefined id
 * @returns {string} subscriberId
 */
export function subscribe(callback, predefinedId = null) {
  if (typeof callback !== "function") {
    throw new Error("callback must be a function");
  }
  const subscriberId = predefinedId ?? getId();
  poolCallbacks.set(subscriberId, callback);
  return subscriberId;
}

export function unsubscribe(subscriberId) {
  port.postMessage({
    type: "unsub",
    params: { id: subscriberId },
  });
  poolCallbacks.delete(subscriberId);
  poolHashes.delete(subscriberId);
}

export function request(
  filters,
  relays,
  callback,
  { verb, skipVerification, customId } = {}
) {
  if (!filters || (!Array.isArray(filters) && filters.length > 0)) {
    throw new Error("Filters must be an array and not empty!");
  }
  if (!relays || !relays.length) {
    throw new Error("Can't request without relays!");
  }

  const id = subscribe(callback, customId);
  sendRequest({
    type: "req",
    relays: [...new Set([...relays])],
    params: { filters, options: { id, verb, skipVerification } },
  });
  return id;
}

export function count(
  filters,
  relays,
  callback,
  { verb, skipVerification, customId } = {}
) {
  if (!filters || (!Array.isArray(filters) && filters.length > 0)) {
    throw new Error("Filters must be an array and not empty!");
  }
  if (!relays || !relays.length) {
    throw new Error("Can't count without relays!");
  }

  const id = subscribe(callback, customId);
  sendRequest({
    type: "count",
    relays: [...new Set([...relays])],
    params: { filters, options: { id, verb, skipVerification } },
  });
  return id;
}

export function publish(event, { relays } = {}) {
  if (!relays || !relays.length) {
    throw new Error("Can't publish without relays!");
  }
  sendRequest({
    type: "pub",
    relays: [...new Set([...relays])],
    params: { event: JSON.parse(JSON.stringify(event)) },
  });
}

export default function PoolControl() {
  const sharedPoolWorker = new SharedWorker("./assets/PoolWorker.js", {
    type: "module",
    name: "shared-pool-worker",
    credentials: "same-origin",
  });

  port = sharedPoolWorker.port;
  port.start();

  console.log("poolWorker.port.start");

  port.addEventListener("message", ({ data }) => {
    const { id, type, event } = data;
    if ("event" === type) {
      eventPolicy.run(event);

      const callback = poolCallbacks.get(id);
      if (callback) {
        callback(data, [...eventPolicy.events.values()]);
      }

      // update app list if hash changed
      const lastHash = poolHashes.get(id) || null;
      if (lastHash !== eventPolicy.hash) {
        console.log(
          `%csubscription(${id}):%c\n  previous hash: %c${lastHash}%c\n  current  hash: %c${eventPolicy.hash}`,
          "font-weight: 700; font-family: sans-serif; text-transform: uppercase",
          "font-weight: 300",
          "color: hsl(205, 90%, 60%)",
          "color: inherit",
          "color: hsl(205, 90%, 60%)"
        );
        poolHashes.set(id, eventPolicy.hash);
      }
    } else if ("eose" === type) {
      console.log("eose", event);
      // TODO: handle eose event
    }
  });

  while (requestQueue.length) {
    sendRequest(requestQueue.shift());
  }

  sharedPoolWorker.addEventListener("error", (event) => {
    console.error(event);
    // TODO: proper error handling
  });

  globalThis.addEventListener("beforeunload", () => {
    console.log("beforeunload");
    port.close();
  });
}
