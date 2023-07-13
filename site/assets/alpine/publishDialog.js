import { signEvent } from "../core/helpers.js";
import * as poolctl from "../PoolControl.js";

export default function () {
  Alpine.data("publishDialog", () => ({
    relays: [],
    selectedRelays: [],

    get open() {
      return this.$store.globalState.showPublishDialog;
    },

    set open(value) {
      this.$store.globalState.showPublishDialog = value;
    },

    async loadRelays() {
      this.relays = [...new Set([...this.$store.profile.writeRelays])];
    },

    async publish() {
      const relays = ["wss://relay.xp.live"];
      const event = this.$store.appdata.event;
      const secret = this.$store.keypair.secret;
      const signedEvent = await signEvent(event, secret);
      poolctl.publish(signedEvent, relays);
      this.open = false;
    },
  }));
}
