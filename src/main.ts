import * as dat from "dat.gui";

import { p } from "./params";
import "./addons/dat.gui";
import "./addons/persistence";

const params = p({
  foo: p(1),
  nested: p({
    bar: p(1, 0, 10, 0.1),
    bgColor: p("#ffd332"),
  }),
});

// Enable Dat.gui controls
const gui = new dat.GUI();
params.datGui(gui);

// Enable autosave and restore from LocalStorage
params.restoreSaved();
params.enableAutosave();

//
//
// Render the params as JSON to the DOM
function updateHtml() {
  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <pre style="font-size: 20px; padding: 30px; color: #eee; background: #333;">${JSON.stringify(
    params.values(),
    null,
    2
  )}
  </pre>
`;
}
updateHtml();

params.on("change", (key, newValue) => {
  console.log("change", key, newValue, params.values());
  updateHtml();
});

// Expose params to the window for debugging
// @ts-ignore
window["params"] = params;
