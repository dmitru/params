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

export function saveToLocalstorage(params: Params, key = "data") {
  localStorage.setItem(key, JSON.stringify(params.values()));
}
