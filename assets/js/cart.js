// cart.js — per-user cart + order history (Firestore). Logic only, no DOM.
import { auth, db } from "./firebase-init.js";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";

let cart = []; // [{ id, name, price, img, qty }]
let user = null;

export function setUser(u) {
  user = u;
  if (u) return loadCart();
  cart = [];
  return Promise.resolve();
}

export function getItems() {
  return cart;
}
export function getCount() {
  return cart.reduce((n, i) => n + i.qty, 0);
}
export function getTotal() {
  return cart.reduce((s, i) => s + i.qty * i.price, 0);
}

async function saveCart() {
  if (!user) return;
  await setDoc(
    doc(db, "users", user.uid, "cart"),
    { items: cart, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function loadCart() {
  if (!user) return;
  const snap = await getDoc(doc(db, "users", user.uid, "cart"));
  cart = snap.exists() ? snap.data().items || [] : [];
}

export async function addToCart(product) {
  if (!user) throw new Error("auth-required");
  const ex = cart.find((i) => i.id === product.id);
  if (ex) ex.qty += 1;
  else cart.push({ id: product.id, name: product.name, price: product.price, img: product.img, qty: 1 });
  await saveCart();
}

export async function changeQty(id, delta) {
  const it = cart.find((i) => i.id === id);
  if (!it) return;
  it.qty += delta;
  if (it.qty <= 0) cart = cart.filter((i) => i.id !== id);
  await saveCart();
}

export async function removeItem(id) {
  cart = cart.filter((i) => i.id !== id);
  await saveCart();
}

// Move the current cart into an order document, then clear the cart.
export async function checkout() {
  if (!user || cart.length === 0) return null;
  const ref = await addDoc(collection(db, "users", user.uid, "orders"), {
    items: cart,
    total: getTotal(),
    createdAt: serverTimestamp(),
  });
  cart = [];
  await saveCart();
  return ref.id;
}

export async function loadOrders() {
  if (!user) return [];
  const q = query(
    collection(db, "users", user.uid, "orders"),
    orderBy("createdAt", "desc"),
    limit(10)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
