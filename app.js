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

const visibleIds = [
  "longing","wonder","grief","desire","silence",
  "memory","defiance","beauty","faith","home",
  "regret","survival","creation","love","becoming"
];

const visibleConstellations = constellations.filter(c => visibleIds.includes(c.id));

const positions = [
  [17,24],[48,15],[77,24],[31,42],[65,39],
  [13,62],[47,58],[82,55],[25,79],[59,77],
  [88,79],[72,67],[41,90],[8,87],[91,41]
];

function openSky() {
  if (skyOpened) return;
  skyOpened = true;
  moonTrigger.classList.add("is-dissolving");

  setTimeout(() => {
    gateway.classList.add("is-leaving");
    sky.hidden = false;
    renderSky();
    requestAnimationFrame(() => sky.classList.add("is-visible"));
  }, 620);
}

function returnToMoon() {
  closeCluster();
  sky.classList.remove("is-visible");

  setTimeout(() => {
    sky.hidden = true;
    gateway.classList.remove("is-leaving");
    moonTrigger.classList.remove("is-dissolving");
    skyOpened = false;
  }, 700);
}

function renderSky() {
  field.innerHTML = "";

  visibleConstellations.forEach((c, i) => {
    const [x, y] = positions[i];
    const button = document.createElement("button");

    button.className = "constellation";
    button.textContent = c.title;
    button.dataset.id = c.id;
    button.style.left = `${x}%`;
    button.style.top = `${y}%`;
    button.style.setProperty("--size", `${1.04 + ((i * 7) % 9) * .18}rem`);
    button.style.setProperty("--dx", `${4 + ((i * 5) % 10)}px`);
    button.style.setProperty("--dy", `${3 + ((i * 7) % 8)}px`);
    button.style.setProperty("--duration", `${20 + ((i * 11) % 24)}s`);
    button.style.setProperty("--opacity", `${.38 + ((i * 13) % 30) / 100}`);

    button.addEventListener("mouseenter", () => activateConstellation(c.id, button));
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

  const offsets = [
    [-150,-90],[155,-72],[-190,22],[180,28],
    [-110,105],[115,116],[0,150]
  ];

  matches.forEach((poem, i) => {
    const link = document.createElement("button");
    link.className = "poem-link";
    link.textContent = poem.title;
    link.style.left = `${offsets[i][0]}px`;
    link.style.top = `${offsets[i][1]}px`;
    link.style.setProperty("--delay", `${i * 90}ms`);

    link.addEventListener("click", (event) => {
      event.stopPropagation();
      openPoem(poem.slug, id);
    });

    cluster.appendChild(link);
  });

  field.appendChild(cluster);
}

function closeCluster() {
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

function openPoem(slug, constellationId = "") {
  activePoemIndex = poems.findIndex(p => p.slug === slug);
  if (activePoemIndex < 0) return;

  const poem = poems[activePoemIndex];
  readerTitle.textContent = poem.title;
  readerConstellation.textContent = constellationId || poem.constellations[0] || "";
  readerPoem.innerHTML = renderPoemText(poem.poem);

  reader.hidden = false;
  requestAnimationFrame(() => reader.classList.add("is-visible"));
  reader.scrollTop = 0;

  const url = new URL(window.location.href);
  url.searchParams.set("poem", poem.slug);
  history.pushState({ poem: poem.slug }, "", url);
}

function closePoem({ updateHistory = true } = {}) {
  reader.classList.remove("is-visible");
  setTimeout(() => { reader.hidden = true; }, 550);

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

  readerTitle.textContent = poem.title;
  readerConstellation.textContent = poem.constellations[0] || "";
  readerPoem.innerHTML = renderPoemText(poem.poem);
  reader.scrollTo({ top: 0, behavior: "smooth" });

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
