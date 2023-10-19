import { Params, ColorParam, NumberParam } from "../../core";
import { IPlugin } from "../plugin";

declare module "../../core" {
  interface Params {
    /** Creates UI controls in the provided dat.gui instance */
    datGui(gui: dat.GUI): void;
  }
}

export type DatGuiPluginOpts = {
  /** Data key for saving/restoring data to/from LocalStorage */
  key: string;
};

const defaultOpts: DatGuiPluginOpts = {
  key: "params",
};

export class DatGuiPlugin implements IPlugin {
  PERSISTENCE_KEY: string;

  constructor(opts: DatGuiPluginOpts = defaultOpts) {
    this.PERSISTENCE_KEY = opts.key ?? defaultOpts.key;
  }

  _autosaveChangeCallback = () => {};

  extend(instance: Params<any>): void {
    const plugin = this;

    instance.datGui = function (gui: dat.GUI) {
      addDatGuiControls(this, gui);
    };

    function addDatGuiControls(params: Params, gui: dat.GUI) {
      console.log("addDatGuiControls", params.def);
      for (const [key, param] of Object.entries(params.def)) {
        console.log("addDatGuiControls", key, param);
        if (param instanceof ColorParam) {
          console.log("check 1");
          gui.addColor(param, "value").name(param.name);
        } else if (param instanceof NumberParam) {
          console.log("check 2");
          gui
            .add(param, "value", param.min, param.max, param.step)
            .name(param.name);
        } else if (param instanceof Params) {
          console.log("check 3");
          const folder = gui.addFolder(key);
          folder.open();
          addDatGuiControls(param, folder);
        } else {
          console.log("check 4");
        }
      }

      // Refresh the UI when params change
      params.on("change", () => {
        gui.updateDisplay();
      });
    }
  }
}
