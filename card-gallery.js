"use strict";

const createItemCardWithoutGallery = createItemCard;

createItemCard = function createItemCardWithGallery(item) {
  const card = createItemCardWithoutGallery(item);
  if (!Array.isArray(item.images) || item.images.length < 2) return card;

  const imageWrap = card.querySelector(".item-card__image");
  const count = imageWrap?.querySelector(".image-count");
  let currentVisual = imageWrap?.firstElementChild;
  let currentIndex = 0;

  if (!imageWrap || !currentVisual) return card;

  const showImage = (nextIndex) => {
    currentIndex = (nextIndex + item.images.length) % item.images.length;
    const nextVisual = createItemVisual(item, currentIndex, "card");
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

  if (count) count.textContent = `1 / ${item.images.length}`;

  imageWrap.append(
    createArrow(-1, "תמונה קודמת", "‹", "card-gallery-arrow--previous"),
    createArrow(1, "תמונה הבאה", "›", "card-gallery-arrow--next")
  );

  return card;
};
