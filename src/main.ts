import * as dat from "dat.gui";
import { p } from "./params";
import { addDatGuiControls } from "./dat.gui";
import { restoreFromLocalstorage, saveToLocalstorage } from "./persistence";
import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    Example with dat.gui
  </div>
`;

const params = p({
  foo: p(1),
  nested: p({
    bar: p(2, 0, 10, 0.1),
    bgColor: p("#fff"),
  }),
});

restoreFromLocalstorage(params);
params.on("change", (key, newValue) => {
  console.log("change", key, newValue, params.values());
  saveToLocalstorage(params);
});

addDatGuiControls(params, new dat.GUI());
