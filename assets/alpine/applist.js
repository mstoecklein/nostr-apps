import * as poolctl from "../PoolControl.js";
import { getTagValue } from "../core/helpers.js";

export default function () {
  Alpine.data("applist", () => ({
    subscriberId: null,
    apps: new Map(),

    get appList() {
      return Array.from(this.apps.values()).map((event) => {
        return {
          event_id: event.id,
          identifier: getTagValue(event, "d"),
          type: getTagValue(event, "type"),
          content: event.content,
          event,
        };
      });
    },

    selectApp() {
      const eventId = this.$el.value;
      const event = this.apps.get(eventId);
      this.$store.appdata.setEvent(event);
    },

    async loadMyApps() {
      this.subscriberId = poolctl.subscribe(
        [31337],
        (_, list) => {
          this.apps = new Map(list.map((event) => [event.id, event]));
        },
        "xp:applist"
      );

      const relays = this.$store.profile.writeRelays ?? [];

      poolctl.request(
        [{ kinds: [31337], authors: [this.$store.keypair.pubkey] }],
        {
          id: this.subscriberId,
          relays: [...new Set(relays)],
        }
      );
    },
  }));
}
