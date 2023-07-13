import { nip19 } from "https://esm.sh/nostr-tools@1.12.0";

export default function () {
  Alpine.data("keypair", () => ({
    get hasPubkey() {
      return this.$store.keypair.pubkey !== null;
    },

    get hasSecret() {
      return this.$store.keypair.secret !== null;
    },
  }));

  Alpine.store("keypair", {
    pubkey: null,
    secret: null,

    get npub() {
      if (!this.pubkey) return null;
      return nip19.npubEncode(this.pubkey);
    },

    get nsec() {
      if (!this.secret) return null;
      return nip19.nsecEncode(this.secret);
    },

    init() {
      if (sessionStorage.keypair) {
        const keypair = JSON.parse(sessionStorage.keypair);
        this.pubkey = keypair.pubkey;
        this.secret = keypair.secret;
      }
    },

    save({ pubkey, secret }) {
      this.pubkey = pubkey;
      this.secret = secret;
      sessionStorage.keypair = JSON.stringify({ pubkey, secret });
    },

    cleanup() {
      this.pubkey = null;
      this.secret = null;
      sessionStorage.removeItem("keypair");
    },
  });
}
