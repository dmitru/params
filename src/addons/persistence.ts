import { Params } from "../params";

declare module "../params" {
  interface Params {
    /** Used to save and restore values to/from LocalStorage */
    PERSISTENCE_KEY: string;
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

    _autosaveChangeCallback(): void;
  }
}

Params.prototype.PERSISTENCE_KEY = "params";
Params.prototype._autosaveChangeCallback = function () {
  console.log("autosave");
  saveToLocalstorageDebounced(this, this.PERSISTENCE_KEY);
};
Params.prototype.enableAutosave = function () {
  this._autosaveChangeCallback = this._autosaveChangeCallback.bind(this);
  this.on("change", this._autosaveChangeCallback);
};
Params.prototype.disableAutosave = function () {
  this.off("change", this._autosaveChangeCallback);
};

Params.prototype.clearSaved = function () {
  localStorage.removeItem(this.PERSISTENCE_KEY);
};

Params.prototype.restoreSaved = function () {
  return restoreFromLocalstorage(this, this.PERSISTENCE_KEY);
};

function restoreFromLocalstorage(params: Params, key: string) {
  const dataRaw = localStorage.getItem(key);
  console.log("restoreFromLocalstorage", dataRaw);
  if (dataRaw) {
    const data = JSON.parse(dataRaw);
    params.set(data);
    return true;
  }
  return false;
}

function debounceSave(func: (params: Params, key: string) => void, wait = 100) {
  let timeout: NodeJS.Timeout;
  return function (this: any, params: Params, key: string) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, [params, key]);
    }, wait);
  };
}

const saveToLocalstorageDebounced = debounceSave(function (
  params: Params,
  key: string
) {
  localStorage.setItem(key, JSON.stringify(params.values()));
});
