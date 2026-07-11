/* LUMIÈRE — shared site interactions */
(function () {
  "use strict";

  // --- Header scroll state ---
  const header = document.querySelector("header.site");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 40);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // --- Mobile nav toggle ---
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector("nav.menu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => menu.classList.toggle("open"));
    menu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => menu.classList.remove("open"))
    );
  }

  // --- Scroll reveal ---
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            setTimeout(() => e.target.classList.add("in"), (i % 4) * 90);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  // --- Animated stat counters ---
  const stats = document.querySelectorAll(".stat .big[data-count]");
  if (stats.length) {
    const animate = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const decimals = (el.dataset.count.split(".")[1] || "").length;
      const dur = 1400;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const statIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animate(e.target);
            statIO.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    stats.forEach((s) => statIO.observe(s));
  }

  // --- Contact form (demo: prevent submit, show confirmation) ---
  const form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = document.querySelector(".form-ok");
      if (ok) ok.style.display = "block";
      form.reset();
      setTimeout(() => {
        if (ok) ok.style.display = "none";
      }, 5000);
    });
  }

  // --- Year in footer ---
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
