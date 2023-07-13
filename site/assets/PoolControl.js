import eventPolicy from "./core/EventPolicy.js";
import { getId } from "./core/helpers.js";

const poolCallbacks = new Map();
const poolHashes = new Map();
const requestQueue = [];
let port = null;

/**
 * @name NostrEvent
 * @typedef {object} NostrEvent
 * @property {number} kind
 * @property {string} content
 * @property {number} created_at
 * @property {string[][]} tags
 * @property {string} [id] - will be created on signEvent
 * @property {string} [sig] - will be created on signEvent
 */

/**
 * @name NostrFilter
 * @typedef {object} NostrFilter
 * @property {number[]} [kinds]
 * @property {string[]} [ids]
 * @property {string[]} [authors]
 * @property {string} [since]
 * @property {string} [until]
 * @property {number} [limit]
 * @property {string} [search]
 * @property {string[]} [#e] - event reference
 * @property {string[]} [#p] - pubkey reference
 * @property {string[]} [#d] - identifier for parametrized replaceable event
 * @property {string[]} [#a] - parametrized replaceable event reference
 * @property {string[]} [#t] - hashtag
 */

/**
 * @name SubscribeCallbackData
 * @typedef {object} SubscribeCallbackData
 * @property {'event'|'eose'} type
 * @property {NostrEvent} event
 */

/**
 * @name EventCallback
 * @typedef {(data: SubscribeCallbackData, list: NostrEvent[]) => void} EventCallback
 */

/**
 * @name EoseCallback
 * @typedef {(list: NostrEvent[]) => void} EoseCallback
 */

/**
 * @name RequestOptions
 * @typedef {object} RequestOptions
 * @property {string} [subscriberId] - id of the subscriber
 * @property {boolean} [skipVerification] - skip verification of the data
 * @property {boolean} [closeOnEose] - close the subscription when the end of stream is reached
 * @property {EventCallback} [callback] - callback function for each event
 * @property {EoseCallback} [eoseCallback] - callback function for end of stored events
 */

function sendRequest(request) {
  if (!port) {
    requestQueue.push(request);
    return;
  }
  port.postMessage(request);
  if (request.type === "pub" && request.params?.event) {
    eventPolicy.run(request.params.event);
  }
}

/**
 * @param {RequestOptions} options
 * @returns {RequestOptions}
 */
function getRequestOptions(options) {
  let callback, subscriberId, skipVerification, closeOnEose;
  if ("function" === typeof options) {
    callback = options;
  } else if (options) {
    callback = options.callback;
    subscriberId = options.subscriberId;
    skipVerification = options.skipVerification;
    closeOnEose = options.closeOnEose;
  }
  return { callback, subscriberId, skipVerification, closeOnEose };
}

/**
 * Subscribe to events from the pool worker
 * @param {EventCallback|RequestOptions} callbackOrOptions
 * @returns {string} subscriberId
 */
export function subscribe(callbackOrOptions) {
  let options = {};
  if ("function" === typeof callbackOrOptions) {
    options.callback = callbackOrOptions;
  } else if (callbackOrOptions && typeof callbackOrOptions === "object") {
    const entries = Object.entries(callbackOrOptions);
    for (const [key, value] of entries) {
      if (value !== undefined) {
        options[key] = value;
      }
    }
  }

  let id = options.subscriberId;
  if (!id) {
    id = options.subscriberId = getId();
  }
  if (poolCallbacks.has(id)) {
    const oldOptions = poolCallbacks.get(id);
    poolCallbacks.set(id, { ...oldOptions, ...options });
  } else {
    poolCallbacks.set(id, options);
  }
  return id;
}

/**
 * Unsubscribe from events from the pool worker
 * @param {string} subscriberId - id of the subscriber
 */
export function unsubscribe(subscriberId) {
  port.postMessage({
    type: "unsub",
    params: { id: subscriberId },
  });
  poolCallbacks.delete(subscriberId);
  poolHashes.delete(subscriberId);
}

/**
 * Request data from the relay pool
 * @param {NostrFilter[]} filters - see https://github.com/nostr-protocol/nips/blob/master/01.md
 * @param {string[]} relays - list of relays to request data from
 * @param {RequestOptions} callbackOrOptions
 * @returns {string} subscriberId
 */
export function request(filters, relays, callbackOrOptions) {
  if (!filters || (!Array.isArray(filters) && filters.length > 0)) {
    throw new Error("Filters must be an array and not empty!");
  }
  if (!relays || !relays.length) {
    throw new Error("Can't request without relays!");
  }

  const options = getRequestOptions(callbackOrOptions);
  const { skipVerification } = options;
  const id = subscribe(options);
  sendRequest({
    type: "req",
    relays: [...new Set([...relays])],
    params: { filters, options: { id, skipVerification } },
  });
  return id;
}

/**
 * Request count of data found by the filters
 * @param {any[]} filters - see https://github.com/nostr-protocol/nips/blob/master/01.md
 * @param {string[]} relays - list of relays to request data from
 * @param {EventCallback|RequestOptions} [callbackOrOptions] - optional callback or options
 * @returns {string} subscriberId
 */
export function count(filters, relays, callbackOrOptions) {
  if (!filters || (!Array.isArray(filters) && filters.length > 0)) {
    throw new Error("Filters must be an array and not empty!");
  }
  if (!relays || !relays.length) {
    throw new Error("Can't count without relays!");
  }

  const options = getRequestOptions(callbackOrOptions);
  const { skipVerification } = options;
  const id = subscribe(options);
  sendRequest({
    type: "count",
    relays: [...new Set([...relays])],
    params: { filters, options: { id, skipVerification } },
  });
  return id;
}

/**
 * Publish an event to the relay pool
 * @param {NostrEvent} event - see https://github.com/nostr-protocol/nips/tree/master
 * @param {string[]} relays - list of relays to publish the event to
 */
export function publish(event, relays) {
  if (event instanceof Promise) {
    event
      .then((event) => publish(event, relays))
      .catch((error) => console.error(error));
  }
  if (!relays || !relays.length) {
    throw new Error("Can't publish without relays!");
  }
  sendRequest({
    type: "pub",
    relays: [...new Set([...relays])],
    params: { event: JSON.parse(JSON.stringify(event)) },
  });
}

export default function createPoolControl() {
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
      console.log(`%c${type}(${id}):`, "font-weight: 700", event);

      const { callback } = poolCallbacks.get(id);
      if (callback) {
        console.log(
          `Callback for subscriber(${id}) called with ${eventPolicy.events.size} events`
        );
        callback(event, [...eventPolicy.events?.values()]);
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
    }
    if ("eose" === type) {
      const { closeOnEose, eoseCallback } = poolCallbacks.get(id) || {};
      if (eoseCallback) {
        console.log(
          `eose callback for subscriber(${id}) called with ${eventPolicy.events.size} events`
        );
        eoseCallback([...eventPolicy.events?.values()]);
      }
      if (closeOnEose) {
        console.log(`Closing subscriber(${id}) on eose`);
        unsubscribe(id);
      }
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
