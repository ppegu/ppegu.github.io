/* Main interactions and micro-animations */
(function () {
  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

  // Mobile nav toggle
  const toggle = $(".nav__toggle");
  const menu = $("#nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    // close on link click
    $$("#nav-menu a").forEach((a) =>
      a.addEventListener("click", () => {
        if (menu.classList.contains("open")) {
          menu.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
        }
      })
    );
  }

  // Sticky reveal on scroll
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  $$(".reveal").forEach((el) => io.observe(el));

  // Year
  const y = new Date().getFullYear();
  const yEl = $("#year");
  if (yEl) yEl.textContent = String(y);

  // Metric counters
  const counters = $$(".metric__num");
  const animateCount = (el) => {
    const target = Number(el.getAttribute("data-target") || 0);
    const suffix = el.getAttribute("data-suffix") || "";
    const dur = 900;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const value = Math.floor(target * (0.2 + 0.8 * (p * p * (3 - 2 * p))));
      el.textContent = String(value) + (p >= 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io2 = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animateCount(e.target);
          io2.unobserve(e.target);
        }
      });
    },
    { threshold: 0.8 }
  );
  counters.forEach((el) => io2.observe(el));

  // Typing phrases in chip
  const typing = $(".typing__text");
  if (typing) {
    const phrases = JSON.parse(typing.getAttribute("data-phrases") || "[]");
    let i = 0,
      erase = false,
      text = "",
      hold = 0;
    const tick = () => {
      const target = phrases[i % phrases.length] || "";
      if (!erase) {
        text = target.slice(0, text.length + 1);
        if (text === target) {
          hold++;
          if (hold > 12) {
            erase = true;
            hold = 0;
          }
        }
      } else {
        text = text.slice(0, -1);
        if (text.length === 0) {
          erase = false;
          i++;
        }
      }
      typing.textContent = text || " ";
      setTimeout(tick, erase ? 55 : 85);
    };
    tick();
  }

  // Typewriter for summary line
  const summaryTW = $(".typewriter");
  if (summaryTW) {
    const full = summaryTW.getAttribute("data-text") || "";
    let idx = 0;
    const write = () => {
      summaryTW.textContent = full.slice(0, idx);
      idx++;
      if (idx <= full.length) setTimeout(write, 14);
    };
    const io3 = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            write();
            io3.unobserve(summaryTW);
          }
        });
      },
      { threshold: 0.4 }
    );
    io3.observe(summaryTW);
  }
})();
