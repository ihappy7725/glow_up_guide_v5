// =========================
// Storage keys and app state
// =========================
const STORAGE_KEYS = {
  wardrobe: "glowGuideWardrobeV1",
  looks: "glowGuideLooksV1",
  profile: "glowGuideProfileV1",
};

const state = {
  wardrobe: [],
  outfit: [],
  looks: [],
  profile: {},
  selectedLayerId: null,
  activeCategory: "all",
  manualProductUrl: "",
};

const categoryOrder = [
  "innerwear",
  "bottoms",
  "tops",
  "outerwear",
  "shoes",
  "bags",
  "hats",
  "accessories",
];

const categoryZ = {
  innerwear: 15,
  bottoms: 20,
  tops: 30,
  outerwear: 40,
  shoes: 25,
  bags: 50,
  hats: 65,
  accessories: 70,
};

const categoryDefaults = {
  innerwear: { x: 50, y: 148, width: 145 },
  tops: { x: 47, y: 136, width: 165 },
  outerwear: { x: 33, y: 126, width: 195 },
  bottoms: { x: 52, y: 262, width: 155 },
  shoes: { x: 55, y: 468, width: 150 },
  bags: { x: 205, y: 220, width: 112 },
  hats: { x: 82, y: 33, width: 104 },
  accessories: { x: 90, y: 92, width: 90 },
};

// =========================
// SVG sample garment generator
// =========================
function svgData(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function garmentSvg(type, color, accent = "#202020") {
  const commonStart = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220">`;
  const commonEnd = `</svg>`;

  const shapes = {
    tops: `
      <path d="M64 48 L91 32 H129 L156 48 194 73 170 108 151 94 147 184 H73 L69 94 50 108 26 73 Z"
        fill="${color}" stroke="${accent}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M92 34 Q110 62 128 34" fill="none" stroke="${accent}" stroke-width="4"/>`,
    outerwear: `
      <path d="M62 46 89 31h42l27 15 35 31-25 33-15-14-6 90H73l-6-90-15 14-25-33z"
        fill="${color}" stroke="${accent}" stroke-width="4"/>
      <path d="M110 48V185 M91 32l19 32 20-32" fill="none" stroke="${accent}" stroke-width="4"/>
      <circle cx="119" cy="87" r="4" fill="${accent}"/><circle cx="119" cy="111" r="4" fill="${accent}"/>`,
    innerwear: `
      <path d="M78 45 Q110 65 142 45 L158 91 140 105 137 180 H83 L80 105 62 91 Z"
        fill="${color}" stroke="${accent}" stroke-width="4"/>
      <path d="M88 45 Q92 68 110 68 Q128 68 132 45" fill="none" stroke="${accent}" stroke-width="4"/>`,
    bottoms: `
      <path d="M75 35 H145 L151 95 135 191 107 191 110 105 105 105 103 191 75 191 68 95 Z"
        fill="${color}" stroke="${accent}" stroke-width="4"/>
      <path d="M76 60H144 M110 60V104" fill="none" stroke="${accent}" stroke-width="4"/>`,
    shoes: `
      <path d="M31 115 Q61 91 88 111 L112 136 98 160H25Q14 145 31 115Z"
        fill="${color}" stroke="${accent}" stroke-width="4"/>
      <path d="M132 111 Q160 91 189 116 203 145 192 160H118l-10-24Z"
        fill="${color}" stroke="${accent}" stroke-width="4"/>
      <path d="M28 145H99 M120 145h73" stroke="${accent}" stroke-width="4"/>`,
    bags: `
      <rect x="50" y="80" width="120" height="96" rx="18" fill="${color}" stroke="${accent}" stroke-width="4"/>
      <path d="M79 82Q80 34 110 34Q140 34 141 82" fill="none" stroke="${accent}" stroke-width="7"/>
      <circle cx="110" cy="124" r="8" fill="${accent}"/>`,
    hats: `
      <path d="M54 123Q56 55 110 55Q164 55 166 123Z" fill="${color}" stroke="${accent}" stroke-width="4"/>
      <path d="M34 124Q110 106 190 130Q164 155 56 151Q34 144 34 124Z" fill="${color}" stroke="${accent}" stroke-width="4"/>`,
    accessories: `
      <circle cx="78" cy="108" r="42" fill="none" stroke="${color}" stroke-width="12"/>
      <circle cx="142" cy="108" r="42" fill="none" stroke="${color}" stroke-width="12"/>
      <path d="M120 108h-20M37 98 17 86M183 98l20-12" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>`,
  };

  return svgData(`${commonStart}${shapes[type] || shapes.accessories}${commonEnd}`);
}

const SAMPLE_ITEMS = [
  { id: "sample-top-1", name: "Cloud Rib Tee", brand: "Demo Studio", category: "tops", platform: "sample", color: "#f6f2eb", accent: "#8b8178" },
  { id: "sample-top-2", name: "Cherry Baby Tee", brand: "Demo Studio", category: "tops", platform: "sample", color: "#c83748", accent: "#6b1420" },
  { id: "sample-bottom-1", name: "Washed Wide Denim", brand: "Demo Studio", category: "bottoms", platform: "sample", color: "#6f8ead", accent: "#32485f" },
  { id: "sample-bottom-2", name: "Charcoal Mini", brand: "Demo Studio", category: "bottoms", platform: "sample", color: "#3d4045", accent: "#111214" },
  { id: "sample-outer-1", name: "Butter Trench", brand: "Demo Studio", category: "outerwear", platform: "sample", color: "#d5bf92", accent: "#6f5b3d" },
  { id: "sample-outer-2", name: "Ink Blazer", brand: "Demo Studio", category: "outerwear", platform: "sample", color: "#24262b", accent: "#0c0d10" },
  { id: "sample-inner-1", name: "Soft Cami", brand: "Demo Studio", category: "innerwear", platform: "sample", color: "#e8cfd1", accent: "#8e676b" },
  { id: "sample-inner-2", name: "Clean Tank", brand: "Demo Studio", category: "innerwear", platform: "sample", color: "#f3f0e7", accent: "#89857b" },
  { id: "sample-shoe-1", name: "Silver Runner", brand: "Demo Studio", category: "shoes", platform: "sample", color: "#c8cdd3", accent: "#4e565e" },
  { id: "sample-shoe-2", name: "Black Mary Jane", brand: "Demo Studio", category: "shoes", platform: "sample", color: "#202124", accent: "#080808" },
  { id: "sample-bag-1", name: "Oxblood Shoulder Bag", brand: "Demo Studio", category: "bags", platform: "sample", color: "#702d32", accent: "#321417" },
  { id: "sample-bag-2", name: "Cream Mini Bag", brand: "Demo Studio", category: "bags", platform: "sample", color: "#e8dfcd", accent: "#827964" },
  { id: "sample-hat-1", name: "Navy Cap", brand: "Demo Studio", category: "hats", platform: "sample", color: "#263c5c", accent: "#111b2b" },
  { id: "sample-hat-2", name: "Olive Beanie", brand: "Demo Studio", category: "hats", platform: "sample", color: "#798263", accent: "#414735" },
  { id: "sample-accessory-1", name: "Soft Gold Frames", brand: "Demo Studio", category: "accessories", platform: "sample", color: "#b89a5e", accent: "#6d572d" },
  { id: "sample-accessory-2", name: "Cherry Frames", brand: "Demo Studio", category: "accessories", platform: "sample", color: "#b92642", accent: "#601323" },
].map(item => ({
  ...item,
  image: garmentSvg(item.category, item.color, item.accent),
  url: "",
}));

// =========================
// Storage
// =========================
function safeParse(value, fallback) {
  try {
    return JSON.parse(value) ?? fallback;
  } catch {
    return fallback;
  }
}

function loadState() {
  const wardrobeRaw = localStorage.getItem(STORAGE_KEYS.wardrobe);

  // Show demo items only on the very first visit. If the user intentionally
  // deletes every item, keep the closet empty after refresh.
  state.wardrobe = wardrobeRaw === null
    ? SAMPLE_ITEMS
    : safeParse(wardrobeRaw, []);

  state.looks = safeParse(localStorage.getItem(STORAGE_KEYS.looks), []);
  state.profile = safeParse(localStorage.getItem(STORAGE_KEYS.profile), {});

  saveWardrobe();
}

function saveWardrobe() {
  localStorage.setItem(STORAGE_KEYS.wardrobe, JSON.stringify(state.wardrobe));
}

function saveLooks() {
  localStorage.setItem(STORAGE_KEYS.looks, JSON.stringify(state.looks));
}

function saveProfile() {
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(state.profile));
}

// =========================
// DOM helpers
// =========================
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

let toastTimer;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function uid(prefix = "item") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function categoryLabel(category) {
  return {
    tops: "Top",
    bottoms: "Bottom",
    outerwear: "Outerwear",
    innerwear: "Innerwear",
    shoes: "Shoes",
    bags: "Bag",
    hats: "Hat",
    accessories: "Accessory",
  }[category] || category;
}

function findWardrobeItem(itemId) {
  return state.wardrobe.find(item => item.id === itemId);
}

// =========================
// Smooth navigation + folders
// =========================
function initNavigation() {
  $$("[data-scroll]").forEach(element => {
    element.addEventListener("click", event => {
      const selector = element.dataset.scroll;
      const target = document.querySelector(selector);
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  $$(".folder[data-folder]").forEach(folder => {
    folder.addEventListener("click", () => {
      const category = folder.dataset.folder;
      if (category === "looks") return;
      state.activeCategory = category;
      setTimeout(() => {
        updateFilterUI();
        renderWardrobe();
      }, 280);
    });
  });
}

// =========================
// Scroll reveal
// =========================
function initRevealAnimations() {
  if (!("IntersectionObserver" in window)) {
    $$(".reveal-up, .reveal-left, .reveal-right").forEach(el => el.classList.add("revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  $$(".reveal-up, .reveal-left, .reveal-right").forEach(el => observer.observe(el));
}

// =========================
// Closet render and filters
// =========================
function renderWardrobe() {
  const grid = $("#wardrobeGrid");
  const filtered = state.activeCategory === "all"
    ? state.wardrobe
    : state.wardrobe.filter(item => item.category === state.activeCategory);

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="closet-empty-state">
        <strong>No pieces here yet.</strong>
        <span>Add a product above or choose another category.</span>
      </div>
    `;
  } else {
    grid.innerHTML = filtered.map(item => `
      <article class="closet-card" draggable="true" data-item-id="${escapeHtml(item.id)}">
        <button
          class="closet-delete-button"
          type="button"
          data-delete-wardrobe-item="${escapeHtml(item.id)}"
          aria-label="Delete ${escapeHtml(item.name)} from My Closet"
          title="Delete from My Closet"
        >×</button>

        <div class="closet-image">
          <img src="${escapeHtml(item.image || garmentSvg(item.category, "#d8d8d3", "#777"))}" alt="${escapeHtml(item.name)}">
        </div>
        <div class="closet-card-copy">
          <strong title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</strong>
          <small>${escapeHtml(item.brand || "No brand")} · ${escapeHtml(item.platform || "manual")}</small>
          <div class="closet-card-meta">
            <span>${escapeHtml(categoryLabel(item.category))}</span>
            ${item.isCutout ? `<span class="cutout-pill">CUTOUT</span>` : ``}
            ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">source ↗</a>` : "<small>demo</small>"}
          </div>
        </div>
      </article>
    `).join("");
  }

  $("#closetCount").textContent = `${state.wardrobe.length} items`;

  $$(".closet-card").forEach(card => {
    card.addEventListener("dragstart", event => {
      // Do not begin a drag gesture from the delete button.
      if (event.target.closest(".closet-delete-button")) {
        event.preventDefault();
        return;
      }

      event.dataTransfer.setData("text/plain", card.dataset.itemId);
      event.dataTransfer.effectAllowed = "copy";
    });
  });

  $$('[data-delete-wardrobe-item]').forEach(button => {
    button.addEventListener("pointerdown", event => {
      event.stopPropagation();
    });

    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      deleteWardrobeItem(button.dataset.deleteWardrobeItem);
    });
  });

  renderLabCloset();
}

async function deleteGeneratedCutout(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith("/static/uploads/")) {
    return;
  }

  try {
    await fetch("/api/delete-cutout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl }),
    });
  } catch (error) {
    // Closet deletion should still succeed locally even if server cleanup fails.
    console.warn("Could not remove generated cutout file:", error);
  }
}

function deleteWardrobeItem(itemId) {
  const item = findWardrobeItem(itemId);
  if (!item) return;

  const confirmed = window.confirm(
    `Delete “${item.name}” from My Closet?\n\nIt will also be removed from the current Style Lab outfit. Saved Looks will stay unchanged.`
  );

  if (!confirmed) return;

  state.wardrobe = state.wardrobe.filter(entry => entry.id !== itemId);

  // Remove every live canvas layer created from this wardrobe item.
  const removedLayerIds = state.outfit
    .filter(layer => layer.itemId === itemId)
    .map(layer => layer.layerId);

  state.outfit = state.outfit.filter(layer => layer.itemId !== itemId);

  if (removedLayerIds.includes(state.selectedLayerId)) {
    state.selectedLayerId = null;
  }

  saveWardrobe();
  renderWardrobe();
  renderOutfit();

  // Generated cutout PNGs are no longer needed once the closet item is gone.
  // Demo SVGs and external images are never deleted from the server.
  deleteGeneratedCutout(item.image);

  showToast(`${item.name} deleted from My Closet`);
}
function updateFilterUI() {
  $$(".filter-chip").forEach(button => {
    button.classList.toggle("active", button.dataset.category === state.activeCategory);
  });
}

function initFilters() {
  $$(".filter-chip").forEach(button => {
    button.addEventListener("click", () => {
      state.activeCategory = button.dataset.category;
      updateFilterUI();
      renderWardrobe();
    });
  });
}

// =========================
// Product import + automatic cutout
// =========================
function guessCategory(text = "") {
  const lower = text.toLowerCase();
  if (/(jacket|coat|blazer|cardigan|outer)/.test(lower)) return "outerwear";
  if (/(jean|denim|pants|trouser|skirt|short)/.test(lower)) return "bottoms";
  if (/(shoe|sneaker|loafer|boot|sandal)/.test(lower)) return "shoes";
  if (/(bag|pouch|tote)/.test(lower)) return "bags";
  if (/(hat|cap|beanie)/.test(lower)) return "hats";
  if (/(bra|cami|camisole|inner|tank)/.test(lower)) return "innerwear";
  if (/(glass|necklace|ring|earring|bracelet|accessory)/.test(lower)) return "accessories";
  return "tops";
}

function showManualProductForm(data = {}) {
  state.manualProductUrl = data.url || $("#productUrl").value.trim();

  $("#manualName").value = data.name || "";
  $("#manualBrand").value = data.brand || "";
  $("#manualImage").value = data.image || "";
  $("#manualImageFile").value = "";
  $("#manualCategory").value = data.category || guessCategory(data.name || "");

  $("#manualProductForm").classList.remove("is-hidden");
  $("#manualName").focus();
}

function hideManualProductForm() {
  $("#manualProductForm").classList.add("is-hidden");
}

async function requestCutoutFromServer({ uploadedFile = null, imageUrl = "", referer = "" } = {}) {
  let response;

  if (uploadedFile) {
    const formData = new FormData();
    formData.append("image", uploadedFile);

    response = await fetch("/api/auto-cutout", {
      method: "POST",
      body: formData,
    });
  } else {
    response = await fetch("/api/auto-cutout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        referer,
      }),
    });
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    throw new Error("The cutout server returned an unreadable response.");
  }

  if (!response.ok || !data.ok || !data.cutout_url) {
    const detail = data.detail ? ` (${data.detail})` : "";
    throw new Error(`${data.message || "Automatic cutout failed."}${detail}`);
  }

  return data.cutout_url;
}

async function createAutomaticCutout() {
  const uploadedFile = $("#manualImageFile").files[0];
  const imageUrl = $("#manualImage").value.trim();

  if (!uploadedFile && !imageUrl) {
    throw new Error("Add an image URL or upload an image file first.");
  }

  const cutoutUrl = await requestCutoutFromServer({
    uploadedFile,
    imageUrl,
    referer: state.manualProductUrl,
  });

  return {
    image: cutoutUrl,
    isCutout: true,
    note: "Background removed automatically.",
  };
}

async function ensureItemCutout(item) {
  if (!item) return item;

  if (item.isCutout || String(item.image || "").startsWith("/static/uploads/cutout-")) {
    return item;
  }

  // Built-in SVG samples already have transparent backgrounds.
  if (String(item.image || "").startsWith("data:image/svg+xml")) {
    return item;
  }

  const sourceImage = item.originalImage || item.image;
  if (!sourceImage || !/^https?:\/\//i.test(sourceImage)) {
    throw new Error("This saved item has no reusable source image. Add it again and upload the product image directly.");
  }

  showToast("Removing the background before placing it on the mannequin…");

  const cutoutUrl = await requestCutoutFromServer({
    imageUrl: sourceImage,
    referer: item.url || "",
  });

  item.originalImage = sourceImage;
  item.image = cutoutUrl;
  item.isCutout = true;

  saveWardrobe();
  renderWardrobe();

  return item;
}

function getProductPlatform() {
  try {
    return new URL(state.manualProductUrl).hostname.replace("www.", "");
  } catch {
    return "manual";
  }
}

function initProductImport() {
  $("#importProductButton").addEventListener("click", async () => {
    const url = $("#productUrl").value.trim();
    const status = $("#productImportStatus");

    if (!url) {
      status.textContent = "Paste a product-detail URL first.";
      return;
    }

    status.textContent = "Scanning public product metadata...";

    try {
      const response = await fetch("/api/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      showManualProductForm({
        ...data,
        url: data.url || url,
        category: data.category || guessCategory(data.name || ""),
      });

      if (data.ok && data.image) {
        status.textContent = "Product found. Check the details, then Save + Cutout.";
      } else {
        status.textContent = data.message || "Complete the missing details, then Save + Cutout.";
      }
    } catch (error) {
      showManualProductForm({ url });
      status.textContent = "Could not read this page. Add the details or upload a product image manually.";
    }
  });

  $("#manualProductForm").addEventListener("submit", async event => {
    event.preventDefault();

    const name = $("#manualName").value.trim();
    const brand = $("#manualBrand").value.trim();
    const category = $("#manualCategory").value;
    const originalImageUrl = $("#manualImage").value.trim();
    const imageFile = $("#manualImageFile").files[0];
    const status = $("#productImportStatus");
    const saveButton = $("#saveProductButton");

    if (!name) return;

    if (!originalImageUrl && !imageFile) {
      status.textContent = "Add an image URL or upload an image so the garment can be cut out.";
      return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "cutting out...";
    status.textContent = "Removing the background and preparing your garment...";

    let cutoutResult;
    try {
      cutoutResult = await createAutomaticCutout();
    } catch (error) {
      saveButton.disabled = false;
      saveButton.textContent = "save + cutout";
      status.textContent = `Could not save yet: ${error.message} If the store blocks its image URL, upload the product image file directly.`;
      showToast("Cutout failed — the original background was NOT saved");
      return;
    }

    const finalImage = cutoutResult.image;

    const item = {
      id: uid("manual"),
      name,
      brand: brand || "Manual item",
      image: finalImage,
      category,
      platform: getProductPlatform(),
      url: state.manualProductUrl,
      originalImage: originalImageUrl,
      isCutout: Boolean(cutoutResult.isCutout),
    };

    state.wardrobe.unshift(item);
    saveWardrobe();
    renderWardrobe();
    hideManualProductForm();

    $("#productUrl").value = "";
    status.textContent = "Saved. The transparent cutout is ready in My Closet and Style Lab.";

    saveButton.disabled = false;
    saveButton.textContent = "save + cutout";

    showToast(`${item.name} saved as a transparent cutout`);
  });

  $("#cancelManualButton").addEventListener("click", hideManualProductForm);
}

// =========================
// Profile
// =========================
function selectedCheckboxValues(containerSelector) {
  return $$(`${containerSelector} input[type="checkbox"]:checked`).map(input => input.value);
}

function fillProfileForm() {
  $("#profileHeight").value = state.profile.height || "";
  $("#profileFit").value = state.profile.fit || "";
  $("#profileBodyShape").value = state.profile.bodyShape || "";
  $("#profileBrands").value = state.profile.brands || "";
  $("#profileColors").value = state.profile.colors || "";
  $("#profileAvoidColors").value = state.profile.avoidColors || "";

  $$("#styleOptions input").forEach(input => {
    input.checked = (state.profile.styles || []).includes(input.value);
  });

  $$("#occasionOptions input").forEach(input => {
    input.checked = (state.profile.occasions || []).includes(input.value);
  });
}

function initProfile() {
  fillProfileForm();

  $("#profileForm").addEventListener("submit", event => {
    event.preventDefault();

    state.profile = {
      height: $("#profileHeight").value,
      fit: $("#profileFit").value,
      bodyShape: $("#profileBodyShape").value,
      brands: $("#profileBrands").value.trim(),
      colors: $("#profileColors").value.trim(),
      avoidColors: $("#profileAvoidColors").value.trim(),
      styles: selectedCheckboxValues("#styleOptions"),
      occasions: selectedCheckboxValues("#occasionOptions"),
    };

    saveProfile();
    $("#profileStatus").textContent = "saved in this browser ✓";
    showToast("Your style formula was saved");
  });
}

// =========================
// Style Lab closet
// =========================
function renderLabCloset() {
  const container = $("#labClosetList");

  container.innerHTML = state.wardrobe.map(item => `
    <div class="lab-piece" draggable="true" data-item-id="${escapeHtml(item.id)}" title="${escapeHtml(item.name)}">
      <img src="${escapeHtml(item.image)}" alt="">
      <small>${escapeHtml(item.name)}</small>
    </div>
  `).join("");

  $$(".lab-piece").forEach(piece => {
    piece.addEventListener("dragstart", event => {
      event.dataTransfer.setData("text/plain", piece.dataset.itemId);
      event.dataTransfer.effectAllowed = "copy";
    });
  });
}

// =========================
// Style Lab drag/drop, move, resize
// =========================
function placeItem(item, x, y, custom = {}) {
  if (!item) return;

  const defaults = categoryDefaults[item.category] || { x: 80, y: 160, width: 130 };
  const placed = {
    layerId: custom.layerId || uid("layer"),
    itemId: item.id,
    name: item.name,
    brand: item.brand,
    category: item.category,
    image: item.image,
    x: Number.isFinite(custom.x) ? custom.x : Math.max(4, x - defaults.width / 2),
    y: Number.isFinite(custom.y) ? custom.y : Math.max(4, y - defaults.width / 2),
    width: custom.width || defaults.width,
    z: custom.z || categoryZ[item.category] || 30,
  };

  state.outfit.push(placed);
  state.selectedLayerId = placed.layerId;
  renderOutfit();
}

function renderOutfit() {
  const layers = $("#outfitLayers");

  layers.innerHTML = state.outfit.map(layer => `
    <div
      class="placed-item ${layer.layerId === state.selectedLayerId ? "selected" : ""}"
      data-layer-id="${escapeHtml(layer.layerId)}"
      style="left:${layer.x}px; top:${layer.y}px; width:${layer.width}px; z-index:${layer.z};"
    >
      <img src="${escapeHtml(layer.image)}" alt="${escapeHtml(layer.name)}">
      <span class="resize-handle" aria-hidden="true"></span>
    </div>
  `).join("");

  $("#dropHint").classList.toggle("is-hidden", state.outfit.length > 0);

  bindPlacedItems();
  renderCurrentOutfitPanel();
}

function bindPlacedItems() {
  $$(".placed-item").forEach(element => {
    const layerId = element.dataset.layerId;

    element.addEventListener("pointerdown", event => {
      if (event.target.classList.contains("resize-handle")) return;

      selectLayer(layerId);

      const layer = state.outfit.find(entry => entry.layerId === layerId);
      if (!layer) return;

      const canvasRect = $("#stylingCanvas").getBoundingClientRect();
      const startPointerX = event.clientX;
      const startPointerY = event.clientY;
      const startX = layer.x;
      const startY = layer.y;

      element.setPointerCapture(event.pointerId);

      const onMove = moveEvent => {
        const maxX = canvasRect.width - layer.width;
        const maxY = canvasRect.height - 40;

        layer.x = Math.min(Math.max(0, startX + moveEvent.clientX - startPointerX), Math.max(0, maxX));
        layer.y = Math.min(Math.max(0, startY + moveEvent.clientY - startPointerY), Math.max(0, maxY));

        element.style.left = `${layer.x}px`;
        element.style.top = `${layer.y}px`;
      };

      const onUp = () => {
        element.removeEventListener("pointermove", onMove);
        element.removeEventListener("pointerup", onUp);
        renderCurrentOutfitPanel();
      };

      element.addEventListener("pointermove", onMove);
      element.addEventListener("pointerup", onUp);
    });

    const handle = element.querySelector(".resize-handle");
    handle.addEventListener("pointerdown", event => {
      event.stopPropagation();
      selectLayer(layerId);

      const layer = state.outfit.find(entry => entry.layerId === layerId);
      if (!layer) return;

      const startX = event.clientX;
      const startWidth = layer.width;

      handle.setPointerCapture(event.pointerId);

      const onResize = moveEvent => {
        layer.width = Math.min(320, Math.max(55, startWidth + moveEvent.clientX - startX));
        element.style.width = `${layer.width}px`;
      };

      const onResizeEnd = () => {
        handle.removeEventListener("pointermove", onResize);
        handle.removeEventListener("pointerup", onResizeEnd);
      };

      handle.addEventListener("pointermove", onResize);
      handle.addEventListener("pointerup", onResizeEnd);
    });
  });
}

function selectLayer(layerId) {
  state.selectedLayerId = layerId;
  $$(".placed-item").forEach(item => {
    item.classList.toggle("selected", item.dataset.layerId === layerId);
  });
  renderSelectedControls();
}

function removeLayer(layerId) {
  state.outfit = state.outfit.filter(layer => layer.layerId !== layerId);
  if (state.selectedLayerId === layerId) state.selectedLayerId = null;
  renderOutfit();
}

function initCanvasDrop() {
  const canvas = $("#stylingCanvas");

  canvas.addEventListener("dragover", event => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    canvas.classList.add("drag-active");
  });

  canvas.addEventListener("dragleave", () => canvas.classList.remove("drag-active"));

  canvas.addEventListener("drop", async event => {
    event.preventDefault();
    canvas.classList.remove("drag-active");

    const itemId = event.dataTransfer.getData("text/plain");
    const item = findWardrobeItem(itemId);
    if (!item) return;

    const rect = canvas.getBoundingClientRect();

    try {
      const readyItem = await ensureItemCutout(item);
      placeItem(readyItem, event.clientX - rect.left, event.clientY - rect.top);
    } catch (error) {
      showToast(`Could not remove background: ${error.message}`);
    }
  });

  canvas.addEventListener("pointerdown", event => {
    if (event.target === canvas || event.target.id === "outfitLayers") {
      state.selectedLayerId = null;
      renderOutfit();
    }
  });
}

// =========================
// Current outfit panel + controls
// =========================
function renderCurrentOutfitPanel() {
  const container = $("#currentOutfitList");

  if (!state.outfit.length) {
    container.innerHTML = `<div class="microcopy">Nothing on the mannequin yet.</div>`;
  } else {
    const sorted = [...state.outfit].sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category));

    container.innerHTML = sorted.map(layer => `
      <div class="outfit-row">
        <span>${escapeHtml(categoryLabel(layer.category))}</span>
        <strong title="${escapeHtml(layer.name)}">${escapeHtml(layer.name)}</strong>
        <button type="button" data-remove-layer="${escapeHtml(layer.layerId)}" aria-label="Remove">×</button>
      </div>
    `).join("");

    $$("[data-remove-layer]").forEach(button => {
      button.addEventListener("click", () => removeLayer(button.dataset.removeLayer));
    });
  }

  renderSelectedControls();
}

function renderSelectedControls() {
  const controls = $("#selectedControls");
  const selected = state.outfit.find(layer => layer.layerId === state.selectedLayerId);

  if (!selected) {
    controls.classList.add("is-hidden");
    return;
  }

  controls.classList.remove("is-hidden");
  $("#selectedItemName").textContent = selected.name;
}

function initSelectedControls() {
  $("#selectedControls").addEventListener("click", event => {
    const action = event.target.dataset.control;
    if (!action) return;

    const selected = state.outfit.find(layer => layer.layerId === state.selectedLayerId);
    if (!selected) return;

    if (action === "smaller") selected.width = Math.max(55, selected.width - 12);
    if (action === "larger") selected.width = Math.min(320, selected.width + 12);

    if (action === "front") {
      const maxZ = Math.max(80, ...state.outfit.map(layer => layer.z));
      selected.z = maxZ + 1;
    }

    if (action === "delete") {
      removeLayer(selected.layerId);
      return;
    }

    renderOutfit();
  });
}

// =========================
// Random mix, clear, save look
// =========================
function chooseRandomByCategory(category) {
  const options = state.wardrobe.filter(item => item.category === category);
  if (!options.length) return null;
  return options[Math.floor(Math.random() * options.length)];
}

function randomMix() {
  state.outfit = [];
  state.selectedLayerId = null;

  const categories = ["tops", "bottoms", "shoes", "bags"];
  if (Math.random() > 0.45) categories.push("outerwear");
  if (Math.random() > 0.55) categories.push("hats");
  if (Math.random() > 0.55) categories.push("accessories");

  const canvas = $("#stylingCanvas");
  const canvasWidth = canvas.clientWidth;

  categories.forEach(category => {
    const item = chooseRandomByCategory(category);
    if (!item) return;

    const d = categoryDefaults[category];
    let centeredX = (canvasWidth - d.width) / 2;

    if (category === "bags") centeredX += Math.min(115, canvasWidth * 0.22);
    if (category === "accessories") centeredX += 2;
    if (category === "hats") centeredX += 1;

    placeItem(item, centeredX + d.width / 2, d.y + d.width / 2, {
      x: Math.max(0, centeredX),
      y: d.y,
      width: d.width,
      z: categoryZ[category],
    });
  });

  state.selectedLayerId = null;
  renderOutfit();
  showToast("Random look generated");
}

function saveCurrentLook() {
  if (!state.outfit.length) {
    showToast("Build an outfit first");
    return;
  }

  const title = prompt("Name this look:", `Look ${state.looks.length + 1}`);
  if (title === null) return;

  const styleTag = state.profile.styles?.[0] || "Personal";
  const look = {
    id: uid("look"),
    title: title.trim() || `Look ${state.looks.length + 1}`,
    styleTag,
    date: new Date().toISOString(),
    pieces: state.outfit.map(layer => ({ ...layer })),
  };

  state.looks.unshift(look);
  saveLooks();
  renderLooks();
  showToast("Look saved to My Looks");
}

function initOutfitActions() {
  $("#randomMixButton").addEventListener("click", randomMix);

  $("#clearOutfitButton").addEventListener("click", () => {
    state.outfit = [];
    state.selectedLayerId = null;
    renderOutfit();
  });

  $("#saveLookButton").addEventListener("click", saveCurrentLook);

  $("#askAiOutfitButton").addEventListener("click", () => {
    openChat();
    $("#chatInput").value = "How would you improve my current outfit? Suggest specific changes.";
    $("#chatInput").focus();
  });
}

// =========================
// Saved looks
// =========================
function lookPieceStyle(piece) {
  const positions = {
    hats: { top: 24, width: 55 },
    accessories: { top: 53, width: 50 },
    tops: { top: 72, width: 92 },
    innerwear: { top: 78, width: 82 },
    outerwear: { top: 64, width: 110 },
    bottoms: { top: 130, width: 84 },
    bags: { top: 100, width: 65 },
    shoes: { top: 190, width: 90 },
  };
  return positions[piece.category] || { top: 90, width: 80 };
}

function renderLooks() {
  const carousel = $("#looksCarousel");

  if (!state.looks.length) {
    carousel.innerHTML = `
      <div class="empty-looks">
        No saved looks yet.<br>
        Build one in Style Lab and press “Save Look”.
      </div>
    `;
    return;
  }

  carousel.innerHTML = state.looks.map(look => {
    const previewPieces = look.pieces.map(piece => {
      const style = lookPieceStyle(piece);
      return `<img class="look-mini-piece" src="${escapeHtml(piece.image)}" alt="" style="top:${style.top}px;width:${style.width}px;z-index:${piece.z};">`;
    }).join("");

    const date = new Date(look.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return `
      <article class="look-card">
        <div class="look-preview">${previewPieces}</div>
        <div class="look-card-copy">
          <small>${escapeHtml(look.styleTag)} · ${escapeHtml(date)}</small>
          <h3>${escapeHtml(look.title)}</h3>
          <small>${look.pieces.length} pieces</small>
          <div class="look-card-actions">
            <button type="button" data-load-look="${escapeHtml(look.id)}">load look</button>
            <button type="button" data-delete-look="${escapeHtml(look.id)}">delete</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  $$("[data-load-look]").forEach(button => {
    button.addEventListener("click", () => {
      const look = state.looks.find(entry => entry.id === button.dataset.loadLook);
      if (!look) return;

      state.outfit = look.pieces.map(piece => ({
        ...piece,
        layerId: uid("layer"),
      }));

      state.selectedLayerId = null;
      renderOutfit();
      $("#style-lab").scrollIntoView({ behavior: "smooth" });
      showToast(`${look.title} loaded into Style Lab`);
    });
  });

  $$("[data-delete-look]").forEach(button => {
    button.addEventListener("click", () => {
      state.looks = state.looks.filter(entry => entry.id !== button.dataset.deleteLook);
      saveLooks();
      renderLooks();
    });
  });
}

function initLookCarousel() {
  $("#looksPrev").addEventListener("click", () => {
    $("#looksCarousel").scrollBy({ left: -300, behavior: "smooth" });
  });

  $("#looksNext").addEventListener("click", () => {
    $("#looksCarousel").scrollBy({ left: 300, behavior: "smooth" });
  });
}

// =========================
// Chatbot
// =========================
function openChat() {
  $("#chatPanel").classList.remove("is-hidden");
}

function closeChat() {
  $("#chatPanel").classList.add("is-hidden");
}

function appendChatMessage(text, role, extraClass = "") {
  const messages = $("#chatMessages");
  const bubble = document.createElement("div");
  bubble.className = `chat-message ${role} ${extraClass}`.trim();
  bubble.textContent = text;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
  return bubble;
}

async function sendChatMessage(message) {
  const trimmed = message.trim();
  if (!trimmed) return;

  appendChatMessage(trimmed, "user");
  $("#chatInput").value = "";

  const loading = appendChatMessage("thinking about the silhouette...", "assistant", "loading");

  const outfitContext = state.outfit.map(layer => ({
    name: layer.name,
    brand: layer.brand,
    category: layer.category,
  }));

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: trimmed,
        profile: state.profile,
        outfit: outfitContext,
      }),
    });

    const data = await response.json();
    loading.remove();

    if (!response.ok || !data.ok) {
      appendChatMessage(data.message || "The stylist is unavailable right now.", "assistant");
      return;
    }

    appendChatMessage(data.answer, "assistant");
  } catch (error) {
    loading.remove();
    appendChatMessage("I couldn't reach the Flask chat endpoint. Check that the server is running.", "assistant");
  }
}

function initChat() {
  $("#chatLauncher").addEventListener("click", () => {
    $("#chatPanel").classList.toggle("is-hidden");
  });

  $("#closeChatButton").addEventListener("click", closeChat);

  $("#chatForm").addEventListener("submit", event => {
    event.preventDefault();
    sendChatMessage($("#chatInput").value);
  });

  $$(".chat-suggestions button").forEach(button => {
    button.addEventListener("click", () => sendChatMessage(button.textContent));
  });
}

// =========================
// Boot
// =========================
function init() {
  loadState();
  initNavigation();
  initRevealAnimations();
  initFilters();
  initProductImport();
  initProfile();
  initCanvasDrop();
  initSelectedControls();
  initOutfitActions();
  initLookCarousel();
  initChat();

  renderWardrobe();
  renderOutfit();
  renderLooks();
}

document.addEventListener("DOMContentLoaded", init);
