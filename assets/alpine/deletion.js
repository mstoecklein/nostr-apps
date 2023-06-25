import * as poolctl from "../PoolControl.js";
import { getTagValue, signEvent } from "../core/helpers.js";

export default function () {
  Alpine.data("deletion", () => ({
    deletable: null,

    async onDelete() {
      if (!this.deletable) return;
      const name = getTagValue(
        this.deletable,
        "d",
        getTagValue(this.deletable, "name", "")
      );

      const event = {
        kind: 5,
        content: `App "${name}" with event ID ${this.deletable.id} was deleted`,
        tags: [["e", this.deletable.id]],
      };

      const signedEvent = await signEvent(event, this.$store.keypair.secret);
      poolctl.publish(signedEvent, ["wss://relay.xp.live"]);
      this.$store.applist.update();
    },
  }));
}
