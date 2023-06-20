export default function () {
  Alpine.data("nip07", () => ({
    forceInsert: false,
    get hasExtension() {
      return this.$store.nip07.hasExtension;
    },

    async init() {
      const loader = this.$root.dataset.loader;
      if (loader) {
        this.$store.nip07.queue = new Set([...loader.split(/\s+/)]);
      }
    },

    load() {
      const loader = this.$el.dataset?.loader;
      if (loader) {
        this.$store.nip07.queue = new Set([...loader.split(/\s+/)]);
      }
      this.forceInsert = false;
      this.$store.nip07.load();
    },

    insert() {
      this.forceInsert = true;
    }
  }));

  Alpine.store("nip07", {
    hasExtension: "nostr" in globalThis,
    relays: null,
    queue: new Set(),

    get writeRelays() {
      return this.relays
        ? Array.from(Object.entries(this.relays))
            .filter(([, { write }]) => write)
            .map(([url]) => url)
        : [];
    },

    get readRelays() {
      return this.relays
        ? Array.from(Object.entries(this.relays))
            .filter(([, { read }]) => read)
            .map(([url]) => url)
        : [];
    },

    load() {
      const win = Alpine.reactive(globalThis);
      Alpine.effect(() => {
        if ("nostr" in win) {
          this.hasExtension = true;
          // wait for nostr extension to be loaded. This might take some time.
          setTimeout(async () => {
            const $keypair = Alpine.store("keypair");
            for (const type of this.queue.values()) {
              try {
                switch (type) {
                  case "pubkey":
                    $keypair.pubkey = await nostr.getPublicKey();
                    if (!$keypair.pubkey) continue;
                    break;
                  case "relays":
                    this.relays = await nostr.getRelays();
                    if (!this.relays) continue;
                    break;
                  default:
                    console.warn("unknown loader type", type);
                }
              } catch (error) {
                // ignore
                console.warn("failed to load", type);
                console.error(error);
              } finally {
                this.queue.delete(type);
              }
            }
          }, 100);
        }
      });
    },
  });
}
