import CRC32 from "https://esm.run/crc-32";

// NIP-09: Event Deletion
// NIP-16: Event Treatments
// NIP-33: Parametrized Replacable Events
export default {
  events: new Map(),
  removables: new Map(),
  hash: null,

  createHash(value) {
    const serialized = JSON.stringify(Array.from(value.entries()));

    // No need for a cryptographic hash function here, we just need a
    // fast and reliable way to detect changes in the events list.
    this.hash = CRC32.str(serialized);
  },

  run(event) {
    let output = null;
    if (5 === event.kind) {
      const eventIds =
        event.tags?.filter(([type]) => type === "e")?.map(([, id]) => id) || [];

      while (eventIds.length > 0) {
        const id = eventIds.pop();
        const stored = this.events.get(id);
        if (stored && stored.created_at < event.created_at) {
          this.events.delete(id);
        } else {
          for (const [key, stored] of this.events.entries()) {
            if (
              stored &&
              stored.id === id &&
              stored.created_at < event.created_at
            ) {
              this.events.delete(key);
              break;
            }
          }
        }
        this.removables.set(id, event.created_at);
        // console.log("delete event", id);
      }

      this.createHash(this.events);
      return;
    }

    // skip event if removable entry exists and the current event
    // is older than the removable event
    if (
      this.removables.has(event.id) &&
      event.created_at < this.removables.get(event.id)
    ) {
      // console.log("skip event", event.id);
      this.createHash(this.events);
      return;
    }

    if (
      [0, 2, 3].includes(event.kind) ||
      (event.kind >= 10000 && event.kind < 20000)
    ) {
      // replacable event
      const addr = `${event.pubkey}:${event.kind}`;
      this.events.delete(addr);

      // skip event if removable entry exists and the current event
      // is older than the removable event
      if (
        this.removables.has(addr) &&
        event.created_at < this.removables.get(addr)
      ) {
        // console.log("skip event", addr);
        this.createHash(this.events);
        return;
      }

      output = this.events.get(addr);
      if (!output || event.created_at > output?.event?.created_at) {
        this.events.set(addr, (output = event));
        // console.log("replace event");
        this.createHash(this.events);
      }
    } else if (event.kind >= 30000 && event.kind < 40000) {
      // parametrized replacable event
      const [, identifier = ""] =
        event.tags.find(([type]) => type === "d") || [];
      const addr = `${event.kind}:${event.pubkey}:${identifier}`;
      this.events.delete(addr);

      // skip event if removable entry exists and the current event
      // is older than the removable event
      if (
        this.removables.has(addr) &&
        event.created_at < this.removables.get(addr)
      ) {
        // console.log("skip event", addr);
        this.createHash(this.events);
        return;
      }

      output = this.events.get(addr);
      if (!output || event.created_at > output?.event?.created_at) {
        this.events.set(addr, (output = event));
        // console.log("replace event", this.events);
      }
    } else if (this.events.has(event.id)) {
      output = this.events.get(event.id);
    } else {
      this.events.set(event.id, (output = event));
    }

    this.createHash(this.events);
    return output;
  },
};
