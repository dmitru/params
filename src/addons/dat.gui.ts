import { Params, ColorParam, NumberParam } from "../params";

declare module "../params" {
  interface Params {
    /** Creates UI controls in the provided dat.gui instance */
    datGui(gui: dat.GUI): void;
  }
}

Params.prototype.datGui = function (gui: dat.GUI) {
  addDatGuiControls(this, gui);
};

function addDatGuiControls(params: Params, gui: dat.GUI) {
  for (const [key, param] of Object.entries(params.def)) {
    if (param instanceof ColorParam) {
      gui.addColor(param, "value").name(param.name);
    } else if (param instanceof NumberParam) {
      gui
        .add(param, "value", param.min, param.max, param.step)
        .name(param.name);
    } else if (param instanceof Params) {
      const folder = gui.addFolder(key);
      folder.open();
      addDatGuiControls(param, folder);
    }
  }

  // Refresh the UI when params change
  params.on("change", (key, newValue) => {
    gui.updateDisplay();
  });
}
