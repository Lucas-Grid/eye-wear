// app.js — UI layer: auth modal, cart drawer, account panel. Depends on auth.js + cart.js.
import { watchUser, signUp, signIn, signOut } from "./auth.js";
import * as cart from "./cart.js";
import { currentUser } from "./auth.js";

/* ---------- element refs ---------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const modal = $("#auth-modal");
const drawer = $("#cart-drawer");
const accountPanel = $("#account-panel");
const pendingAdd = { product: null };

/* ---------- toast ---------- */
function toast(msg) {
  let t = $("#toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ---------- auth modal ---------- */
function openAuth(after) {
  pendingAdd.after = after;
  modal.classList.add("open");
  $("#auth-msg").textContent = "";
  $("#auth-email").focus();
}
function closeAuth() {
  modal.classList.remove("open");
}

$$(".toggle-mode").forEach((b) =>
  b.addEventListener("click", () => {
    const isUp = modal.dataset.mode === "signup";
    modal.dataset.mode = isUp ? "login" : "signup";
    $("#auth-title").textContent = isUp ? "Welcome back" : "Create your account";
    $("#auth-submit").textContent = isUp ? "Sign in" : "Sign up";
    $("#auth-switch").innerHTML = isUp
      ? 'New to LUMIÈRE? <span class="toggle-mode">Create an account</span>'
      : 'Already have an account? <span class="toggle-mode">Sign in</span>';
    bindToggle();
  })
);
function bindToggle() {
  $$(".toggle-mode").forEach((b) =>
    b.addEventListener("click", () => {
      const isUp = modal.dataset.mode === "signup";
      modal.dataset.mode = isUp ? "login" : "signup";
      $("#auth-title").textContent = isUp ? "Welcome back" : "Create your account";
      $("#auth-submit").textContent = isUp ? "Sign in" : "Sign up";
      $("#auth-switch").innerHTML = isUp
        ? 'New to LUMIÈRE? <span class="toggle-mode">Create an account</span>'
        : 'Already have an account? <span class="toggle-mode">Sign in</span>';
      bindToggle();
    })
  );
}

$("#auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("#auth-email").value.trim();
  const pass = $("#auth-password").value;
  $("#auth-msg").textContent = "";
  $("#auth-submit").disabled = true;
  try {
    if (modal.dataset.mode === "signup") await signUp(email, pass);
    else await signIn(email, pass);
    closeAuth();
    if (pendingAdd.after) {
      const fn = pendingAdd.after;
      pendingAdd.after = null;
      fn();
    }
  } catch (err) {
    $("#auth-msg").textContent = friendlyError(err);
  } finally {
    $("#auth-submit").disabled = false;
  }
});

function friendlyError(err) {
  const c = err && err.code;
  if (c === "auth/email-already-in-use") return "That email is already registered. Try signing in.";
  if (c === "auth/invalid-email") return "Please enter a valid email address.";
  if (c === "auth/weak-password") return "Password should be at least 6 characters.";
  if (c === "auth/wrong-password" || c === "auth/invalid-credential")
    return "Incorrect email or password.";
  if (c === "auth/user-not-found") return "No account found with that email.";
  return err && err.message ? err.message : "Something went wrong. Please try again.";
}

/* ---------- cart drawer ---------- */
function openCart() {
  renderCart();
  drawer.classList.add("open");
}
function closeCart() {
  drawer.classList.remove("open");
}

function addProduct(product) {
  if (!currentUser()) {
    openAuth(() => addProduct(product));
    return;
  }
  cart.addToCart(product).then(() => {
    renderCart();
    openCart();
    toast(product.name + " added to your bag");
  });
}

function renderCart() {
  const items = cart.getItems();
  const list = $("#cart-items");
  const count = $("#cart-count");
  const totalEl = $("#cart-total");
  count.textContent = cart.getCount();
  count.style.display = cart.getCount() ? "inline-flex" : "none";
  if (!items.length) {
    list.innerHTML = '<p class="cart-empty">Your bag is empty. Sign in to start saving frames.</p>';
    totalEl.textContent = "$0";
    return;
  }
  list.innerHTML = items
    .map(
      (i) => `
    <div class="cart-item" data-id="${i.id}">
      <img src="${i.img}" alt="${i.name}" loading="lazy" />
      <div class="ci-body">
        <h4>${i.name}</h4>
        <div class="ci-price">$${i.price}</div>
        <div class="qty">
          <button data-act="dec">−</button>
          <span>${i.qty}</span>
          <button data-act="inc">+</button>
        </div>
      </div>
      <button class="ci-remove" data-act="rm" aria-label="Remove">×</button>
    </div>`
    )
    .join("");
  totalEl.textContent = "$" + cart.getTotal();
}

$("#cart-items").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-act]");
  const row = e.target.closest(".cart-item");
  if (!btn || !row) return;
  const id = row.dataset.id;
  const act = btn.dataset.act;
  if (act === "inc") cart.changeQty(id, 1).then(renderCart);
  else if (act === "dec") cart.changeQty(id, -1).then(renderCart);
  else if (act === "rm") cart.removeItem(id).then(renderCart);
});

$("#checkout-btn").addEventListener("click", async () => {
  if (!cart.getItems().length) return;
  try {
    const id = await cart.checkout();
    toast(id ? "Order placed — saved to your account" : "Cart is empty");
    renderCart();
    renderAccount();
  } catch (err) {
    toast("Checkout failed: " + friendlyError(err));
  }
});

/* ---------- account panel (orders + sign out) ---------- */
async function renderAccount() {
  const u = currentUser();
  const body = document.getElementById("account-body");
  if (!body) return;
  if (!u) {
    body.innerHTML = `<p class="acct-hint">Sign in to view your saved bag and order history.</p>`;
    return;
  }
  const orders = await cart.loadOrders();
  const orderHtml = orders.length
    ? orders
        .map((o) => {
          const date = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toLocaleDateString() : "";
          const lines = (o.items || [])
            .map((i) => `${i.name} ×${i.qty}`)
            .join(", ");
          return `<li><span>${date}</span><strong>$${o.total}</strong><small>${lines}</small></li>`;
        })
        .join("")
    : "<li class='no-orders'>No orders yet.</li>";
  body.innerHTML = `
    <p class="acct-email">${u.email}</p>
    <h3>Order history</h3>
    <ul class="order-list">${orderHtml}</ul>
    <button id="signout-btn" class="btn ghost">Sign out</button>`;
  document.getElementById("signout-btn").addEventListener("click", () =>
    signOut().then(() => closeAccount())
  );
}
function openAccount() {
  renderAccount();
  accountPanel.classList.add("open");
}
function closeAccount() {
  accountPanel.classList.remove("open");
}

/* ---------- bind global controls ---------- */
document.addEventListener("click", (e) => {
  const t = e.target;
  if (t.matches(".account-btn")) {
    currentUser() ? openAccount() : openAuth(null);
  }
  if (t.matches(".cart-btn")) openCart();
  if (t.closest("[data-add]")) {
    const el = t.closest("[data-add]");
    addProduct({
      id: el.dataset.add,
      name: el.dataset.name,
      price: Number(el.dataset.price),
      img: el.dataset.img,
    });
  }
  if (t.matches(".modal-close") || t === modal) closeAuth();
  if (t.matches(".drawer-close") || t === drawer) closeCart();
  if (t.matches(".panel-close") || t === accountPanel) closeAccount();
  if (t.matches(".modal-backdrop") || t.matches(".drawer-backdrop") || t.matches(".panel-backdrop")) {
    closeAuth();
    closeCart();
    closeAccount();
  }
});

/* ---------- header account state ---------- */
function renderHeader(user) {
  const btn = $(".account-btn");
  if (!btn) return;
  btn.textContent = user ? "My Account" : "Sign in";
}

/* ---------- auth state wiring ---------- */
watchUser((user) => {
  renderHeader(user);
  cart.setUser(user).then(() => {
    renderCart();
    renderAccount();
  });
});

// expose for inline use if needed
window.LUMIERE = { addProduct, openAuth };
