import eventPolicy from "./EventPolicy.js";
import * as poolctl from "../PoolControl.js";

const listeners = new Map();

export function subscribe(id, kinds, callback) {
  if (listeners.has(id)) {
    listeners.get(id).push({ kinds, callback });
  } else {
    listeners.set(id, [{ kinds, callback }]);
  }
}

export function unsubscribe(id, callback = null) {
  if (!callback) {
    listeners.delete(id);
    return;
  }
  if (listeners.has(id)) {
    const list = listeners.get(id);
    const remaining = list.filter((item) => item.callback !== callback);
    if (remaining.length === 0) {
      listeners.delete(id);
      return;
    }
    listeners.set(id, remaining);
  }
}

export function listen() {
  const hashmap = new Map();
  poolctl.listen(({ id, type, event }) => {
    // console.log("event", id, type, event);
    if ("event" === type) {
      eventPolicy.run(event);

      const callbacks = listeners.get(id);
      if (callbacks) {
        for (const { kinds, callback } of callbacks) {
          if (kinds.includes(event.kind)) {
            callback(event);
          }
        }
      }

      // update app list if hash changed
      const lastHash = hashmap.get(event.id) || null;
      if (lastHash !== eventPolicy.hash) {
        console.log(
          `%csubscription(${event.id}):%c\n  previous hash: %c${lastHash}%c\n  current  hash: %c${eventPolicy.hash}`,
          "font-weight: 700; font-family: sans-serif; text-transform: uppercase",
          "font-weight: 300",
          "color: hsl(205, 90%, 60%)",
          "color: inherit",
          "color: hsl(205, 90%, 60%)"
        );
        hashmap.set(event.id, eventPolicy.hash);
      }
    } else if ("eose" === type) {
      console.log("eose", event);
      // TODO: handle eose event
    }
  });
}
