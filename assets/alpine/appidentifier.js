import { getTagValue, setTagValues } from "../core/helpers.js";

export default function () {
  Alpine.data("appidentifier", () => ({
    identifier: Alpine.store("appdata").identifier,

    init() {
      this.$watch("identifier", (value) => {
        setTagValues(this.$store.appdata.event, "d", value);
      });
    },

    handleAppdata() {
      const event = this.$store.appdata.event;
      if (!event) {
        return;
      }
      const identifier = getTagValue(event, "d", "");
      if (identifier || !this.identifier?.trim()) {
        this.identifier = identifier || "";
      }
    },
  }));
}
