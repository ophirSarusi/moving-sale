"use strict";

const OPTIMIZED_IMAGE_PREFIXES = {
  card: "media/optimized/card/",
  dialog: "media/optimized/dialog/"
};

function getOptimizedImagePath(path, variant) {
  const value = String(path || "").trim();
  if (!value || /^(https?:|data:|blob:)/i.test(value)) return "";

  const clean = value.replace(/^\.\//, "").replace(/^\/+/, "");
  const sourcePrefix = "media/items/";
  const optimizedPrefix = OPTIMIZED_IMAGE_PREFIXES[variant];
  if (!optimizedPrefix || !clean.startsWith(sourcePrefix)) return "";

  return `${optimizedPrefix}${clean.slice(sourcePrefix.length)}.webp`;
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

createItemVisual = function createOptimizedItemVisual(item, imageIndex, variant = "card") {
  const originalPath = item.images[imageIndex];
  if (!originalPath) return createPlaceholder(item.title);

  const optimizedPath = getOptimizedImagePath(originalPath, variant);
  const image = document.createElement("img");
  image.src = resolveAssetPath(optimizedPath || originalPath);
  image.alt = item.title;
  image.loading = variant === "dialog" ? "eager" : "lazy";
  image.decoding = "async";
  if (variant === "dialog") image.fetchPriority = "high";
  configureImageFallback(image, optimizedPath, originalPath, item.title);
  return image;
};

renderDialogImage = function renderOptimizedDialogImage() {
  const item = state.selectedItem;
  if (!item) return;

  elements.dialogImageStage.replaceChildren(
    createItemVisual(item, state.imageIndex, "dialog")
  );
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

    const optimizedPath = getOptimizedImagePath(path, "card");
    const image = document.createElement("img");
    image.src = resolveAssetPath(optimizedPath || path);
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    configureImageFallback(image, optimizedPath, path, item.title);

    button.appendChild(image);
    button.addEventListener("click", () => {
      state.imageIndex = index;
      renderDialogImage();
    });
    elements.dialogThumbnails.appendChild(button);
  });

  prefetchNextDialogImage(item);
};

function prefetchNextDialogImage(item) {
  if (item.images.length < 2) return;

  const nextIndex = (state.imageIndex + 1) % item.images.length;
  const originalPath = item.images[nextIndex];
  const optimizedPath = getOptimizedImagePath(originalPath, "dialog");
  const preload = new Image();
  let usingOptimized = Boolean(optimizedPath);

  preload.decoding = "async";
  preload.addEventListener("error", () => {
    if (!usingOptimized) return;
    usingOptimized = false;
    preload.src = resolveAssetPath(originalPath);
  });
  preload.src = resolveAssetPath(optimizedPath || originalPath);
}
