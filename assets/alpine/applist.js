import * as poolctl from "../PoolControl.js";
import { getNormalizedAppInfo } from "../core/helpers.js";

export default function () {
  Alpine.data("applist", () => ({
    subscriberId: null,
    apps: new Map(),

    get list() {
      return this.$store.applist.list;
    },

    selectApp() {
      const eventId = this.$el.value;
      const event = this.apps.get(eventId);
      this.$store.appdata.setEvent(event);
    },

    async loadMyApps() {
      poolctl.request(
        [{ kinds: [31337], authors: [this.$store.keypair.pubkey] }],
        ["wss://relay.xp.live"],
        (_event, list) => {
          this.$store.applist.setList(list);
        },
        { closeOnEose: true }
      );
    },
  }));

  Alpine.store("applist", {
    list: [],

    setList(list) {
      this.list = Array.from(list).map(getNormalizedAppInfo);
    },
  });
}
