// Seed image store + global state.
// In-memory only (resets on reload), per user spec.

const u = (id, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

// Display modes:
//   "portrait"  - 1 col, taller (3:4)
//   "square"    - 2 cols, 1:1 (only on >=1100px desktop, falls back gracefully)
//   "landscape" - spans all 3 cols, 3:2
const SEED = {
  street: [
    { id: "s1",  src: u("1502672023488-70e25813eb80"),       caption: "Lisbon, late afternoon",       mode: "portrait" },
    { id: "s2",  src: u("1499856871958-5b9627545d1a"),       caption: "Marais, after rain",            mode: "portrait" },
    { id: "s3",  src: u("1473093226795-af9932fe5856"),       caption: "Tram, Hong Kong",               mode: "portrait" },
    { id: "s4",  src: u("1519501025264-65ba15a82390", 2400), caption: "Crossing — 6th & Mission",      mode: "landscape" },
    { id: "s5",  src: u("1485965120184-e220f721d03e"),       caption: "Ginza, midnight",               mode: "portrait" },
    { id: "s6",  src: u("1502209524164-acea936639a2"),       caption: "Awning, Naples",                mode: "portrait" },
    { id: "s7",  src: u("1514924013411-cbf25faa35bb"),       caption: "Crowd, Shibuya",                mode: "portrait" },
    { id: "s8",  src: u("1431274172761-fca41d930114"),       caption: "Doorway, Marrakech",            mode: "portrait" },
    { id: "s9",  src: u("1496564203457-11bb12075d90"),       caption: "Avenue, Paris",                 mode: "portrait" },
  ],
  earth: [
    { id: "e1",  src: u("1469474968028-56623f02e42e", 2400), caption: "Foothills, dawn",               mode: "landscape" },
    { id: "e2",  src: u("1418065460487-3e41a6c84dc5"),       caption: "Pine, Sierra Nevada",           mode: "portrait" },
    { id: "e3",  src: u("1447752875215-b2761acb3c5d"),       caption: "Forest, Olympic National Park", mode: "portrait" },
    { id: "e4",  src: u("1426604966848-d7adac402bff"),       caption: "Ridge, Patagonia",              mode: "portrait" },
    { id: "e5",  src: u("1501785888041-af3ef285b470", 2400), caption: "Lake Wanaka",                   mode: "landscape" },
    { id: "e6",  src: u("1472214103451-9374bd1c798e"),       caption: "Cliff, Iceland",                mode: "portrait" },
    { id: "e7",  src: u("1454496522488-7a8e488e8606"),       caption: "Glacier, edge of the cirque",   mode: "portrait" },
    { id: "e8",  src: u("1441974231531-c6227db76b6e"),       caption: "Conifers, first light",         mode: "portrait" },
    { id: "e9",  src: u("1505228395891-9a51e7e86bf6"),       caption: "Dune, evening",                 mode: "portrait" },
  ],
  diary: [
    { id: "d1",  src: u("1490481651871-ab68de25d43d"),       caption: "Window, no. 14",                mode: "portrait" },
    { id: "d2",  src: u("1455390582262-044cdead277a"),       caption: "Coffee, somewhere quiet",       mode: "portrait" },
    { id: "d3",  src: u("1517593456013-3e3f1f3d3679", 2400), caption: "The long hallway",              mode: "landscape" },
    { id: "d4",  src: u("1517438476312-10d79c077509"),       caption: "Linen on a Tuesday",            mode: "portrait" },
    { id: "d5",  src: u("1493612276216-ee3925520721"),       caption: "Studio floor",                  mode: "portrait" },
    { id: "d6",  src: u("1513151233558-d860c5398176"),       caption: "Notebook",                      mode: "portrait" },
    { id: "d7",  src: u("1507608616759-54f48f0af0ee"),       caption: "Afternoon, May",                mode: "portrait" },
    { id: "d8",  src: u("1485178575877-1a13bf489dfe"),       caption: "Stair, west light",             mode: "portrait" },
  ],
};

const HOMEPAGE_HERO = u("1490578474895-699cd4e2cf59", 2000); // single static hero, soft b&w landscape

const GALLERIES = [
  { key: "street", label: "Street", blurb: "Cities, walking, found light." },
  { key: "earth",  label: "Earth",  blurb: "Land, weather, far places." },
  { key: "diary",  label: "Diary",  blurb: "Notes from days I want to remember." },
];

// --- Reactive store (tiny pub/sub) -----------------------------------------
const Store = (() => {
  let state = {
    images: JSON.parse(JSON.stringify(SEED)),
    auth: localStorage.getItem("ak_auth") === "1",
  };
  const subs = new Set();
  return {
    get: () => state,
    sub: (fn) => { subs.add(fn); return () => subs.delete(fn); },
    set: (patch) => {
      state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
      subs.forEach(fn => fn(state));
    },
    // image actions
    addImage: (gallery, img) => Store.set(s => ({
      images: { ...s.images, [gallery]: [img, ...s.images[gallery]] }
    })),
    deleteImage: (gallery, id) => Store.set(s => ({
      images: { ...s.images, [gallery]: s.images[gallery].filter(i => i.id !== id) }
    })),
    updateImage: (gallery, id, patch) => Store.set(s => ({
      images: { ...s.images, [gallery]: s.images[gallery].map(i => i.id === id ? { ...i, ...patch } : i) }
    })),
    reorder: (gallery, fromId, toId) => Store.set(s => {
      const list = [...s.images[gallery]];
      const fromIdx = list.findIndex(i => i.id === fromId);
      const toIdx   = list.findIndex(i => i.id === toId);
      if (fromIdx < 0 || toIdx < 0) return {};
      const [moved] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, moved);
      return { images: { ...s.images, [gallery]: list } };
    }),
    login: () => { localStorage.setItem("ak_auth", "1"); Store.set({ auth: true }); },
    logout: () => { localStorage.removeItem("ak_auth"); Store.set({ auth: false }); },
  };
})();

// Hook
function useStore(selector = (s) => s) {
  const [, force] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => Store.sub(() => force()), []);
  return selector(Store.get());
}

// Hash router
function useHashRoute() {
  const [hash, setHash] = React.useState(() => window.location.hash || "#/");
  React.useEffect(() => {
    const onChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  // Parse: "#/photo/street/s2" -> {path:["photo","street","s2"]}
  const path = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  return { hash, path, navigate: (h) => { window.location.hash = h; } };
}

Object.assign(window, { Store, useStore, useHashRoute, GALLERIES, HOMEPAGE_HERO });
