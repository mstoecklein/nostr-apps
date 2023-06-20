import * as monaco from "https://esm.sh/monaco-editor";
import EditorWorker from "https://esm.sh/monaco-editor/esm/vs/editor/editor.worker?worker";
import JSONWorker from "https://esm.sh/monaco-editor/esm/vs/language/json/json.worker?worker";
import CSSWorker from "https://esm.sh/monaco-editor/esm/vs/language/css/css.worker?worker";
import HTMLWorker from "https://esm.sh/monaco-editor/esm/vs/language/html/html.worker?worker";
import TSWorker from "https://esm.sh/monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import { getLanguage, getTagValue } from "../core/helpers.js";

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === "json") {
      return new JSONWorker();
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new CSSWorker();
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new HTMLWorker();
    }
    if (label === "typescript" || label === "javascript") {
      return new TSWorker();
    }
    return new EditorWorker();
  },
};

export default function () {
  // monaco doesn't like the proxy wrapper in Alpine, so we use a WeakMap
  // to store the editor instance and a FinalizationRegistry to gracefully
  // dispose of the editor when the Alpine component is destroyed.
  const wm = new WeakMap();

  /**
   * @type {FinalizationRegistry<monaco.editor.IStandaloneCodeEditor>}
   */
  const registry = new FinalizationRegistry((editor) => {
    editor?.dispose();
  });

  Alpine.data("monaco", () => ({
    get theme() {
      return this.$store.colorscheme.get() === "dark" ? "vs-dark" : "vs";
    },
    value: "",
    liveUpdate: true,
    onResize: null,

    init() {
      this.$watch("theme", () => {
        this.editor()?.updateOptions({ theme: this.theme });
      });

      this.onResize = () => {
        const editor = this.editor();
        if (editor) {
          const element = editor.getContainerDomNode();
          const width = element.clientWidth;
          const height = element.clientHeight;
          this.editor().layout({ width, height });
        }
      };
      window.addEventListener("resize", this.onResize);
    },

    destroy() {
      this.unmount();
      if (this.onResize) {
        window.removeEventListener("resize", this.onResize);
        this.onResize = null;
      }
    },

    mount(options = {}) {
      const editor = monaco.editor.create(this.$el, {
        language: "html",
        theme: this.theme,
        value: "",
        ...options,
      });

      editor.onDidChangeModelContent(() => {
        if (this.liveUpdate) {
          this.$store.presets.selected = null;
          this.value = editor.getValue();
          // this.$store.appdata.event.content = this.value;
        }
      });

      wm.set(this.$root, editor);
      registry.register(this.$root, editor, this.$root);
    },

    unmount() {
      this.editor()?.dispose();
      wm.delete(this.$root);
      registry.unregister(this.$root);
    },

    editor() {
      return wm.get(this.$root);
    },

    updateIframe() {
      const iframe = this.$el;

      // revoke the blob URL when the iframe is unloaded
      iframe.onload = () => {
        URL.revokeObjectURL(iframe.src);
      };

      // create a blob URL and add it to the iframe
      const blob = new Blob([this.value], { type: "text/html" });
      iframe.src = URL.createObjectURL(blob);
    },

    handleAppdata() {
      const inserted = this.$store.appdata.inserted;
      if (inserted) {
        const event = this.$store.appdata.event;
        const model = this.editor()?.getModel();
        if (model) {
          const value = event.content || "";
          const type = getTagValue(event, "type", "text/html");
          const language = getLanguage(type);
          model.setValue(value);
          monaco.editor.setModelLanguage(model, language);
        }
        this.$store.appdata.inserted = false;
      }
    },

    setValue(value) {
      if (this.value === value) return;
      this.editor()?.setValue(value);
    },

    setLanguage(language) {
      const mapping = {
        js: "javascript",
        mjs: "javascript",
        ts: "typescript",
      };
      language = mapping[language] || language;
      const model = this.editor()?.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language);
      }
    },

    setOptions(options) {
      this.editor()?.updateOptions(options);
    },
  }));
}
