import { nip19, getPublicKey } from "https://esm.run/poolctl";
import { setRange, getRange } from "https://esm.sh/selection-ranges@3.0.3";

export default function () {
  Alpine.data("nip19minimal", () => ({
    inputType: null,
    inputValue: null,
    outputValue: null,
    obfuscate: false,
    alreadyUpdated: false,

    init() {
      this.inputType = this.$root.dataset.type;
      this.$watch("inputValue", (value) => {
        if (/^(nprofile|nrelay|nevent|naddr|nsec|npub|note)(.+)$/.test(value)) {
          const { type, data } = nip19.decode(value);
          this.alreadyUpdated = true;
          this.inputType = type;
          this.inputValue = data;
          this.outputValue = value;

          if (type === "nsec") {
            this.$store.keypair.secret = data;
            this.$store.keypair.pubkey = getPublicKey(data);
          } else if (type === "npub") {
            this.$store.keypair.secret = null;
            this.$store.keypair.pubkey = data;
          }
        } else if (!this.alreadyUpdated) {
          switch (this.inputType) {
            case "nprofile":
              this.outputValue = nip19.nprofileEncode(value);
              break;
            case "nrelay":
              this.outputValue = nip19.nrelayEncode(value);
              break;
            case "nevent":
              this.outputValue = nip19.neventEncode(value);
              break;
            case "naddr":
              this.outputValue = nip19.naddrEncode(value);
              break;
            case "nsec": {
              this.outputValue = nip19.nsecEncode(value);
              this.$store.keypair.secret = data;
              this.$store.keypair.pubkey = getPublicKey(data);
              break;
            }
            case "npub": {
              this.outputValue = nip19.npubEncode(value);
              this.$store.keypair.secret = null;
              this.$store.keypair.pubkey = value;
              break;
            }
            case "note":
              this.outputValue = nip19.noteEncode(value);
              break;
          }
        } else {
          this.alreadyUpdated = false;
        }
      });
    },

    render(altText = "") {
      const obfuscate = this.obfuscate;
      if (this.outputValue) {
        const [, type, data] = this.outputValue.match(
          /^(nprofile|nrelay|nevent|naddr|nsec|npub|note)?(.+)$/
        );
        if (type) {
          return /*html*/ `<b>${type}</b>${
            obfuscate ? "****************" : data
          }`;
        }
        return data;
      }
      return altText;
    },
  }));

  Alpine.data("nip19", () => ({
    obfuscate: false,
    inputType: null,
    inputValue: null,
    outputValue: null,

    toggleObfuscate() {
      this.obfuscate = !this.obfuscate;
    },

    genNOTE() {
      this.inputType = "note";
      if (!this.inputValue) return;
      try {
        this.outputValue = nip19.noteEncode(
          this.inputValue?.id || this.inputValue
        );
        this.extract(this.outputValue);
        this.obfuscate = false;
      } catch {
        // ignore
      }
    },

    genNEVENT() {
      this.inputType = "nevent";
      if (!this.inputValue) return;
      try {
        this.outputValue = nip19.neventEncode(this.inputValue);
        this.extract(this.outputValue);
        this.obfuscate = false;
      } catch {
        // ignore
      }
    },

    genNADDR() {
      this.inputType = "naddr";
      if (!this.inputValue) return;
      try {
        this.outputValue = nip19.naddrEncode(this.inputValue);
        this.extract(this.outputValue);
        this.obfuscate = false;
      } catch {
        // ignore
      }
    },

    genNSEC() {
      this.inputType = "nsec";
      if (this.$store.keypair.secret) {
        this.inputValue = this.$store.keypair.secret;
      }
      if (!this.inputValue) return;
      try {
        if (this.inputValue.length > 0) {
          this.outputValue = nip19.nsecEncode(this.inputValue);
          this.extract(this.outputValue);
        } else {
          this.outputValue = null;
        }
        this.obfuscate = true;
      } catch {
        // ignore
      }
    },

    genNPUB() {
      this.inputType = "npub";
      if (this.$store.keypair.pubkey) {
        this.inputValue = this.$store.keypair.pubkey;
      }
      if (!this.inputValue) return;
      try {
        if (this.inputValue.length > 0) {
          this.outputValue = nip19.npubEncode(this.inputValue);
          this.extract(this.outputValue);
        } else {
          this.outputValue = null;
        }
        this.obfuscate = false;
      } catch {
        // ignore
      }
    },

    render(altText = "") {
      const obfuscate = this.obfuscate;
      if (this.outputValue) {
        const [, prefix, data] = this.outputValue.match(
          /^(nprofile|nrelay|nevent|naddr|nsec|npub|note)?(.+)$/
        );
        if (prefix) {
          return /*html*/ `<b>${prefix}</b>${
            obfuscate ? "****************" : data
          }`;
        }
        return data;
      }
      return altText;
    },

    extract(value) {
      if (!value) return false;
      try {
        const { type, data } = nip19.decode(value);
        this.inputType = type;
        this.inputValue = data;
        this.outputValue = value;
        return true;
      } catch {
        // ignore
      }
      return false;
    },

    extractNSEC(input) {
      if (!input) return false;
      try {
        const { type, data } = nip19.decode(input);
        if (type === "nsec") {
          this.inputValue = data;
          this.outputValue = input;
          return true;
        }
      } catch {
        // ignore
      }
      return false;
    },

    extractNPUB(input) {
      if (!input) return false;
      try {
        const { type, data } = nip19.decode(input);
        if (type === "npub") {
          this.inputValue = data;
          this.outputValue = input;
          return true;
        }
      } catch {
        // ignore
      }
      return false;
    },

    onClick() {
      const input = this.$el;
      const { length: end } = input.textContent || "";
      if (end > 0) {
        setRange(input, { start: 0, end });
      }
    },

    onCancel() {
      const type = this.inputType;
      this.inputValue = null;
      this.outputValue = null;
      if (type === "nsec") {
        this.$store.keypair.secret = null;
        this.$store.keypair.pubkey = null;
      } else if (type === "npub") {
        this.$store.keypair.pubkey = null;
      }
    },

    cancelIfEmpty() {
      this.outputValue = this.$el.textContent?.trim() || "";
      if (!this.outputValue) {
        this.onCancel();
      }
    },

    async setSecretKey(secret) {
      const isNsec = this.extractNSEC(secret);
      if (!isNsec) {
        this.inputValue = secret;
        this.genNSEC();
      }
      this.obfuscate = true;

      const range = getRange(this.$el);
      setRange(this.$el, { ...range, start: 0 });

      this.$store.keypair.secret = this.inputValue;
      this.$store.keypair.pubkey = getPublicKey(this.inputValue);
    },

    async setPublicKey(pubkey) {
      const isNpub = this.extractNPUB(pubkey);
      if (!isNpub) {
        this.inputValue = pubkey;
        this.genNPUB();
      }
      this.obfuscate = false;

      const range = getRange(this.$el);
      setRange(this.$el, { ...range, start: 0 });
    },

    onContenteditableInput() {
      const type = this.inputType;
      const input = this.$el;
      const text = input.textContent?.trim() || "";
      const offset = getRange(input);
      let [, prefix, data] =
        text.match(/^(nprofile|nrelay|nevent|naddr|nsec|npub|note)?(.*)$/) ||
        [];
      input.textContent = "";

      // Workaround for Firefox clipboard paste
      if (type === "nsec") {
        this.setSecretKey(text);
        prefix = "nsec";
        data = this.outputValue;
      } else if (type === "npub") {
        this.setPublicKey(text);
        prefix = "nsec";
        data = this.outputValue;
      }

      if (prefix !== type) {
        return;
      }

      // validation of NPUB and NSEC values
      const isNpubOrNsec = prefix === "npub" || prefix === "nsec";
      const isValidNpubOrNsec = isNpubOrNsec && text.length === 63;

      // allow other value formats like nprofile, nrelay, nevent, naddr, note
      // as well as valid npub and nsec values
      if (prefix && data && (!isNpubOrNsec || isValidNpubOrNsec)) {
        // render the valid value
        const b = document.createElement("b");
        b.textContent = prefix;
        input.appendChild(b);
        input.appendChild(document.createTextNode(data));
      } else if (text) {
        // render the invalid value
        const del = document.createElement("del");
        del.textContent = text;
        input.appendChild(del);
      }

      setRange(input, offset);
    },
  }));
}
