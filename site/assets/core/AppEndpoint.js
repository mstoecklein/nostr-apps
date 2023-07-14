export class AppEndpoint {
  subscriptions = new Set();

  pub(event, relays) {
    window.parent.postMessage(
      {
        type: "pub",
        event,
        relays,
      },
      "*"
    );
  }

  sub(filters, relays) {
    window.parent.postMessage(
      {
        type: "sub",
        id: crypto.randomUUID(),
        filters,
        relays,
      },
      "*"
    );
  }

  unsub(id) {
    window.parent.postMessage(
      {
        type: "unsub",
        id,
      },
      "*"
    );
  }

  listen(callback) {
    window.addEventListener("message", (event) => callback(event.data));
  }
}
