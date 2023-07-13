import { getSignature, nip19 } from "https://esm.sh/nostr-tools@1.12.0";
import mime from "https://esm.sh/mime@3.0.0/lite";

let currentTime = 0;
let currentCount = 0;

/**
 * Generates a unique ID
 * @param {number} padding Amount of zeros to pad the count with
 * @returns {string} A unique ID
 */
export function getId(padding = 1) {
  const now = Date.now();
  if (now === currentTime) {
    currentCount++;
  } else {
    currentTime = now;
    currentCount = 0;
  }
  return `${now}${currentCount.toString().padStart(padding, "0")}`;
}

/**
 * Set the value of a tag type
 * @param {{tags?: Array<[string, ...string[]]>}} event
 * @param {string} type The tag type to set
 * @param  {...string[]} values One or more values to set
 */
export function setTagValues(event, type, ...values) {
  if (!event?.tags) {
    return;
  }
  const index = event?.tags?.findIndex(([t]) => t === type) ?? -1;
  if (index === -1) {
    event.tags.push([type, ...values]);
  } else {
    event.tags[index] = [type, ...values];
  }
}

export function getLanguage(type) {
  return mime.getExtension(type);
}

export function getContentType(language) {
  return mime.getType(language);
}

/**
 * Get the value of a tag type
 * @param {{tags?: Array<[string, ...string[]]>}} event
 * @param {string} type filter by tag type
 * @param {string | null} [defaultValue=null] define default value if no tag is found
 * @returns {string | null} value of tag
 */
export function getTagValue(event, type, defaultValue = null) {
  return event?.tags?.find(([t]) => t === type)?.[1] ?? defaultValue;
}

/**
 * Get all values of a tag type
 * @param {{tags?: Array<[string, ...string[]]>}} event
 * @param {string} type filter by tag type
 * @param {*} [defaultValue] define default value if no tag is found
 * @param {{ flat: boolean, unique: boolean }} [options] flat: flatten the array, unique: remove duplicates
 * @returns {string[] | string[][]} array of values
 */
export function getTagValues(
  event,
  type,
  defaultValue = [],
  { flat = false, unique = false } = {}
) {
  const values =
    event?.tags
      ?.filter(([t]) => t === type)
      // remove duplicates from array if unique is true and flat is false
      ?.map(([, ...v]) => (flat ? v : unique ? [...new Set(v)] : v)) ??
    defaultValue;
  return flat
    ? unique
      ? // remove duplicates from flattened array
        [...new Set([...values.flat()])]
      : values.flat()
    : values;
}

/**
 * Sign an event
 * @param {{kind:number; content:string; created_at?:number; tags: string[][]}} event
 * @param {string} [secret=null] secret is prioritized, but optional if nostr is available.
 *                               If nostr is not available, secret is required.
 *                               If neither is available, an error is thrown.
 * @returns {Promise<any>}
 */
export async function signEvent(oldEvent, secret = null) {
  const { content, tags, kind } = oldEvent;
  const eventSkeleton = {
    created_at: Math.ceil(Date.now() / 1000),
    content,
    kind,
    tags: JSON.parse(JSON.stringify(tags)),
  };

  if (secret) {
    const event = getSignature(eventSkeleton, secret);
    return event;
  } else if ("nostr" in window) {
    const event = await nostr.signEvent(eventSkeleton);
    return event;
  }
  return Promise.reject(new Error("No secret provided"));
}

export function getNormalizedAppInfo(event) {
  const identifier = getTagValue(event, "d");
  const type = getTagValue(event, "type");
  const language = getLanguage(type);
  const name = getTagValue(event, "name") ?? identifier;
  const summary = getTagValue(event, "summary") ?? "";
  const naddr = nip19.naddrEncode({
    identifier,
    pubkey: event.pubkey,
    kind: event.kind,
    relays: ["wss://relay.xp.live"],
  });
  return {
    event_id: event.id,
    type,
    language,
    identifier,
    name,
    summary,
    naddr,
    content: event.content,
    event,
  };
}
