import { Params } from "../params";

export function restoreFromLocalstorage(params: Params, key = "data") {
  const dataRaw = localStorage.getItem(key);
  if (dataRaw) {
    const data = JSON.parse(dataRaw);
    params.set(data);
    return true;
  }
  return false;
}

function debounceSave(
  func: (params: Params, key?: string) => void,
  wait = 100
) {
  let timeout: NodeJS.Timeout;
  return function (this: any, params: Params, key?: string) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, [params, key]);
    }, wait);
  };
}

export const saveToLocalstorage = debounceSave(function (
  params: Params,
  key = "data"
) {
  localStorage.setItem(key, JSON.stringify(params.values()));
});
