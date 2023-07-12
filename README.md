# nostr-apps
Creating Web Apps with Nostr

## App Event

```json
{
  "kind": 31337,
  "pubkey": "<PUBLIC KEY>",
  "created_at": 1234567890,
  "content": "<h1>Hello World!</h1>",
  "tags": [
    ["d", "hello-world"],
    ["type", "text/html"],
    ["name", "Hello World!"],
    ["description", "An example Nostr app."],
    ["alt", "An example Nostr app."],
  ],
  "id": "<ID>",
  "sig": "<SIGNATURE>"
}
```

## Library Event

```json
{
  "kind": 1337,
  "pubkey": "<PUBLIC KEY>",
  "created_at": 1234567890,
  "content": "console.log('Hello World!');",
  "tags": [
    ["type", "application/javascript"],
    ["name", "Hello World!"],
    ["description", "An example Nostr app."],
    ["alt", "An example Nostr app."],
  ],
  "id": "<ID>",
  "sig": "<SIGNATURE>"
}
```
