export default function () {
  const presets = new Map([
    [
      "Hello World App",
      {
        identifier: "Hello World App",
        language: "html",
        content: /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0">
  <title>Hello, World App</title>
  <style>
    body {
      display: grid;
      place-items: center;
      font-family: sans-serif;
      height: 100vh;
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <h1>Hello, world!</h1>
</body>
</html>`,
      },
    ],
  ]);

  Alpine.data("presets", () => ({
    get list() {
      return [...presets.values()];
    },

    get selected() {
      const value = this.$el.value;
      return this.$store.presets.selected?.identifier === value;
    },

    select() {
      this.$store.presets.select(this.$el.value);
      this.$nextTick(() => {
        this.$el.value = "";
      });
    },

    reset() {
      this.$store.presets.select(null);
    },
  }));

  Alpine.store("presets", {
    selected: null,
    select(identifier) {
      const appdata = Alpine.store("appdata");
      const preset = presets.get(identifier) ?? null;
      appdata.setPreset(preset);
    },
  });
}
