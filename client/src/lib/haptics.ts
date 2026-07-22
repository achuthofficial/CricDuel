const STORAGE_KEY = 'cricduel:haptics';

export function hapticsEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== 'off';
}

export function setHapticsEnabled(enabled: boolean) {
  localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
}

function vibrate(pattern: number | number[]) {
  if (!hapticsEnabled()) return;
  if (typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
}

export const haptics = {
  wheelStop: () => vibrate(20),
  pickConfirm: () => vibrate(10),
  wicket: () => vibrate(30),
  win: () => vibrate(60),
};
