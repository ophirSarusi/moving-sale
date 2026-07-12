"use strict";

const STATUS_META = {
  available: { label: "זמין", className: "status-badge--available", order: 0 },
  reserved: { label: "שמור זמנית", className: "status-badge--reserved", order: 1 },
  sold: { label: "נמכר", className: "status-badge--sold", order: 2 }
};

const state = {
  site: {},
  items: [],
  query: "",
  category: "all",
  availableOnly: true,
  selectedItem: null,
  imageIndex: 0
};

const elements = {};
let toastTimer = null;

window.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
  cacheElements();
  bindEvents();

  try {
    const [site, items] = await Promise.all([
      fetchJson("data/site.json"),
      fetchJson("data/items.json")
    ]);

    state.site = normalizeSite(site);
    state.items = Array.isArray(items) ? items.map(normalizeItem).filter(Boolean) : [];

    applySiteSettings();
    renderCategoryFilters();
    renderItems();
    openItemFromHash();

    elements.loadingState.classList.add("is-hidden");
    elements.itemsGrid.classList.remove("is-hidden");
  } catch (error) {
    console.error(error);
    elements.loadingState.classList.add("is-hidden");
    elements.errorState.classList.remove("is-hidden");
  }
}

function cacheElements() {
  [
    "brandText", "generalWhatsapp", "heroBadge", "siteTitle", "siteSubtitle", "announcement",
    "availableCount", "totalCount", "pickupLocation", "searchInput", "availableOnlyToggle",
    "categoryFilters", "resultsCount", "loadingState", "itemsGrid", "emptyState", "errorState",
    "clearFiltersButton", "sharePageButton", "disclaimerSection", "disclaimerTitle",
    "availabilityDisclaimer", "reservationDisclaimer", "pickupDisclaimer",
    "footerTitle", "footerNote", "footerWhatsapp",
    "manageLink", "updatedText", "itemDialog", "closeDialogButton", "dialogImageStage",
    "dialogThumbnails", "previousImageButton", "nextImageButton", "dialogCategory", "dialogStatus",
    "dialogTitle", "dialogDescription", "dialogPrice", "dialogOriginalPrice", "dialogFacts",
    "dialogWhatsapp", "shareItemButton", "toast"
  ].forEach((id) => {
    elements[id] = document.getElementById(id);
  });
}

function bindEvents() {
  elements.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLocaleLowerCase("he");
    renderItems();
  });

  elements.availableOnlyToggle.addEventListener("change", (event) => {
    state.availableOnly = event.target.checked;
    renderItems();
  });

  elements.clearFiltersButton.addEventListener("click", () => {
    state.query = "";
    state.category = "all";
    state.availableOnly = false;
    elements.searchInput.value = "";
    elements.availableOnlyToggle.checked = false;
    renderCategoryFilters();
    renderItems();
  });

  elements.sharePageButton.addEventListener("click", () => shareUrl({
    title: state.site.title,
    text: state.site.subtitle,
    url: getBaseUrl()
  }));

  elements.closeDialogButton.addEventListener("click", closeDialog);
  elements.itemDialog.addEventListener("click", (event) => {
    if (event.target === elements.itemDialog) closeDialog();
  });
  elements.itemDialog.addEventListener("close", clearItemHash);

  elements.previousImageButton.addEventListener("click", () => moveImage(-1));
  elements.nextImageButton.addEventListener("click", () => moveImage(1));
  elements.shareItemButton.addEventListener("click", shareSelectedItem);

  window.addEventListener("hashchange", openItemFromHash);
  window.addEventListener("keydown", (event) => {
    if (!elements.itemDialog.open) return;
    if (event.key === "ArrowLeft") moveImage(document.dir === "rtl" ? 1 : -1);
    if (event.key === "ArrowRight") moveImage(document.dir === "rtl" ? -1 : 1);
  });
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}: ${response.status}`);
  return response.json();
}

function normalizeSite(site = {}) {
  return {
    brand: site.brand || site.title || "מכירת מעבר דירה",
    title: site.title || "דברים טובים מחפשים בית חדש",
    subtitle: site.subtitle || "פריטים לבית לקראת מעבר דירה.",
    badge: site.badge || "איסוף בתיאום מראש",
    announcement: site.announcement || "",
    location: site.location || "בתיאום",
    pickupText: site.pickupText || "איסוף עצמי בתיאום מראש",
    whatsapp: String(site.whatsapp || "").replace(/\D/g, ""),
    currency: site.currency || "ILS",
    footerTitle: site.footerTitle || "שאלות או רוצים לשמור פריט?",
    footerNote: site.footerNote || "שלחו הודעה ונחזור אליכם בהקדם.",
    disclaimerTitle: site.disclaimerTitle || "הבהרה חשובה",
    availabilityDisclaimer: site.availabilityDisclaimer || "הזמינות המוצגת באתר אינה מחייבת. אישור סופי יינתן בוואטסאפ בלבד.",
    reservationDisclaimer: site.reservationDisclaimer || "שמירת פריט מובטחת רק לאחר קבלת מלוא התשלום.",
    pickupDisclaimer: site.pickupDisclaimer || "האיסוף חייב להתבצע במועד שסוכם, ועיכובים הם באחריות הקונה.",
    updatedAt: site.updatedAt || "",
    showManageLink: Boolean(site.showManageLink),
    manageUrl: site.manageUrl || "https://app.pagescms.org"
  };
}

function normalizeItem(item, index) {
  if (!item || !item.title) return null;

  const status = STATUS_META[item.status] ? item.status : "available";
  const images = Array.isArray(item.images) ? item.images.filter(Boolean) : [];

  return {
    id: String(item.id || `item-${index + 1}`),
    title: String(item.title),
    description: String(item.description || ""),
    price: toNumber(item.price),
    originalPrice: toNumber(item.originalPrice),
    category: String(item.category || "אחר"),
    status,
    availability: String(item.availability || "זמין מיידית"),
    condition: String(item.condition || ""),
    dimensions: String(item.dimensions || ""),
    negotiable: Boolean(item.negotiable),
    featured: Boolean(item.featured),
    pickup: String(item.pickup || ""),
    images,
    sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : 1000
  };
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function applySiteSettings() {
  document.title = state.site.brand;
  setText(elements.brandText, state.site.brand);
  setText(elements.heroBadge, state.site.badge);
  setText(elements.siteTitle, state.site.title);
  setText(elements.siteSubtitle, state.site.subtitle);
  setText(elements.pickupLocation, state.site.location);
  setText(elements.footerTitle, state.site.footerTitle);
  setText(elements.footerNote, state.site.footerNote);
  setText(elements.disclaimerTitle, state.site.disclaimerTitle);
  setText(elements.availabilityDisclaimer, state.site.availabilityDisclaimer);
  setText(elements.reservationDisclaimer, state.site.reservationDisclaimer);
  setText(elements.pickupDisclaimer, state.site.pickupDisclaimer);

  if (state.site.announcement) {
    setText(elements.announcement, state.site.announcement);
    elements.announcement.classList.remove("is-hidden");
  }

  const available = state.items.filter((item) => item.status === "available").length;
  setText(elements.availableCount, available);
  setText(elements.totalCount, state.items.length);

  if (state.site.updatedAt) {
    const formatted = formatDate(state.site.updatedAt);
    setText(elements.updatedText, formatted ? `עודכן לאחרונה: ${formatted}` : "");
  }

  const generalLink = createWhatsappLink();
  if (generalLink) {
    elements.generalWhatsapp.href = generalLink;
    elements.footerWhatsapp.href = generalLink;
    elements.generalWhatsapp.classList.remove("is-hidden");
    elements.footerWhatsapp.classList.remove("is-hidden");
  }

  if (state.site.showManageLink && state.site.manageUrl) {
    elements.manageLink.href = state.site.manageUrl;
    elements.manageLink.classList.remove("is-hidden");
  }
}

function renderCategoryFilters() {
  const categories = [...new Set(state.items.map((item) => item.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "he"));

  elements.categoryFilters.replaceChildren();
  elements.categoryFilters.appendChild(createCategoryChip("all", "הכול"));
  categories.forEach((category) => elements.categoryFilters.appendChild(createCategoryChip(category, category)));
}

function createCategoryChip(value, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chip";
  button.textContent = label;
  button.setAttribute("aria-pressed", String(state.category === value));
  button.addEventListener("click", () => {
    state.category = value;
    renderCategoryFilters();
    renderItems();
  });
  return button;
}

function getFilteredItems() {
  return state.items
    .filter((item) => !state.availableOnly || item.status === "available")
    .filter((item) => state.category === "all" || item.category === state.category)
    .filter((item) => {
      if (!state.query) return true;
      const haystack = [item.title, item.description, item.category, item.availability, item.condition, item.dimensions]
        .join(" ")
        .toLocaleLowerCase("he");
      return haystack.includes(state.query);
    })
    .sort((a, b) => {
      if (a.featured !== b.featured) return Number(b.featured) - Number(a.featured);
      if (STATUS_META[a.status].order !== STATUS_META[b.status].order) {
        return STATUS_META[a.status].order - STATUS_META[b.status].order;
      }
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.title.localeCompare(b.title, "he");
    });
}

function renderItems() {
  const items = getFilteredItems();
  elements.itemsGrid.replaceChildren();

  items.forEach((item) => elements.itemsGrid.appendChild(createItemCard(item)));

  setText(elements.resultsCount, resultCountText(items.length));
  elements.emptyState.classList.toggle("is-hidden", items.length !== 0);
  elements.itemsGrid.classList.toggle("is-hidden", items.length === 0);
}

function createItemCard(item) {
  const article = document.createElement("article");
  article.className = `item-card${item.status === "sold" ? " item-card--sold" : ""}`;
  article.tabIndex = 0;
  article.setAttribute("role", "button");
  article.setAttribute("aria-label", `פתיחת פרטים על ${item.title}`);

  article.addEventListener("click", () => openDialog(item));
  article.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDialog(item);
    }
  });

  const imageWrap = document.createElement("div");
  imageWrap.className = "item-card__image";
  imageWrap.appendChild(createItemVisual(item, 0));

  if (item.images.length > 1) {
    const count = document.createElement("span");
    count.className = "image-count";
    count.textContent = `${item.images.length} תמונות`;
    imageWrap.appendChild(count);
  }

  const body = document.createElement("div");
  body.className = "item-card__body";

  const topLine = document.createElement("div");
  topLine.className = "item-card__topline";

  const category = document.createElement("span");
  category.className = "item-category";
  category.textContent = item.category;
  topLine.append(category, createStatusBadge(item.status));

  const title = document.createElement("h3");
  title.textContent = item.title;

  const description = document.createElement("p");
  description.className = "item-card__description";
  description.textContent = item.description || item.condition || "לחצו לפרטים נוספים";

  const availability = document.createElement("p");
  availability.className = "item-card__availability";
  const availabilityLabel = document.createElement("span");
  availabilityLabel.textContent = "זמינות:";
  const availabilityValue = document.createElement("strong");
  availabilityValue.textContent = item.availability;
  availability.append(availabilityLabel, availabilityValue);

  const footer = document.createElement("div");
  footer.className = "item-card__footer";

  const priceGroup = document.createElement("div");
  priceGroup.className = "price-group";
  const price = document.createElement("strong");
  price.className = "price";
  price.textContent = formatPrice(item.price);
  priceGroup.appendChild(price);

  if (item.originalPrice > item.price && item.price > 0) {
    const original = document.createElement("span");
    original.className = "original-price";
    original.textContent = formatPrice(item.originalPrice);
    priceGroup.appendChild(original);
  }

  const details = document.createElement("span");
  details.className = "details-link";
  details.textContent = "לפרטים ←";

  footer.append(priceGroup, details);
  body.append(topLine, title, description, availability, footer);
  article.append(imageWrap, body);
  return article;
}

function createItemVisual(item, imageIndex) {
  const imagePath = item.images[imageIndex];
  if (!imagePath) return createPlaceholder(item.title);

  const image = document.createElement("img");
  image.src = resolveAssetPath(imagePath);
  image.alt = item.title;
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => image.replaceWith(createPlaceholder(item.title)), { once: true });
  return image;
}

function createPlaceholder(title) {
  const placeholder = document.createElement("div");
  placeholder.className = "image-placeholder";
  placeholder.textContent = title;
  return placeholder;
}

function createStatusBadge(status) {
  const meta = STATUS_META[status] || STATUS_META.available;
  const badge = document.createElement("span");
  badge.className = `status-badge ${meta.className}`;
  badge.textContent = meta.label;
  return badge;
}

function openDialog(item, updateHash = true) {
  state.selectedItem = item;
  state.imageIndex = 0;

  setText(elements.dialogCategory, item.category);
  elements.dialogStatus.replaceWith(createDialogStatus(item.status));
  elements.dialogStatus = document.getElementById("dialogStatus");
  setText(elements.dialogTitle, item.title);
  setText(elements.dialogDescription, item.description || "אין תיאור נוסף לפריט זה.");
  setText(elements.dialogPrice, formatPrice(item.price));

  if (item.originalPrice > item.price && item.price > 0) {
    setText(elements.dialogOriginalPrice, formatPrice(item.originalPrice));
    elements.dialogOriginalPrice.classList.remove("is-hidden");
  } else {
    elements.dialogOriginalPrice.classList.add("is-hidden");
  }

  renderFacts(item);
  renderDialogImage();

  const whatsappLink = createWhatsappLink(item);
  if (whatsappLink && item.status !== "sold") {
    elements.dialogWhatsapp.href = whatsappLink;
    elements.dialogWhatsapp.removeAttribute("aria-disabled");
    elements.dialogWhatsapp.textContent = item.status === "reserved" ? "בדיקה אם הפריט התפנה" : "אני רוצה את הפריט";
  } else {
    elements.dialogWhatsapp.href = "#";
    elements.dialogWhatsapp.setAttribute("aria-disabled", "true");
    elements.dialogWhatsapp.textContent = item.status === "sold" ? "הפריט נמכר" : "מספר וואטסאפ לא הוגדר";
  }

  if (!elements.itemDialog.open) elements.itemDialog.showModal();

  if (updateHash) {
    history.replaceState(null, "", `${getBaseUrl()}#item=${encodeURIComponent(item.id)}`);
  }
}

function createDialogStatus(status) {
  const badge = createStatusBadge(status);
  badge.id = "dialogStatus";
  return badge;
}

function renderFacts(item) {
  const facts = [];
  if (item.availability) facts.push(["זמינות", item.availability]);
  if (item.condition) facts.push(["מצב", item.condition]);
  if (item.dimensions) facts.push(["מידות", item.dimensions]);
  facts.push(["גמישות במחיר", item.negotiable ? "כן, במידה סבירה" : "מחיר קבוע"]);
  facts.push(["איסוף", item.pickup || state.site.pickupText]);

  elements.dialogFacts.replaceChildren();
  facts.forEach(([label, value]) => {
    const wrapper = document.createElement("div");
    wrapper.className = "fact";
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = value;
    wrapper.append(term, description);
    elements.dialogFacts.appendChild(wrapper);
  });
}

function renderDialogImage() {
  const item = state.selectedItem;
  if (!item) return;

  elements.dialogImageStage.replaceChildren(createItemVisual(item, state.imageIndex));
  elements.dialogThumbnails.replaceChildren();

  const hasMultiple = item.images.length > 1;
  elements.previousImageButton.classList.toggle("is-hidden", !hasMultiple);
  elements.nextImageButton.classList.toggle("is-hidden", !hasMultiple);

  item.images.forEach((path, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "thumbnail";
    button.setAttribute("aria-label", `מעבר לתמונה ${index + 1}`);
    button.setAttribute("aria-current", String(index === state.imageIndex));

    const image = document.createElement("img");
    image.src = resolveAssetPath(path);
    image.alt = "";
    image.loading = "lazy";
    button.appendChild(image);
    button.addEventListener("click", () => {
      state.imageIndex = index;
      renderDialogImage();
    });
    elements.dialogThumbnails.appendChild(button);
  });
}

function moveImage(direction) {
  const images = state.selectedItem?.images || [];
  if (images.length < 2) return;
  state.imageIndex = (state.imageIndex + direction + images.length) % images.length;
  renderDialogImage();
}

function closeDialog() {
  if (elements.itemDialog.open) elements.itemDialog.close();
}

function clearItemHash() {
  state.selectedItem = null;
  if (location.hash.startsWith("#item=")) history.replaceState(null, "", getBaseUrl());
}

function openItemFromHash() {
  const match = location.hash.match(/^#item=(.+)$/);
  if (!match || !state.items.length) return;
  const id = decodeURIComponent(match[1]);
  const item = state.items.find((candidate) => candidate.id === id);
  if (item) openDialog(item, false);
}

function shareSelectedItem() {
  const item = state.selectedItem;
  if (!item) return;
  shareUrl({
    title: item.title,
    text: `${item.title} - ${formatPrice(item.price)}`,
    url: `${getBaseUrl()}#item=${encodeURIComponent(item.id)}`
  });
}

async function shareUrl(payload) {
  try {
    if (navigator.share) {
      await navigator.share(payload);
      return;
    }
    await navigator.clipboard.writeText(payload.url);
    showToast("הקישור הועתק");
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.error(error);
      showToast("לא הצלחנו לשתף את הקישור");
    }
  }
}

function createWhatsappLink(item = null) {
  const phone = state.site.whatsapp;
  if (!/^\d{8,15}$/.test(phone)) return "";

  const text = item
    ? `היי, אני מתעניין/ת בפריט "${item.title}" שמופיע בעמוד המכירה. האם הוא עדיין זמין?`
    : `היי, הגעתי מעמוד מכירת מעבר הדירה ורציתי לשאול שאלה.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function resolveAssetPath(path) {
  const value = String(path || "").trim();
  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  const clean = value.replace(/^\.\//, "").replace(/^\/+/, "");
  return new URL(clean, document.baseURI).href;
}

function getBaseUrl() {
  return location.href.split("#")[0].split("?")[0];
}

function formatPrice(value) {
  if (!value) return "למסירה";
  try {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: state.site.currency || "ILS",
      maximumFractionDigits: 0
    }).format(value);
  } catch {
    return `₪${Math.round(value).toLocaleString("he-IL")}`;
  }
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function resultCountText(count) {
  if (count === 0) return "אין תוצאות";
  if (count === 1) return "פריט אחד";
  return `${count} פריטים`;
}

function setText(element, value) {
  if (element) element.textContent = value ?? "";
}

function showToast(message) {
  clearTimeout(toastTimer);
  setText(elements.toast, message);
  elements.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 2400);
}
