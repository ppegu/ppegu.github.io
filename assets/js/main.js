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

  // Project avatars: map name/tags -> svg or text avatar
  const slugify = (s) =>
    (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const initials = (name) => {
    if (!name) return "";
    const parts = name.replace(/[–—-]/g, " ").split(/\s+/).filter(Boolean);
    const take = Math.min(3, parts.length);
    return parts
      .slice(0, take)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  };

  const pickIconType = (name, tagsText) => {
    const t = `${name} ${tagsText}`.toLowerCase();
    // Prefer specific domain icons
    if (/(gyaan|ai|rag|llm|langchain|chroma|openai|ollama)/.test(t))
      return { type: "brain", aria: `${name} AI project` };
    if (
      /(multi[-\s]?cloud|aws|azure|vmware|orchestration|deployment|automation)/.test(
        t
      )
    )
      return { type: "cloud", aria: `${name} cloud project` };
    if (/(crypto|exchange|wallet|blockchain|web3|token)/.test(t))
      return { type: "coin", aria: `${name} crypto project` };
    if (
      /(real[-\s]?time|messaging|socket|websocket|mqtt|chat|presence)/.test(t)
    )
      return { type: "chat", aria: `${name} messaging project` };
    // No perfect icon? Signal fallback to label header
    return { type: "label", aria: `${name}` };
  };

  const svgIcon = (type) => {
    const common = 'role="img" aria-hidden="false"';
    // icons use currentColor for theming
    switch (type) {
      case "brain":
        return `<svg ${common} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8.5 7.5a3 3 0 016 0M6 10a3 3 0 013-3h6a3 3 0 013 3v2a4 4 0 01-4 4h-1M9 16H8a4 4 0 01-4-4v-2a3 3 0 013-3"/><path d="M12 7v10M9 10h6"/></svg>`;
      case "cloud":
        return `<svg ${common} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 18h10a4 4 0 000-8 6 6 0 10-11 3"/></svg>`;
      case "coin":
        return `<svg ${common} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="7"/><path d="M9 9h6v6H9z"/></svg>`;
      case "chat":
        return `<svg ${common} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 15a6 6 0 016-6h11v6a6 6 0 01-6 6H9l-4 3v-3"/></svg>`;
      default:
        return "";
    }
  };

  const initProjectAvatars = () => {
    const cards = $$(".card.project");
    cards.forEach((card) => {
      const titleEl = card.querySelector("h3");
      const tagsEl = card.querySelector(".project__meta");
      const avatarEl = card.querySelector(".project-card__avatar");
      if (!titleEl || !avatarEl) return;
      const name = titleEl.textContent.trim();
      const tagsText = tagsEl ? tagsEl.textContent.trim() : "";
      const pick = pickIconType(name, tagsText);

      // Render: icon or label fallback
      if (pick.type === "label") {
        avatarEl.classList.add("project-card__avatar--label");
        avatarEl.setAttribute("role", "img");
        avatarEl.setAttribute("aria-label", `${name}`);
        avatarEl.textContent = name;
      } else if (pick.type === "text") {
        avatarEl.classList.add("project-card__avatar--text");
        avatarEl.setAttribute("role", "img");
        avatarEl.setAttribute("aria-label", `${name} initials`);
        avatarEl.textContent = initials(name);
      } else {
        avatarEl.classList.add("project-card__avatar--svg");
        avatarEl.setAttribute("role", "img");
        avatarEl.setAttribute("aria-label", pick.aria);
        avatarEl.innerHTML = svgIcon(pick.type);
      }
    });
  };

  // Skills icons via CDN (Devicon preferred, Simple Icons fallback)
  const skillIconSource = (name) => {
    const key = (name || "").toLowerCase().trim();
    // Map skill names to Devicon slugs and Simple Icons slugs
    const map = {
      // Web & Mobile
      "react.js": { dev: ["react", "original"], si: "react" },
      react: { dev: ["react", "original"], si: "react" },
      "react native": { dev: ["react", "original"], si: "react" },
      "next.js": { dev: ["nextjs", "original"], si: "nextdotjs" },
      "redux toolkit": { dev: ["redux", "original"], si: "redux" },
      typescript: { dev: ["typescript", "original"], si: "typescript" },
      javascript: { dev: ["javascript", "original"], si: "javascript" },

      // Languages
      "node.js": { dev: ["nodejs", "original"], si: "nodedotjs" },
      node: { dev: ["nodejs", "original"], si: "nodedotjs" },
      rust: { dev: ["rust", "original"], si: "rust" },
      python: { dev: ["python", "original"], si: "python" },
      java: { dev: ["java", "original"], si: "java" },
      kotlin: { dev: ["kotlin", "original"], si: "kotlin" },
      swift: { dev: ["swift", "original"], si: "swift" },
      golang: { dev: ["go", "original"], si: "go" },
      go: { dev: ["go", "original"], si: "go" },

      // Databases
      mongodb: { dev: ["mongodb", "original"], si: "mongodb" },
      postgres: { dev: ["postgresql", "original"], si: "postgresql" },
      postgresql: { dev: ["postgresql", "original"], si: "postgresql" },
      sqlite: { dev: ["sqlite", "original"], si: "sqlite" },

      // Backend & Frameworks
      "express.js": { dev: ["express", "original"], si: "express" },
      express: { dev: ["express", "original"], si: "express" },
      fastapi: { dev: ["fastapi", "original"], si: "fastapi" },
      rest: { dev: null, si: null },
      websocket: { dev: null, si: null },

      // Cloud & DevOps
      aws: { dev: ["amazonwebservices", "original"], si: "amazonaws" },
      azure: { dev: ["azure", "original"], si: "microsoftazure" },
      kubernetes: { dev: ["kubernetes", "original"], si: "kubernetes" },
      docker: { dev: ["docker", "original"], si: "docker" },
      "ci/cd": { dev: null, si: "githubactions" },
      "github actions": {
        dev: ["githubactions", "original"],
        si: "githubactions",
      },
      jenkins: { dev: ["jenkins", "original"], si: "jenkins" },

      // AI & Data
      "gpt‑3.5/4": { dev: null, si: "openai" },
      "gpt-3.5/4": { dev: null, si: "openai" },
      "gpt-3.5": { dev: null, si: "openai" },
      "gpt-4": { dev: null, si: "openai" },
      ollama: { dev: null, si: null },
      langchain: { dev: null, si: null },
      rag: { dev: null, si: null },
      "vector search": { dev: null, si: null },

      // Observability & QA
      grafana: { dev: ["grafana", "original"], si: "grafana" },
      kibana: { dev: ["kibana", "original"], si: "kibana" },
      selenium: { dev: ["selenium", "original"], si: "selenium" },
      bash: { dev: ["bash", "original"], si: "gnubash" },

      // Other
      "web3.js": { dev: ["web3js", "plain"], si: null },
      blockchain: { dev: null, si: null },
      microservices: { dev: null, si: null },
      automation: { dev: null, si: null },
    };

    const entry = map[key];
    const buildDev = (slug, variant = "original") =>
      `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-${variant}.svg`;
    const buildSI = (slug) => `https://cdn.simpleicons.org/${slug}`; // currentColor

    if (entry) {
      const src = entry.dev
        ? buildDev(entry.dev[0], entry.dev[1])
        : entry.si
        ? buildSI(entry.si)
        : null;
      const fallback = entry.dev && entry.si ? buildSI(entry.si) : null;
      return { src, fallback };
    }
    return { src: null, fallback: null };
  };

  const enhanceSkills = () => {
    const spans = $$(".skills .tags span");
    spans.forEach((el) => {
      const label = (el.textContent || "").trim();
      if (!label) return;

      // Icon image element
      const { src, fallback } = skillIconSource(label);
      const icon = document.createElement("img");
      icon.className = "skill__icon";
      icon.setAttribute("loading", "lazy");
      icon.setAttribute("decoding", "async");
      icon.setAttribute("alt", "");
      icon.setAttribute("aria-hidden", "true"); // decorative; label provides text
      if (src) icon.src = src;

      if (fallback) {
        icon.onerror = () => {
          // prevent infinite loop
          icon.onerror = null;
          icon.src = fallback;
        };
      }

      // Wrap label and icon into a .skill container
      const wrapper = document.createElement("span");
      wrapper.className = "skill";
      const text = document.createElement("span");
      text.className = "skill__label";
      text.textContent = label;

      // Clear and insert
      el.textContent = "";
      wrapper.appendChild(icon);
      wrapper.appendChild(text);
      el.appendChild(wrapper);
    });
  };

  // Wait for DOM content
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProjectAvatars);
    document.addEventListener("DOMContentLoaded", enhanceSkills);
  } else {
    initProjectAvatars();
    enhanceSkills();
  }
})();
