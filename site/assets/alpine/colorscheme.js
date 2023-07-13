export default function () {
  Alpine.data("colorscheme", () => ({
    get scheme() {
      return this.$store.colorscheme.get();
    },

    set scheme(value) {
      this.$store.colorscheme.set(value);
    },

    init() {
      this.$refs.svg.classList.toggle("moon", this.scheme === "dark");
    },

    toggle() {
      const html = document.querySelector("html");
      this.scheme = html.dataset.theme === "dark" ? "light" : "dark";
      this.$refs.svg.classList.toggle("moon");
      html.dataset.theme = this.scheme;
    },
  }));

  Alpine.store("colorscheme", {
    scheme: localStorage.colorscheme || "dark",

    init() {
      const html = document.querySelector("html");

      if (!localStorage.colorscheme && !html.dataset.theme) {
        // check system preference
        if (window.matchMedia("(prefers-color-scheme: light)").matches) {
          console.log("System color scheme is light");
          this.set("light");
        } else {
          console.log("System color scheme is dark");
        }
      }

      html.dataset.theme = this.get();
    },

    get() {
      if (this.colorscheme !== localStorage.colorscheme) {
        this.colorscheme = localStorage.colorscheme;
      }
      return this.colorscheme;
    },

    set(value) {
      localStorage.colorscheme = value;
      this.colorscheme = value;
    },
  });
}
