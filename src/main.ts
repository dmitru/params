import * as dat from "dat.gui";
import { p } from "./params";
import { addDatGuiControls } from "./addons/dat.gui";
import {
  restoreFromLocalstorage,
  saveToLocalstorage,
} from "./addons/persistence";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    Example with dat.gui
  </div>
`;

const params = p({
  foo: p(1),
  nested: p({
    bar: p(2, 0, 10, 0.1),
    bgColor: p("#ffd332ff"),
  }),
});

restoreFromLocalstorage(params);
params.on("change", (key, newValue) => {
  console.log("change", key, newValue, params.values());
  saveToLocalstorage(params);
});

params.get("nested.bgColor").onChange((newColor, param) => {
  console.log("nested.bgColor.onChange", newColor, param);
});

addDatGuiControls(params, new dat.GUI());
