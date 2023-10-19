import * as dat from "dat.gui";

import { p } from "./core/params";
import "./plugins/datgui/style.css";
import { PersistencePlugin } from "./plugins/persistence";
import { DatGuiPlugin } from "./plugins/datgui";
import { IosControllerPlugin } from "./plugins/ios-touch-controller";

const params = p({
  p1: p(1),
  p2: p(1),
  p3: p(1),
  // nested: p({
  //   moreNested: p({
  //     foo: p(1, 0, 10, 0.1),
  //     bar: p(1, 0, 10, 0.1),
  //   }),
  //   colors: p({
  //     bgColor: p("#ffd332"),
  //     fgColor: p("#ffd332"),
  //   }),
  // }),
});

params.plugins([
  new PersistencePlugin(),
  new DatGuiPlugin(),
  new IosControllerPlugin(),
]);

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
