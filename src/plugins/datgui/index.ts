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

  destroy(): void {
    this.gui?.destroy();
  }

  gui?: dat.GUI;

  extend(instance: Params<any>): void {
    const plugin = this;

    instance.datGui = function (gui: dat.GUI) {
      plugin.gui = gui;
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
        } else {
        }
      }

      // Refresh the UI when params change
      params.on("change", () => {
        gui.updateDisplay();
      });
    }
  }
}
