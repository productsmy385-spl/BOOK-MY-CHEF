import { useSyncExternalStore } from 'react';

/**
 * The event the customer is currently shopping for ("Planning: Wedding reception").
 * Kept in sessionStorage for this tab only; the booking form pre-selects it.
 */
const KEY = 'bmc.planningEvent';
const listeners = new Set();

function read() {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function setPlanningEvent(event) {
  try {
    if (event) sessionStorage.setItem(KEY, JSON.stringify({ id: event.id, title: event.title }));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: the booking form still offers the event picker */
  }
  emit();
}

export function usePlanningEvent() {
  const raw = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, read, () => null);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
