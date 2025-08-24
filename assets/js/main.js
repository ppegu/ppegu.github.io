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
    if (/gyaan|ai|rag|llm|langchain|chroma/.test(t))
      return { type: "brain", aria: `${name} logo` };
    if (/multi[-\s]?cloud|aws|azure|vmware/.test(t))
      return { type: "cloud", aria: `${name} logo` };
    if (/crypto|exchange|wallet|rust/.test(t))
      return { type: "coin", aria: `${name} logo` };
    if (/real[-\s]?time|messaging|socket|websocket|mqtt|chat/.test(t))
      return { type: "chat", aria: `${name} logo` };
    return { type: "text", aria: `${name} initials` };
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

      // Render
      if (pick.type === "text") {
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

  // Skill icons: sprite + mapper + renderer
  const ensureSkillSprite = () => {
    if (document.getElementById("skill-sprite")) return;
    const svgNS = "http://www.w3.org/2000/svg";
    const sprite = document.createElementNS(svgNS, "svg");
    sprite.setAttribute("id", "skill-sprite");
    sprite.setAttribute("aria-hidden", "true");
    sprite.style.position = "absolute";
    sprite.style.width = "0";
    sprite.style.height = "0";
    sprite.style.overflow = "hidden";

    const sym = (id, vb, inner) => {
      const symbol = document.createElementNS(svgNS, "symbol");
      symbol.setAttribute("id", id);
      symbol.setAttribute("viewBox", vb);
      symbol.innerHTML = inner;
      return symbol;
    };
    const stroke =
      'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';

    // A set of simple, brand-agnostic glyphs themed by currentColor.
    const symbols = [
      sym(
        "icon-default",
        "0 0 24 24",
        `<circle cx="12" cy="12" r="9" fill="none" ${stroke}/><path d="M12 7v5l3 3" fill="none" ${stroke}/>`
      ),
      sym(
        "icon-node",
        "0 0 24 24",
        `<path d="M12 3l8 4.6v8.8L12 21 4 16.4V7.6L12 3Z" fill="none" ${stroke}/>`
      ),
      sym(
        "icon-react",
        "0 0 24 24",
        `<circle cx="12" cy="12" r="2" fill="currentColor"/><ellipse cx="12" cy="12" rx="9" ry="4.5" fill="none" ${stroke}/><ellipse cx="12" cy="12" rx="9" ry="4.5" transform="rotate(60 12 12)" fill="none" ${stroke}/><ellipse cx="12" cy="12" rx="9" ry="4.5" transform="rotate(120 12 12)" fill="none" ${stroke}/>`
      ),
      sym(
        "icon-react-native",
        "0 0 24 24",
        `<rect x="5" y="6" width="14" height="12" rx="2" fill="none" ${stroke}/><path d="M7 9h10M7 12h10M7 15h6" ${stroke} fill="none"/>`
      ),
      sym(
        "icon-nextjs",
        "0 0 24 24",
        `<path d="M5 12a7 7 0 1112.1 4.9L5 5.8" ${stroke} fill="none"/>`
      ),
      sym(
        "icon-typescript",
        "0 0 24 24",
        `<rect x="3" y="5" width="18" height="14" rx="2" fill="none" ${stroke}/><path d="M8 9h8M12 9v8" ${stroke} fill="none"/>`
      ),
      sym(
        "icon-javascript",
        "0 0 24 24",
        `<rect x="3" y="5" width="18" height="14" rx="2" fill="none" ${stroke}/><path d="M9 9v6m6-6v6" ${stroke} fill="none"/>`
      ),
      sym(
        "icon-rust",
        "0 0 24 24",
        `<polygon points="12,3 21,8 21,16 12,21 3,16 3,8" fill="none" ${stroke}/><path d="M8 12h8M8 9h8M8 15h6" ${stroke} fill="none"/>`
      ),
      sym(
        "icon-python",
        "0 0 24 24",
        `<path d="M8 7a3 3 0 013-3h2a3 3 0 013 3v3H9a2 2 0 00-2 2v2m7 6a3 3 0 003-3v-3H9v3a3 3 0 003 3h2" fill="none" ${stroke}/>`
      ),
      sym(
        "icon-java",
        "0 0 24 24",
        `<path d="M12 3s2 2 0 3 2 2 0 3" fill="none" ${stroke}/><path d="M5 19h14" ${stroke}/>`
      ),
      sym(
        "icon-kotlin",
        "0 0 24 24",
        `<path d="M4 4h16L12 12l8 8H4z" fill="none" ${stroke}/>`
      ),
      sym(
        "icon-swift",
        "0 0 24 24",
        `<path d="M5 7c5 6 9 6 14 0-4 7-10 9-14 6 3 2 8 3 14 2" fill="none" ${stroke}/>`
      ),
      sym(
        "icon-go",
        "0 0 24 24",
        `<path d="M3 10h8M3 14h12M3 18h6" ${stroke} fill="none"/>`
      ),
      sym(
        "icon-mongodb",
        "0 0 24 24",
        `<path d="M12 3s5 4 5 10-5 8-5 8-5-2-5-8 5-10 5-10z" fill="none" ${stroke}/>`
      ),
      sym(
        "icon-postgres",
        "0 0 24 24",
        `<path d="M7 10a5 5 0 0110 0v4a4 4 0 01-4 4h-2a4 4 0 01-4-4v-4z" fill="none" ${stroke}/>`
      ),
      sym(
        "icon-sqlite",
        "0 0 24 24",
        `<rect x="4" y="5" width="16" height="14" rx="2" fill="none" ${stroke}/><path d="M8 9h8M8 12h5M8 15h8" ${stroke} fill="none"/>`
      ),
      sym(
        "icon-express",
        "0 0 24 24",
        `<path d="M5 17l4-6 4 6 4-6 2 3" fill="none" ${stroke}/>`
      ),
      sym(
        "icon-redux",
        "0 0 24 24",
        `<circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M6 18c3 2 9 2 12-1M6 6c-2 3-2 9 1 12M18 6c3 3 3 9 0 12" fill="none" ${stroke}/>`
      ),
      sym(
        "icon-web3",
        "0 0 24 24",
        `<path d="M12 3l9 5-9 5-9-5 9-5zm0 10l9 5-9 5-9-5 9-5z" fill="none" ${stroke}/>`
      ),
      sym(
        "icon-blockchain",
        "0 0 24 24",
        `<rect x="3" y="3" width="8" height="8" fill="none" ${stroke}/><rect x="13" y="3" width="8" height="8" fill="none" ${stroke}/><rect x="3" y="13" width="8" height="8" fill="none" ${stroke}/><rect x="13" y="13" width="8" height="8" fill="none" ${stroke}/>`
      ),
      sym(
        "icon-aws",
        "0 0 24 24",
        `<path d="M4 16c5 4 11 4 16 0" fill="none" ${stroke}/><path d="M6 8h12" ${stroke}/>`
      ),
      sym(
        "icon-azure",
        "0 0 24 24",
        `<path d="M4 18l8-14 8 14H4z" fill="none" ${stroke}/>`
      ),
      sym(
        "icon-kubernetes",
        "0 0 24 24",
        `<circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2.8 2.8M14.7 14.7l2.8 2.8M17.5 6.5l-2.8 2.8M9.3 14.7l-2.8 2.8" fill="none" ${stroke}/>`
      ),
      sym(
        "icon-docker",
        "0 0 24 24",
        `<path d="M3 14h18a3 3 0 01-3 3H7a3 3 0 01-3-3z" fill="none" ${stroke}/><path d="M7 10h3v3H7zM11 10h3v3h-3zM15 10h3v3h-3z" ${stroke} fill="none"/>`
      ),
      sym(
        "icon-cicd",
        "0 0 24 24",
        `<path d="M4 12a8 8 0 1016 0" fill="none" ${stroke}/><path d="M12 2v10l4 4" ${stroke} fill="none"/>`
      ),
      sym(
        "icon-gha",
        "0 0 24 24",
        `<path d="M4 12a8 8 0 1016 0" fill="none" ${stroke}/><path d="M8 15l2-2 2 2 4-4" ${stroke} fill="none"/>`
      ),
      sym(
        "icon-jenkins",
        "0 0 24 24",
        `<circle cx="12" cy="8" r="3" fill="none" ${stroke}/><path d="M6 20c0-3.3 3-6 6-6s6 2.7 6 6" fill="none" ${stroke}/>`
      ),
      sym(
        "icon-grafana",
        "0 0 24 24",
        `<path d="M12 4a8 8 0 100 16 6 6 0 010-12z" fill="none" ${stroke}/>`
      ),
      sym(
        "icon-kibana",
        "0 0 24 24",
        `<path d="M5 19a7 7 0 1110-10L5 19z" fill="none" ${stroke}/>`
      ),
      sym(
        "icon-selenium",
        "0 0 24 24",
        `<rect x="3" y="5" width="18" height="14" rx="2" fill="none" ${stroke}/><path d="M7 12h10M7 9h6M7 15h8" ${stroke} fill="none"/>`
      ),
      sym(
        "icon-bash",
        "0 0 24 24",
        `<path d="M4 7l8-4 8 4v10l-8 4-8-4V7z" fill="none" ${stroke}/><path d="M9 12h6" ${stroke}/>`
      ),
      sym(
        "icon-microservices",
        "0 0 24 24",
        `<circle cx="5" cy="12" r="2" ${stroke} fill="none"/><circle cx="12" cy="12" r="2" ${stroke} fill="none"/><circle cx="19" cy="12" r="2" ${stroke} fill="none"/><path d="M7 12h3M14 12h3" ${stroke}/>`
      ),
      sym(
        "icon-langchain",
        "0 0 24 24",
        `<path d="M7 12a5 5 0 015-5h1a5 5 0 015 5 5 5 0 01-5 5h-1a5 5 0 01-5-5z" fill="none" ${stroke}/><path d="M9 12a3 3 0 003-3M12 15a3 3 0 003-3" ${stroke} fill="none"/>`
      ),
      sym(
        "icon-rag",
        "0 0 24 24",
        `<rect x="4" y="6" width="16" height="12" rx="2" fill="none" ${stroke}/><path d="M8 10h8M8 14h5" ${stroke} fill="none"/>`
      ),
      sym(
        "icon-ollama",
        "0 0 24 24",
        `<path d="M12 3a7 7 0 00-7 7v4l7 7 7-7v-4a7 7 0 00-7-7z" fill="none" ${stroke}/>`
      ),
      sym(
        "icon-openai",
        "0 0 24 24",
        `<path d="M12 6a6 6 0 016 6 6 6 0 01-6 6 6 6 0 01-6-6 6 6 0 016-6z" fill="none" ${stroke}/><path d="M12 6v12M6 12h12" ${stroke} fill="none"/>`
      ),
    ];

    symbols.forEach((s) => sprite.appendChild(s));
    document.body.appendChild(sprite);
  };

  const skillIcon = (name) => {
    const key = (name || "").toLowerCase().trim();
    const map = {
      "node.js": "node",
      node: "node",
      react: "react",
      "react native": "react-native",
      "next.js": "nextjs",
      typescript: "typescript",
      javascript: "javascript",
      rust: "rust",
      python: "python",
      java: "java",
      kotlin: "kotlin",
      swift: "swift",
      golang: "go",
      go: "go",
      mongodb: "mongodb",
      postgres: "postgres",
      sqlite: "sqlite",
      express: "express",
      redux: "redux",
      "redux toolkit": "redux",
      "web3.js": "web3",
      blockchain: "blockchain",
      aws: "aws",
      azure: "azure",
      kubernetes: "kubernetes",
      docker: "docker",
      "ci/cd": "cicd",
      "github actions": "gha",
      jenkins: "jenkins",
      grafana: "grafana",
      kibana: "kibana",
      selenium: "selenium",
      bash: "bash",
      microservices: "microservices",
      langchain: "langchain",
      rag: "rag",
      ollama: "ollama",
      "gpt-3.5": "openai",
      "gpt-4": "openai",
    };
    return map[key] || "default";
  };

  const enhanceSkills = () => {
    ensureSkillSprite();
    const spans = $$(".skills .tags span");
    spans.forEach((el) => {
      const label = (el.textContent || "").trim();
      if (!label) return;

      // Build icon element using sprite
      const id = skillIcon(label);
      const icon = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      icon.setAttribute("class", "skill__icon");
      icon.setAttribute("aria-hidden", "true"); // decorative; label is visible
      const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      // Prefer SVG2 href; fall back to xlink:href for older UAs
      use.setAttribute("href", `#icon-${id}`);
      use.setAttributeNS("http://www.w3.org/1999/xlink", "href", `#icon-${id}`);
      icon.appendChild(use);

      // Wrap label and icon into a .skill container
      const wrapper = document.createElement("span");
      wrapper.className = "skill";
      const text = document.createElement("span");
      text.className = "skill__label";
      text.textContent = label;
      // Clear existing content and append composed node
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
