import appview from "./alpine/appview.js";
import colorscheme from "./alpine/colorscheme.js";
import keypair from "./alpine/keypair.js";
import profile from "./alpine/profile.js";

import poolSetup from "./PoolControl.js";
import appRunner from "./AppRunner.js";
poolSetup();
appRunner();

globalThis.addEventListener("alpine:init", () => {
  keypair();
  profile();
  colorscheme();

  appview();
});
