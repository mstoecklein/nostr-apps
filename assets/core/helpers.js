import { getSignature } from "https://esm.sh/nostr-tools@1.12.0";
import mime from "https://esm.sh/mime@3.0.0/lite";

let currentTime = 0;
let currentCount = 0;

/**
 * Generates a unique ID
 * @param {string} [prefix] Prefix to prepend to the ID
 * @param {number} padding Amount of zeros to pad the count with
 * @returns {string} A unique ID
 */
export function getId(prefix = null, padding = 1) {
  const now = Date.now();
  if (now === currentTime) {
    currentCount++;
  } else {
    currentTime = now;
    currentCount = 0;
  }
  return (
    (prefix ? prefix + ":" : "") +
    `${now}${currentCount.toString().padStart(padding, "0")}`
  );
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
export function signEvent(event, secret = null) {
  event = JSON.parse(
    JSON.stringify({
      created_at: Math.round(Date.now() / 1000),
      ...event,
    })
  );
  if (secret) {
    return Promise.resolve(getSignature(event, secret));
  } else if ("nostr" in window) {
    return nostr.signEvent(event);
  }
  return Promise.reject(new Error("No secret provided"));
}
