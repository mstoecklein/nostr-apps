# nostr-apps

We are building web apps on top of the nostr protocol.

The demo pages give you an impression how this could be implemented:

- https://mstoecklein.github.io/nostr-apps/site/
- [Example App](https://mstoecklein.github.io/nostr-apps/site/run.html?app=naddr1qq85setvd3hjq4m0wfkxggzpwpcqzymhwden5te0wfjkccte9eu8qtnvd9mx2q3qfa24a4gemqep2zhs60y5qmx33mrmctnh8kjkpnpk2hh48x2du42sxpqqqpaxj8yazkq)


## Behavior

The host generates a blob URL from the app code in the `kind: 31337` event and opens it in the iframe.

Example:
```js
const content = event.content;

const iframe = document.querySelector('iframe');
this.app.element = iframe;

// revoke the blob URL when the iframe is unloaded
iframe.onload = () => {
  URL.revokeObjectURL(iframe.src);
};

// create a blob URL and add it to the iframe
const blob = new Blob([content], { type: "text/html" });
iframe.src = URL.createObjectURL(blob);
```

To tackle security risks, we are using the `sandbox` and strong `csp` attributes on the iframe:

```html
<iframe sandbox="allow-forms allow-scripts" csp="
  default-src 'self'
    unpkg.com
    esm.sh
    esm.run
    cdn.jsdelivr.net
    cdnjs.cloudflare.com
    raw.githubusercontent.com
    cdn.skypack.dev;
  script-src 'unsafe-inline';
  style-src 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self' data:;
  connect-src 'self';
  frame-src 'self';
"></iframe>
```

Allowed domains are `unpkg.com`, `cdn.jsdelivr.net`, `cdnjs.cloudflare.com`, `raw.githubusercontent.com`, `cdn.skypack.dev`, `esm.sh` and `esm.run`. Any other domain will be blocked inside of the iframe. With these we can work with ESM modules and don't need any compiler steps to test our code.

To communication between the app and the host website, we are using postMessage.

iframe <-> host communication:
```js
// iframe
const parent = window.parent;

// send events to parent
parent.postMessage({ ... }, '*');

// receive events from parent
window.addEventListener('message', (event) => {
  console.log('from parent:', event.data);
});

// --------------------------------------------------

// parent window
const iframe = document.querySelector('iframe');

// send events to iframe
iframe.contentWindow.postMessage({ ... });

// receive events from iframe
window.addEventListener('message', (event) => {
  console.log('from iframe:', event.data);
});
```

## postMessage Communication Protocol

We keep it as simple as possible. Here are the events we are using:

### Subscribe to filters

The iframe website will ask for events from the host website. The host website will send events to the iframe website.

Subscribe:
```js
parent.postMessage({
  "type": "sub",
  "id": "<SUBSCRIBER ID>",
  "filters": [
    { "kinds": [1, 4], "limit": 10 },
    { ... another filter ... },
    ...
  ],
  "relays": [
    "https://relay1.example.com",
    "https://relay2.example.com",
    ...
  ]
}, '*');
```

Receiving:
```json
{
  "id": "<SUBSCRIBER ID>",
  "events": [
    ["EVENT", { kind: 1, ... }],
    ["EVENT", { kind: 4, ... }],
    ["EOSE", ...],
  ]
}
```

### Publish an event:

Publishing an event needs the authorization by the user. We are using `nos2x` or `getalby` to sign events. After that the event will be published on the given relays.

```json
{
  "type": "pub",
  "event": { kind: 1, ... },
  "relays": [
    "https://relay1.example.com",
    "https://relay2.example.com",
    ...
  ]
}
```


## Protocol Events

### App Event

A replaceable event that contains the web app content (HTML Website).

```json
{
  "kind": 31337,
  "created_at": 1234567890,
  "content": "<h1>Hello World!</h1>",
  "tags": [
    ["d", "hello-world"],
    ["type", "text/html"],
    ["name", "Hello World!"],
    ["description", "An example Nostr app."],
    ["alt", "An example Nostr app."],
  ],
  "pubkey": "<PUBLIC KEY>",
  "id": "<ID>",
  "sig": "<SIGNATURE>"
}
```

### Library Event

A regular immutable event. Every update is a new event, so we can use it to version content. I think of utilizing the `nostr:` protocol similar to how it's been used in the [NIP-23 Long-form Content](https://github.com/nostr-protocol/nips/blob/master/23.md) draft. For our use-case we are using it for ESM imports and resource targets for scripts, styles and other assets.

```json
{
  "kind": 1337,
  "created_at": 1234567890,
  "content": "console.log('Hello World!');",
  "tags": [
    ["type", "application/javascript"],
    ["name", "Hello World!"],
    ["description", "An example Nostr app."],
    ["alt", "An example Nostr app."],
  ],
  "pubkey": "<PUBLIC KEY>",
  "id": "<ID>",
  "sig": "<SIGNATURE>"
}
```
