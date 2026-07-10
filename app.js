import { poems } from "./data/poems.js";
import { constellations } from "./data/constellations.js";

const gateway = document.querySelector("#gateway");
const moonTrigger = document.querySelector("#moon-trigger");
const sky = document.querySelector("#sky");
const field = document.querySelector("#constellation-field");
const returnMoon = document.querySelector("#return-to-moon");
const reader = document.querySelector("#reader");
const closeReader = document.querySelector("#close-reader");
const readerTitle = document.querySelector("#reader-title");
const readerConstellation = document.querySelector("#reader-constellation");
const readerPoem = document.querySelector("#reader-poem");
const prevPoem = document.querySelector("#prev-poem");
const nextPoem = document.querySelector("#next-poem");

let activeConstellation = null;
let activePoemIndex = -1;
let cluster = null;
let skyOpened = false;
let hoverTimer = null;

const visibleIds = [
  "longing","wonder","grief","desire","silence",
  "memory","defiance","beauty","faith","home",
  "regret","survival","creation","love","becoming"
];

const visibleConstellations = constellations.filter(c => visibleIds.includes(c.id));

const sizeMap = {
  longing: 3.7,
  wonder: 2.75,
  grief: 2.3,
  desire: 3.05,
  silence: 2.65,
  memory: 2.05,
  defiance: 2.45,
  beauty: 2.25,
  faith: 1.65,
  home: 1.7,
  regret: 1.9,
  survival: 1.85,
  creation: 1.95,
  love: 2.15,
  becoming: 2.2
};

function openSky() {
  if (skyOpened) return;
  skyOpened = true;
  moonTrigger.classList.add("is-dissolving");

  setTimeout(() => {
    gateway.classList.add("is-leaving");
    sky.hidden = false;
    renderSky();
    requestAnimationFrame(() => sky.classList.add("is-visible"));
  }, 650);
}

function returnToMoon() {
  closeCluster();
  sky.classList.remove("is-visible");

  setTimeout(() => {
    sky.hidden = true;
    gateway.classList.remove("is-leaving");
    moonTrigger.classList.remove("is-dissolving");
    skyOpened = false;
  }, 720);
}

function boxesOverlap(a, b, pad = 24) {
  return !(
    a.right + pad < b.left ||
    a.left > b.right + pad ||
    a.bottom + pad < b.top ||
    a.top > b.bottom + pad
  );
}

function createLayout(items) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const placed = [];
  const safe = { left: 70, right: width - 70, top: 90, bottom: height - 70 };

  items.forEach((c, i) => {
    let candidate = null;
    let attempts = 0;

    while (attempts < 300) {
      const x = safe.left + Math.random() * (safe.right - safe.left);
      const y = safe.top + Math.random() * (safe.bottom - safe.top);
      const fontPx = (sizeMap[c.id] || 2) * 16;
      const w = Math.max(90, c.title.length * fontPx * .56);
      const h = fontPx * 1.25;
      const box = {
        left: x - w/2,
        right: x + w/2,
        top: y - h/2,
        bottom: y + h/2
      };

      if (!placed.some(p => boxesOverlap(box, p.box, 30))) {
        candidate = { x, y, box };
        break;
      }
      attempts++;
    }

    if (!candidate) {
      const cols = 5;
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = safe.left + (col + .5) * ((safe.right - safe.left) / cols);
      const y = safe.top + (row + .7) * ((safe.bottom - safe.top) / 3.5);
      const fontPx = (sizeMap[c.id] || 2) * 16;
      const w = Math.max(90, c.title.length * fontPx * .56);
      const h = fontPx * 1.25;
      candidate = {
        x, y,
        box: { left:x-w/2, right:x+w/2, top:y-h/2, bottom:y+h/2 }
      };
    }

    placed.push({ id:c.id, ...candidate });
  });

  return placed;
}

function renderSky() {
  field.innerHTML = "";
  const layout = createLayout(visibleConstellations);

  visibleConstellations.forEach((c, i) => {
    const position = layout.find(p => p.id === c.id);
    const button = document.createElement("button");

    button.className = "constellation";
    button.textContent = c.title;
    button.dataset.id = c.id;
    button.style.left = `${position.x}px`;
    button.style.top = `${position.y}px`;
    button.style.setProperty("--size", `${sizeMap[c.id] || 2}rem`);
    button.style.setProperty("--dx", `${4 + Math.random() * 8}px`);
    button.style.setProperty("--dy", `${3 + Math.random() * 7}px`);
    button.style.setProperty("--duration", `${24 + Math.random() * 28}s`);
    button.style.setProperty("--breath", `${6 + Math.random() * 5}s`);
    button.style.setProperty("--opacity", `${.36 + Math.random() * .28}`);

    button.addEventListener("mouseenter", () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => activateConstellation(c.id, button), 160);
    });

    button.addEventListener("mouseleave", () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        if (!cluster?.matches(":hover")) closeCluster();
      }, 220);
    });

    button.addEventListener("focus", () => activateConstellation(c.id, button));
    button.addEventListener("click", () => activateConstellation(c.id, button));

    field.appendChild(button);
  });
}

function activateConstellation(id, button) {
  if (activeConstellation === id) return;
  closeCluster();

  activeConstellation = id;
  field.classList.add("has-active");
  button.classList.add("is-active");

  const matches = poems.filter(p => p.constellations.includes(id)).slice(0, 7);
  if (!matches.length) return;

  cluster = document.createElement("div");
  cluster.className = "poem-cluster";
  cluster.style.left = button.style.left;
  cluster.style.top = button.style.top;

  const radius = Math.min(190, Math.max(120, window.innerWidth * .12));
  const start = -Math.PI * .85;
  const spread = Math.PI * 1.7;

  matches.forEach((poem, i) => {
    const angle = matches.length === 1
      ? 0
      : start + (spread * i / (matches.length - 1));

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * .72;

    const link = document.createElement("button");
    link.className = "poem-link";
    link.textContent = poem.title;
    link.style.left = `${x}px`;
    link.style.top = `${y}px`;
    link.style.setProperty("--delay", `${i * 110}ms`);

    link.addEventListener("mouseenter", () => clearTimeout(hoverTimer));
    link.addEventListener("mouseleave", () => {
      hoverTimer = setTimeout(closeCluster, 260);
    });

    link.addEventListener("click", (event) => {
      event.stopPropagation();
      openPoem(poem.slug, id, link);
    });

    cluster.appendChild(link);
  });

  field.appendChild(cluster);
}

function closeCluster() {
  clearTimeout(hoverTimer);
  field.classList.remove("has-active");
  field.querySelectorAll(".constellation").forEach(el => el.classList.remove("is-active"));
  if (cluster) cluster.remove();
  cluster = null;
  activeConstellation = null;
}

function renderPoemText(text) {
  return text.trim()
    .split(/\n\s*\n/)
    .map(stanza => `<p>${stanza.split("\n").join("<br>")}</p>`)
    .join("");
}

function openPoem(slug, constellationId = "", sourceEl = null) {
  activePoemIndex = poems.findIndex(p => p.slug === slug);
  if (activePoemIndex < 0) return;

  const poem = poems[activePoemIndex];
  readerTitle.textContent = poem.title;
  readerConstellation.textContent = constellationId || poem.constellations[0] || "";
  readerPoem.innerHTML = renderPoemText(poem.poem);

  if (sourceEl) {
    const ghost = sourceEl.cloneNode(true);
    const rect = sourceEl.getBoundingClientRect();
    ghost.style.position = "fixed";
    ghost.style.left = `${rect.left + rect.width/2}px`;
    ghost.style.top = `${rect.top + rect.height/2}px`;
    ghost.style.zIndex = 60;
    ghost.style.pointerEvents = "none";
    ghost.style.opacity = "1";
    ghost.style.transition = "all .75s cubic-bezier(.22,.61,.36,1)";
    document.body.appendChild(ghost);

    requestAnimationFrame(() => {
      ghost.style.left = "50%";
      ghost.style.top = "16%";
      ghost.style.transform = "translate(-50%,-50%) scale(1.5)";
      ghost.style.opacity = "0";
      field.style.opacity = "0";
    });

    setTimeout(() => {
      ghost.remove();
      field.style.opacity = "";
    }, 800);
  }

  setTimeout(() => {
    reader.hidden = false;
    requestAnimationFrame(() => reader.classList.add("is-visible"));
    reader.scrollTop = 0;
  }, sourceEl ? 260 : 0);

  const url = new URL(window.location.href);
  url.searchParams.set("poem", poem.slug);
  history.pushState({ poem: poem.slug }, "", url);
}

function closePoem({ updateHistory = true } = {}) {
  reader.classList.remove("is-visible");
  setTimeout(() => { reader.hidden = true; }, 650);

  if (updateHistory) {
    const url = new URL(window.location.href);
    url.searchParams.delete("poem");
    history.pushState({}, "", url);
  }
}

function movePoem(direction) {
  if (activePoemIndex < 0) return;

  activePoemIndex = (activePoemIndex + direction + poems.length) % poems.length;
  const poem = poems[activePoemIndex];

  reader.classList.remove("is-visible");

  setTimeout(() => {
    readerTitle.textContent = poem.title;
    readerConstellation.textContent = poem.constellations[0] || "";
    readerPoem.innerHTML = renderPoemText(poem.poem);
    reader.scrollTop = 0;
    reader.classList.add("is-visible");
  }, 380);

  const url = new URL(window.location.href);
  url.searchParams.set("poem", poem.slug);
  history.replaceState({ poem: poem.slug }, "", url);
}

moonTrigger.addEventListener("mouseenter", openSky, { once: true });
moonTrigger.addEventListener("click", openSky);
returnMoon.addEventListener("click", returnToMoon);
closeReader.addEventListener("click", () => closePoem());
prevPoem.addEventListener("click", () => movePoem(-1));
nextPoem.addEventListener("click", () => movePoem(1));

field.addEventListener("click", event => {
  if (event.target === field) closeCluster();
});

window.addEventListener("resize", () => {
  if (!sky.hidden && !reader.classList.contains("is-visible")) renderSky();
});

window.addEventListener("popstate", () => {
  const slug = new URL(window.location.href).searchParams.get("poem");

  if (slug) {
    openPoem(slug);
  } else if (!reader.hidden) {
    closePoem({ updateHistory: false });
  }
});

const directPoem = new URL(window.location.href).searchParams.get("poem");

if (directPoem) {
  gateway.hidden = true;
  sky.hidden = false;
  sky.classList.add("is-visible");
  renderSky();
  openPoem(directPoem);
}
