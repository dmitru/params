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
  instance?: Params<any>;

  constructor(opts: DatGuiPluginOpts = defaultOpts) {
    this.PERSISTENCE_KEY = opts.key ?? defaultOpts.key;
  }

  _autosaveChangeCallback = () => {};

  onKeyDown = (evt: KeyboardEvent) => {
    const isUndo = evt.key === "z" && (evt.ctrlKey || evt.metaKey);
    const isRedo =
      evt.key === "z" && (evt.ctrlKey || evt.metaKey) && evt.shiftKey;

    if (isRedo) {
      this.instance?.redo();
    } else if (isUndo) {
      this.instance?.undo();
    }
  };

  destroy(): void {
    this.gui?.destroy();
    window.removeEventListener("keydown", this.onKeyDown);
  }

  gui?: dat.GUI;

  extend(paramsInstance: Params<any>): void {
    const plugin = this;
    plugin.instance = paramsInstance;

    window.addEventListener("keydown", this.onKeyDown);

    paramsInstance.datGui = function (gui: dat.GUI) {
      plugin.gui = gui;
      addDatGuiControls(this, gui);
    };

    function addDatGuiControls(params: Params, gui: dat.GUI) {
      for (const [key, param] of Object.entries(params.def)) {
        if (param instanceof ColorParam) {
          gui
            .addColor(param, "value")
            .name(param.name)
            .onFinishChange(() => {
              paramsInstance.pushUndoFrame();
            });
        } else if (param instanceof NumberParam) {
          gui
            .add(param, "value", param.min, param.max, param.step)
            .name(param.name)
            .onFinishChange(() => {
              paramsInstance.pushUndoFrame();
            });
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
