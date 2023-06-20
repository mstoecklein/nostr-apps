import appdata from "./alpine/appdata.js";
import appidentifier from "./alpine/appidentifier.js";
import colorscheme from "./alpine/colorscheme.js";
import keypair from "./alpine/keypair.js";
import applist from "./alpine/applist.js";
import monaco from "./alpine/monaco.js";
import presets from "./alpine/presets.js";
import profile from "./alpine/profile.js";
import publishDialog from "./alpine/publishDialog.js";

import poolSetup from "./PoolControl.js";
poolSetup();

globalThis.addEventListener("alpine:init", () => {
  keypair();
  profile();
  colorscheme();
  presets();
  monaco();
  applist();
  appdata();
  appidentifier();
  publishDialog();

  Alpine.store("globalState", {
    showPublishDialog: false,
  });
});
