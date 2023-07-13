import * as poolctl from "../PoolControl.js";
import eventPolicy from "../core/EventPolicy.js";
import { getNormalizedAppInfo } from "../core/helpers.js";

export default function () {
  Alpine.data("applist", () => ({
    subscriberId: null,

    get list() {
      const list = this.$store.applist.list;
      return list;
    },

    selectApp() {
      const eventId = this.$el.value;
      const { event } =
        this.list.find((item) => item.event_id === eventId) || {};
      if (!event) return;

      this.$store.appdata.setEvent(event);
    },

    async loadMyApps() {
      poolctl.request(
        [{ kinds: [31337], authors: [this.$store.keypair.pubkey] }],
        ["wss://relay.xp.live"],
        () => this.$store.applist.update(),
        { closeOnEose: true }
      );
    },
  }));

  Alpine.store("applist", {
    list: [],

    setList(list) {
      this.list = Array.from(list).map(getNormalizedAppInfo);
    },

    update() {
      this.list = Array.from(eventPolicy.events.values()).map(
        getNormalizedAppInfo
      );
    },
  });
}
