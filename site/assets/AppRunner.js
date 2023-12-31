import * as poolControl from "./PoolControl.js";
import { signEvent } from "./core/helpers.js";

export default function listen() {
  globalThis.addEventListener("message", async (event) => {
    const data = event.data;
    if (data.type === "pub") {
      console.log("publishing", data.event, data.relays);
      const signedEvent = await signEvent(
        data.event,
        Alpine.store('keypair').secret
      );
      poolControl.publish(signedEvent, data.relays);
    } else if (data.type === "sub") {
      console.log("subscribing", data.filters, data.relays);
      poolControl.request(data.filters, data.relays, { subscriberId: data.id });
    } else if (data.type === "unsub") {
      console.log("unsubscribing", data.id);
      poolControl.unsubscribe(data.id);
    }
  });
}
