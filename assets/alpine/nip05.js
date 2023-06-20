import { finishEvent, nip05 } from "https://esm.sh/nostr-tools@1.12.0";

export default function () {
  Alpine.data("nip05", () => ({
    name: "",

    get relays() {
      return this.$store.nip07.writeRelays;
    },

    async createEvent() {
      let event = {
        kind: 1337,
        content: this.name,
        created_at: Math.round(Date.now() / 1000),
        tags: [["relays", ...this.$store.nip05.relays]],
      };

      if ("nostr" in globalThis) {
        event = await nostr.signEvent(event);
      } else {
        event = finishEvent(event, this.$store.keypair.secret);
      }

      const res = await fetch(location.href, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });

      if (res.ok && res.status === 204) {
        // check the NIP-05 entry
        const profile = await nip05.queryProfile(
          `${this.name}@${location.host}`
        );
        if (profile) {
          console.log("NIP-05 entry changed!", profile);
        }
      }

      console.log("createEvent", event);
    },
  }));

  // nip05 name input
  Alpine.data("nip05name", () => ({
    onInput() {
      /**
       * @type {HTMLInputElement}
       */
      const input = this.$el;
      const value = input.value;

      if (!/^[a-z0-9-_.]$/.test(value)) {
        // filter out the mismatching characters
        const filtered = value.replace(/[^a-z0-9-_.]/g, "");
        input.value = filtered;
      }
    },
  }));

  Alpine.data("nip05relays", () => ({
    newRelay: "",
    get relays() {
      return this.$store.nip05.relays;
    },
    get list() {
      const list = Array.from(this.relays).sort();
      return list;
    },
    set list(list) {
      if (!list) return;
      this.$store.nip05.relays = new Set([...Array.from(this.relays), ...list]);
    },

    add() {
      const relay = this.newRelay.trim();
      console.log("add", this.newRelay);
      if (relay) {
        try {
          new URL(relay);
          this.relays.add(relay);
          this.newRelay = "";
        } catch {
          // ignore
        }
      }
    },

    change(index) {
      const newValue = this.$el.value;
      const oldValue = this.list[index];
      try {
        new URL(newValue);
        this.relays.delete(oldValue);
        this.relays.add(newValue);
      } catch {
        // ignore
      }
    },

    remove(relay) {
      this.relays.delete(relay);
    },
  }));

  Alpine.store("nip05", {
    name: "",
    relays: new Set(),
  });
}
