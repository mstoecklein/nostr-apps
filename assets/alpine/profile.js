import * as poolctl from "../PoolControl.js";
import { getReadRelays, getWriteRelays } from "../core/Relays.js";

export default function () {
  Alpine.data("profile", () => ({
    subscriberId: null,

    get name() {
      return this.$store.profile.name;
    },

    get about() {
      return this.$store.profile.about;
    },

    get picture() {
      return this.$store.profile.picture;
    },

    async connect() {
      if ("nostr" in window) {
        const pubkey = await nostr.getPublicKey();
        const relays = await nostr.getRelays();
        this.$store.keypair.save({ pubkey, secret: null });
        this.$store.profile.saveRelays(relays);

        console.log("pubkey", pubkey);
        console.log("relays", relays);

        this.subscriberId = poolctl.subscribe(
          [0],
          ({ event }) => {
            const { name, about, picture } = JSON.parse(event?.content || "{}");
            this.$store.profile.saveProfile({ name, about, picture });
            this.$store.keypair.pubkey = event.pubkey;
            this.$store.keypair.secret = null;
          },
          "xp:profile"
        );

        poolctl.request([{ kinds: [0], authors: [pubkey] }], {
          id: this.subscriberId,
          relays: getReadRelays(relays),
        });
      } else {
        alert("You need to install a Nostr extension to use this feature.");
      }
    },

    disconnect() {
      if (this.subscriberId) {
        poolctl.unsubscribe(this.subscriberId);
        this.subscriberId = null;
      }
      this.$store.profile.cleanup();
      this.$store.keypair.cleanup();
    },
  }));

  Alpine.store("profile", {
    name: "",
    about: "",
    picture: "",
    readRelays: ["wss://relay.xp.live"],
    writeRelays: ["wss://relay.xp.live"],

    init() {
      if (localStorage.profileSettings) {
        const settings = JSON.parse(localStorage.profileSettings);
        this.name = settings.name;
        this.about = settings.about;
        this.picture = settings.picture;
        this.readRelays = [
          ...new Set([...settings.readRelays, "wss://relay.xp.live"]),
        ];
        this.writeRelays = [
          ...new Set([...settings.writeRelays, "wss://relay.xp.live"]),
        ];
      }
    },

    saveProfile({ name, about, picture }) {
      this.name = name;
      this.about = about;
      this.picture = picture;
      this.saveLocalStorage({ name, about, picture });
    },

    saveRelays(relays) {
      this.readRelays = [
        ...new Set([...getReadRelays(relays), "wss://relay.xp.live"]),
      ];
      this.writeRelays = [
        ...new Set([...getWriteRelays(relays), "wss://relay.xp.live"]),
      ];
      this.saveLocalStorage({
        readRelays: this.readRelays,
        writeRelays: this.writeRelays,
      });
    },

    saveLocalStorage(data) {
      const settings = JSON.parse(localStorage.profileSettings || "{}");
      localStorage.profileSettings = JSON.stringify({
        ...settings,
        ...data,
      });
    },

    cleanup() {
      this.name = "";
      this.about = "";
      this.picture = "";
      this.readRelays = [];
      this.writeRelays = [];
      localStorage.removeItem("profileSettings");
    },
  });
}
