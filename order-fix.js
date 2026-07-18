"use strict";

// Keep the visible toggle and the internal filter state aligned before the
// delayed storefront initializer renders the catalog.
state.availableOnly = false;
const availableOnlyToggle = document.getElementById("availableOnlyToggle");
if (availableOnlyToggle) availableOnlyToggle.checked = false;

// Preserve the exact order stored by Pages CMS. Array.filter keeps the
// relative order of matching items, so searches and category filters do too.
getFilteredItems = function getFilteredItemsInCmsOrder() {
  return state.items
    .filter((item) => !state.availableOnly || item.status === "available")
    .filter((item) => state.category === "all" || item.category === state.category)
    .filter((item) => {
      if (!state.query) return true;

      const haystack = [
        item.title,
        item.description,
        item.category,
        item.availability,
        item.condition,
        item.dimensions
      ]
        .join(" ")
        .toLocaleLowerCase("he");

      return haystack.includes(state.query);
    });
};
