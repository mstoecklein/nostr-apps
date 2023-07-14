import { nip19 } from "https://esm.sh/nostr-tools@1.12.0";
import * as poolctl from "../PoolControl.js";
import { getTagValue } from "../core/helpers.js";

export default function () {
  Alpine.data("appview", () => ({
    app: null,

    init() {
      const params = new URLSearchParams(location.search);
      const naddr = params.get("app");
      if (!naddr?.startsWith("naddr")) return;

      const subscriberId = poolctl.subscribe((event, list) => {
        console.log(event, list);
        if (event.kind === 31337) {
          const identifier = getTagValue(event, "d", "");
          const name = getTagValue(event, "name", identifier);
          const summary = getTagValue(event, "summary", "");
          const icon = getTagValue(event, "icon", "");
          const thumbnail = getTagValue(event, "thumbnail", "");
          const content = event.content;
          this.app = { content, identifier, name, summary, icon, thumbnail };
        } else if (event.kind === 30023) {
          // it's a long-form text content
          // skip for now
        }
      });

      try {
        const {
          data: { identifier, kind, pubkey, relays },
        } = nip19.decode(naddr);

        console.log("identifier", identifier);
        console.log("kind", kind);
        console.log("pubkey", pubkey);

        poolctl.request(
          [
            {
              kinds: [kind],
              authors: [pubkey],
              "#d": [identifier],
            },
          ],
          relays,
          { subscriberId, closeOnEose: false }
        );
      } catch (error) {
        console.error(error);
      }
    },

    render() {
      if (!this.app) return;
      const iframe = this.$el;
      this.app.element = iframe;

      // revoke the blob URL when the iframe is unloaded
      iframe.onload = () => {
        URL.revokeObjectURL(iframe.src);
      };

      // create a blob URL and add it to the iframe
      const blob = new Blob([this.app.content], { type: "text/html" });
      iframe.src = URL.createObjectURL(blob);
    },

    enableFullscreen() {
      this.app?.element?.requestFullscreen();
    },

    onKeypress() {
      const event = this.$event;
      if (event.key === "f") {
        // enable fullscreen
        this.$el.requestFullscreen();
      }
    },
  }));
}
