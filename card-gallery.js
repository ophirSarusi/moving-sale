"use strict";

const CARD_SWIPE_MIN_DISTANCE = 44;
const CARD_SWIPE_AXIS_RATIO = 1.2;
const createItemCardWithoutGallery = createItemCard;

createItemCard = function createItemCardWithGallery(item) {
  const card = createItemCardWithoutGallery(item);
  if (!Array.isArray(item.images) || item.images.length < 2) return card;

  const imageWrap = card.querySelector(".item-card__image");
  const count = imageWrap?.querySelector(".image-count");
  let currentVisual = imageWrap?.firstElementChild;
  let currentIndex = 0;
  let activePointer = null;
  let suppressCardClickUntil = 0;

  if (!imageWrap || !currentVisual) return card;

  const prepareVisual = (visual) => {
    if (visual instanceof HTMLImageElement) visual.draggable = false;
    return visual;
  };

  prepareVisual(currentVisual);

  const showImage = (nextIndex) => {
    currentIndex = (nextIndex + item.images.length) % item.images.length;
    const nextVisual = prepareVisual(createItemVisual(item, currentIndex, "card"));
    currentVisual.replaceWith(nextVisual);
    currentVisual = nextVisual;

    if (count) count.textContent = `${currentIndex + 1} / ${item.images.length}`;
  };

  const createArrow = (direction, label, symbol, className) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `card-gallery-arrow ${className}`;
    button.textContent = symbol;
    button.setAttribute("aria-label", `${label}: ${item.title}`);

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      showImage(currentIndex + direction);
    });
    button.addEventListener("keydown", (event) => event.stopPropagation());

    return button;
  };

  const cancelSwipe = (event) => {
    if (!activePointer || event.pointerId !== activePointer.id) return;
    activePointer = null;
  };

  imageWrap.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button > 0 || event.target.closest(".card-gallery-arrow")) return;

    activePointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY
    };

    try {
      imageWrap.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is an enhancement; swipe detection still works without it.
    }
  });

  imageWrap.addEventListener("pointerup", (event) => {
    if (!activePointer || event.pointerId !== activePointer.id) return;

    const deltaX = event.clientX - activePointer.x;
    const deltaY = event.clientY - activePointer.y;
    activePointer = null;

    try {
      imageWrap.releasePointerCapture(event.pointerId);
    } catch {
      // The pointer may already have been released by the browser.
    }

    const isHorizontalSwipe =
      Math.abs(deltaX) >= CARD_SWIPE_MIN_DISTANCE &&
      Math.abs(deltaX) >= Math.abs(deltaY) * CARD_SWIPE_AXIS_RATIO;

    if (!isHorizontalSwipe) return;

    event.preventDefault();
    suppressCardClickUntil = performance.now() + 450;
    showImage(currentIndex + (deltaX < 0 ? 1 : -1));
  });

  imageWrap.addEventListener("pointercancel", cancelSwipe);
  imageWrap.addEventListener("lostpointercapture", cancelSwipe);
  imageWrap.addEventListener("dragstart", (event) => event.preventDefault());

  card.addEventListener(
    "click",
    (event) => {
      if (performance.now() >= suppressCardClickUntil) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true
  );

  if (count) count.textContent = `1 / ${item.images.length}`;

  imageWrap.append(
    createArrow(-1, "תמונה קודמת", "‹", "card-gallery-arrow--previous"),
    createArrow(1, "תמונה הבאה", "›", "card-gallery-arrow--next")
  );

  return card;
};
