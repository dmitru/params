import type { Params } from "../../core";
import { IPlugin } from "../plugin";

declare module "../../core" {
  interface Params {
    /** Enables saving and restoring of parameters from LocalStorage */
    enableAutosave(): void;
    /** Disabled saving and restoring of parameters from LocalStorage */
    disableAutosave(): void;
    /** Saves current values to LocalStorage */
    save(): boolean;
    /** Loads saved values to LocalStorage */
    restoreSaved(): boolean;
    /** Clears saved values from LocalStorage */
    clearSaved(): void;
  }
}

export type PersistencePluginOpts = {
  /** Data key for saving/restoring data to/from LocalStorage */
  key: string;
};

const defaultOpts: PersistencePluginOpts = {
  key: "params",
};

export class PersistencePlugin implements IPlugin {
  PERSISTENCE_KEY: string;

  constructor(opts: PersistencePluginOpts = defaultOpts) {
    this.PERSISTENCE_KEY = opts.key ?? defaultOpts.key;
  }

  _autosaveChangeCallback = () => {};

  extend(instance: Params<any>): void {
    const plugin = this;

    this._autosaveChangeCallback = function () {
      saveToLocalstorageThrottled(instance, plugin.PERSISTENCE_KEY);
    };

    instance.enableAutosave = function () {
      plugin._autosaveChangeCallback =
        plugin._autosaveChangeCallback.bind(instance);
      this.on("change", plugin._autosaveChangeCallback);
    };
    instance.disableAutosave = function () {
      this.off("change", plugin._autosaveChangeCallback);
    };

    instance.clearSaved = function () {
      localStorage.removeItem(plugin.PERSISTENCE_KEY);
    };

    instance.restoreSaved = function () {
      return restoreFromLocalstorage(this, plugin.PERSISTENCE_KEY);
    };

    function restoreFromLocalstorage(params: Params, key: string) {
      const dataRaw = localStorage.getItem(key);
      if (dataRaw) {
        const data = JSON.parse(dataRaw);
        params.set(data);
        return true;
      }
      return false;
    }

    function saveToLocalstorage(params: Params, key: string) {
      localStorage.setItem(key, JSON.stringify(params.values()));
    }

    function throttleSave(
      func: (params: Params, key: string) => void,
      interval = 100
    ) {
      let canCall = true;
      let timeout: NodeJS.Timeout;

      return function (this: any, params: Params, key: string) {
        if (canCall) {
          func.apply(this, [params, key]);
          canCall = false;
          timeout = setTimeout(() => {
            canCall = true;
          }, interval);
        }
      };
    }

    const saveToLocalstorageThrottled = throttleSave(saveToLocalstorage);
  }
}
