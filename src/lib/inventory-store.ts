import { useSyncExternalStore } from "react";

export type Unit = "kg" | "g" | "liters" | "ml" | "boxes" | "packets" | "pieces" | "bottles" | "bags" | "dozen";

export const UNITS: Unit[] = ["kg", "g", "liters", "ml", "boxes", "packets", "pieces", "bottles", "bags", "dozen"];

export interface Item {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  lowStockAlert: number;
  createdAt: number;
}

export type HistoryAction = "add" | "sale" | "create" | "edit" | "delete" | "restock";

export interface HistoryEntry {
  id: string;
  itemId: string;
  itemName: string;
  action: HistoryAction;
  quantityChange: number;
  resultingQuantity: number;
  user: string;
  timestamp: number;
  note?: string;
}

interface State {
  items: Item[];
  history: HistoryEntry[];
  currentUser: string;
}

const KEY = "suresh-inventory-v1";

const defaultState: State = {
  items: [
    { id: crypto.randomUUID(), name: "Basmati Rice", quantity: 120, unit: "kg", lowStockAlert: 50, createdAt: Date.now() },
    { id: crypto.randomUUID(), name: "Sugar", quantity: 30, unit: "kg", lowStockAlert: 40, createdAt: Date.now() },
    { id: crypto.randomUUID(), name: "Matchboxes", quantity: 12, unit: "boxes", lowStockAlert: 3, createdAt: Date.now() },
    { id: crypto.randomUUID(), name: "Sunflower Oil", quantity: 8, unit: "liters", lowStockAlert: 10, createdAt: Date.now() },
    { id: crypto.randomUUID(), name: "Biscuits", quantity: 45, unit: "packets", lowStockAlert: 15, createdAt: Date.now() },
  ],
  history: [],
  currentUser: "Suresh",
};

let state: State = defaultState;
let initialized = false;
const listeners = new Set<() => void>();

function load() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = JSON.parse(raw);
  } catch {}
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function setState(updater: (s: State) => State) {
  state = updater(state);
  emit();
}

export function useInventory(): State {
  load();
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => defaultState,
  );
}

function pushHistory(entry: Omit<HistoryEntry, "id" | "timestamp" | "user">) {
  const h: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    user: state.currentUser,
  };
  state = { ...state, history: [h, ...state.history].slice(0, 1000) };
}

export const actions = {
  setUser(user: string) {
    setState((s) => ({ ...s, currentUser: user }));
  },
  addItem(input: Omit<Item, "id" | "createdAt">) {
    const item: Item = { ...input, id: crypto.randomUUID(), createdAt: Date.now() };
    state = { ...state, items: [...state.items, item] };
    pushHistory({
      itemId: item.id,
      itemName: item.name,
      action: "create",
      quantityChange: item.quantity,
      resultingQuantity: item.quantity,
    });
    emit();
  },
  updateItem(id: string, patch: Partial<Omit<Item, "id" | "createdAt">>) {
    const before = state.items.find((i) => i.id === id);
    if (!before) return;
    const after = { ...before, ...patch };
    state = { ...state, items: state.items.map((i) => (i.id === id ? after : i)) };
    pushHistory({
      itemId: id,
      itemName: after.name,
      action: "edit",
      quantityChange: after.quantity - before.quantity,
      resultingQuantity: after.quantity,
    });
    emit();
  },
  deleteItem(id: string) {
    const item = state.items.find((i) => i.id === id);
    if (!item) return;
    state = { ...state, items: state.items.filter((i) => i.id !== id) };
    pushHistory({
      itemId: id,
      itemName: item.name,
      action: "delete",
      quantityChange: -item.quantity,
      resultingQuantity: 0,
    });
    emit();
  },
  restock(id: string, amount: number): { ok: boolean; message?: string } {
    if (amount <= 0) return { ok: false, message: "Enter a quantity greater than zero" };
    const item = state.items.find((i) => i.id === id);
    if (!item) return { ok: false, message: "Item not found" };
    const newQty = item.quantity + amount;
    state = {
      ...state,
      items: state.items.map((i) => (i.id === id ? { ...i, quantity: newQty } : i)),
    };
    pushHistory({
      itemId: id,
      itemName: item.name,
      action: "restock",
      quantityChange: amount,
      resultingQuantity: newQty,
    });
    emit();
    return { ok: true };
  },
  sell(id: string, amount: number): { ok: boolean; message?: string } {
    if (amount <= 0) return { ok: false, message: "Enter a quantity greater than zero" };
    const item = state.items.find((i) => i.id === id);
    if (!item) return { ok: false, message: "Item not found" };
    if (amount > item.quantity) {
      return {
        ok: false,
        message: `Only ${item.quantity} ${item.unit} available. Cannot sell ${amount}.`,
      };
    }
    const newQty = item.quantity - amount;
    state = {
      ...state,
      items: state.items.map((i) => (i.id === id ? { ...i, quantity: newQty } : i)),
    };
    pushHistory({
      itemId: id,
      itemName: item.name,
      action: "sale",
      quantityChange: -amount,
      resultingQuantity: newQty,
    });
    emit();
    return { ok: true };
  },
};

export function isLowStock(item: Item) {
  return item.quantity <= item.lowStockAlert;
}