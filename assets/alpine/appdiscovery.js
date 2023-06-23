import { nip05 } from "https://esm.sh/nostr-tools@1.12.0";
import * as poolctl from "../PoolControl.js";
import { getNormalizedAppInfo } from "../core/helpers.js";

const nip05Pattern =
  /^[a-z0-9][a-z0-9-_.]+@[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/i;

export default function () {
  Alpine.data("appdiscovery", () => ({
    awesomplete: null,
    query: "",
    list: [],

    setupAwesomplete() {
      this.awesomplete = new Awesomplete(this.$el, {
        minChars: 2,
        maxItems: 10,
        autoFirst: true,
        filter(text, input) {
          return true;
        },
      });
    },

    async onInput() {
      this.query = this.$el.value;
      if (nip05Pattern.test(this.query)) {
        const { pubkey } = await nip05.queryProfile(this.query);
        poolctl.request(
          [{ kinds: [31337], authors: [pubkey] }],
          ["wss://relay.xp.live"],
          (_event, list) => {
            this.list = Array.from(list).map(getNormalizedAppInfo);
            if (this.awesomplete) {
              this.awesomplete.list = this.list.map((app) => ({
                label: app.name,
                value: app.identifier,
              }));
            }
          },
          { closeOnEose: true }
        );
      }
    },

    async onEnter() {
      const value = this.$el.value;
      // Check if Value is NIP-05. If yes, create a query to populate the applist store.
      if (nip05Pattern.test(value)) {
        const { pubkey } = await nip05.queryProfile(value);
        poolctl.request(
          [{ kinds: [31337], authors: [pubkey] }],
          ["wss://relay.xp.live"],
          (_event, list) => {
            this.$store.applist.setList(list);
          },
          { closeOnEose: true }
        );
      }
    },

    onSelect(app) {
      console.log(app);
    },
  }));
}
