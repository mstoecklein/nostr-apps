import { getContentType } from "../core/helpers.js";

export default function () {
  Alpine.store("appdata", {
    inserted: false,
    event: {
      kind: 31337,
      pubkey: Alpine.store("keypair").pubkey,
      content: "",
      tags: [
        ["d", ""],
        ["type", "text/html"],
        ["alt", "Web app based on nostr!"],
      ],
    },

    toJSONPreview() {
      this.createEventIfNotExists();
      const event = this.event;
      const json = JSON.stringify(
        {
          ...event,
          created_at: "<UNIX TIMESTAMP>",
          id: "<EVENT ID>",
          sig: "<EVENT SIGNATURE>",
        },
        null,
        2
      );
      return json;
    },

    setEvent(event) {
      this.createEventIfNotExists();
      if (
        this.event.content === "" ||
        (event?.content !== this.event.content &&
          confirm("Discard current view?"))
      ) {
        this.event.content = event?.content || "";
        this.event.tags = Array.from(
          event?.tags.map(([type, ...args]) => [type, ...args]) || []
        );
        this.inserted = true;
      }
    },

    setPreset(preset) {
      this.createEventIfNotExists();
      if (
        this.event.content === "" ||
        (preset?.content !== undefined &&
          preset?.content !== this.event.content &&
          confirm("Discard current view?"))
      ) {
        const event = this.event;
        this.event = null;

        event.content = preset?.content || "";
        event.tags = [
          ["d", preset?.identifier || ""],
          ["type", getContentType(preset?.language || "text/html")],
          ["alt", "Web app based on nostr!"],
        ];
        this.event = event;
        this.inserted = true;
      }
    },

    createEventIfNotExists() {
      if (!this.event) {
        this.event = {
          kind: 31337,
          pubkey: Alpine.store("keypair").pubkey,
          content: "",
          tags: [
            ["d", ""],
            ["type", "text/html"],
            ["alt", "Web app based on nostr!"],
          ],
        };
      }
    },
  });
}
