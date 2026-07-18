"use strict";

const OPTIMIZED_IMAGE_MANIFEST = "media/optimized/manifest.json";
let optimizedImages = Object.create(null);
const optimizedImageManifestPromise = loadOptimizedImageManifest();

async function loadOptimizedImageManifest() {
  try {
    const response = await fetch(resolveAssetPath(OPTIMIZED_IMAGE_MANIFEST));
    if (!response.ok) return;

    const payload = await response.json();
    if (payload && payload.images && typeof payload.images === "object") {
      optimizedImages = payload.images;
    }
  } catch (error) {
    console.warn("Optimized image manifest is unavailable; using originals.", error);
  }
}

function normalizeOriginalImagePath(path) {
  const value = String(path || "").trim();
  if (!value || /^(https?:|data:|blob:)/i.test(value)) return "";

  const clean = value.replace(/^\.\//, "").replace(/^\/+/, "");
  return clean.startsWith("media/items/") ? clean : "";
}

function getOptimizedImagePath(path, variant) {
  const originalPath = normalizeOriginalImagePath(path);
  if (!originalPath) return "";

  const entry = optimizedImages[originalPath];
  const optimizedPath = entry && typeof entry === "object" ? entry[variant] : "";
  return typeof optimizedPath === "string" ? optimizedPath : "";
}

function configureImageFallback(image, optimizedPath, originalPath, title) {
  let usingOptimized = Boolean(optimizedPath);

  image.addEventListener("error", () => {
    if (usingOptimized) {
      usingOptimized = false;
      image.src = resolveAssetPath(originalPath);
      return;
    }
    image.replaceWith(createPlaceholder(title));
  });
}

async function assignImageSource(image, originalPath, variants, title) {
  await optimizedImageManifestPromise;
  if (!image.isConnected) return;

  const optimizedPath = variants
    .map((variant) => getOptimizedImagePath(originalPath, variant))
    .find(Boolean) || "";

  configureImageFallback(image, optimizedPath, originalPath, title);
  image.src = resolveAssetPath(optimizedPath || originalPath);
}

createItemVisual = function createOptimizedItemVisual(item, imageIndex, variant = "card") {
  const originalPath = item.images[imageIndex];
  if (!originalPath) return createPlaceholder(item.title);

  const image = document.createElement("img");
  image.alt = item.title;
  image.loading = variant === "dialog" ? "eager" : "lazy";
  image.decoding = "async";
  if (variant === "dialog") image.fetchPriority = "high";

  assignImageSource(image, originalPath, [variant], item.title);
  return image;
};

const renderItemsStorefront = renderItems;
renderItems = function renderItemsWithPriority() {
  renderItemsStorefront();

  const cardImages = elements.itemsGrid.querySelectorAll(".item-card__image img");
  cardImages.forEach((image, index) => {
    if (index >= 3) return;
    image.loading = "eager";
    if (index === 0) image.fetchPriority = "high";
  });
};

renderDialogImage = function renderOptimizedDialogImage() {
  const item = state.selectedItem;
  if (!item) return;

  const currentIndex = state.imageIndex;
  const mainImage = createItemVisual(item, currentIndex, "dialog");
  elements.dialogImageStage.replaceChildren(mainImage);
  elements.dialogThumbnails.replaceChildren();

  const hasMultiple = item.images.length > 1;
  elements.previousImageButton.classList.toggle("is-hidden", !hasMultiple);
  elements.nextImageButton.classList.toggle("is-hidden", !hasMultiple);

  item.images.forEach((path, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "thumbnail";
    button.setAttribute("aria-label", `מעבר לתמונה ${index + 1}`);
    button.setAttribute("aria-current", String(index === currentIndex));

    const image = document.createElement("img");
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.fetchPriority = "low";
    assignImageSource(image, path, ["thumb", "card"], item.title);

    button.appendChild(image);
    button.addEventListener("click", () => {
      state.imageIndex = index;
      renderDialogImage();
    });
    elements.dialogThumbnails.appendChild(button);
  });

  if (mainImage instanceof HTMLImageElement) {
    mainImage.addEventListener(
      "load",
      () => scheduleNextDialogImagePrefetch(item, currentIndex),
      { once: true }
    );
  }
};

function scheduleNextDialogImagePrefetch(item, currentIndex) {
  const run = () => {
    if (state.selectedItem !== item || state.imageIndex !== currentIndex) return;
    prefetchNextDialogImage(item, currentIndex);
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 1200 });
  } else {
    window.setTimeout(run, 300);
  }
}

async function prefetchNextDialogImage(item, currentIndex) {
  if (item.images.length < 2) return;

  await optimizedImageManifestPromise;
  if (state.selectedItem !== item || state.imageIndex !== currentIndex) return;

  const nextIndex = (currentIndex + 1) % item.images.length;
  const optimizedPath = getOptimizedImagePath(item.images[nextIndex], "dialog");
  if (!optimizedPath) return;

  const preload = new Image();
  preload.decoding = "async";
  preload.fetchPriority = "low";
  preload.src = resolveAssetPath(optimizedPath);
}
