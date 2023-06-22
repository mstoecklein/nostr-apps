import { nip19 } from "https://esm.sh/nostr-tools@1.12.0";
import * as poolctl from "../PoolControl.js";
import { getLanguage, getTagValue } from "../core/helpers.js";

export default function () {
  Alpine.data("applist", () => ({
    subscriberId: null,
    apps: new Map(),

    get list() {
      return Array.from(this.apps.values()).map((event) => {
        const identifier = getTagValue(event, "d");
        const type = getTagValue(event, "type");
        const language = getLanguage(type);
        const name = getTagValue(event, "name") ?? identifier;
        const summary = getTagValue(event, "summary") ?? "";
        const naddr = nip19.naddrEncode({
          identifier,
          pubkey: event.pubkey,
          kind: event.kind,
          relays: ["wss://relay.xp.live"],
        });
        return {
          event_id: event.id,
          type,
          language,
          identifier,
          name,
          summary,
          naddr,
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
      const relays = this.$store.profile.writeRelays ?? [];
      this.subscriberId = poolctl.request(
        [{ kinds: [31337], authors: [this.$store.keypair.pubkey] }],
        [...new Set(relays)],
        (_, list) => {
          this.apps = new Map(list.map((event) => [event.id, event]));
        },
      );
    },
  }));
}
