"use strict";

const ITEM_WHATSAPP_ICON = `
  <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
    <path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 1 1-4.2 15.3l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8zm-3.1 4c-.2 0-.5 0-.7.3-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.8 4.3 3.9 2.1.9 2.6.7 3 .7.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2l-.4-.2-1.5-.7c-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1-.2-.1-.9-.3-1.8-1.1-.7-.6-1.1-1.3-1.2-1.5-.1-.2 0-.3.1-.5l.4-.5c.1-.2.1-.3.2-.4v-.4L10 8.2c-.2-.4-.4-.4-.6-.4h-.5z"/>
  </svg>`;

window.addEventListener("DOMContentLoaded", initializeItemEnhancements);

async function initializeItemEnhancements() {
  showSoldItemsByDefault();

  try {
    const [siteResponse, itemsResponse] = await Promise.all([
      fetch("data/site.json", { cache: "no-store" }),
      fetch("data/items.json", { cache: "no-store" })
    ]);

    if (!siteResponse.ok || !itemsResponse.ok) return;

    const site = await siteResponse.json();
    const items = await itemsResponse.json();
    if (!Array.isArray(items)) return;

    const phone = String(site.whatsapp || "").replace(/\D/g, "");
    const validPhone = /^\d{8,15}$/.test(phone) ? phone : "";
    const itemsByTitle = new Map(
      items
        .filter((item) => item && item.title)
        .map((item) => [String(item.title).trim(), item])
    );

    const enhance = () => {
      enhanceCards(itemsByTitle, validPhone);
      enhanceDialog(items, validPhone);
    };

    enhance();

    const observer = new MutationObserver(enhance);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href", "aria-disabled", "open"]
    });
  } catch (error) {
    console.error("Could not initialize item enhancements", error);
  }
}

function showSoldItemsByDefault() {
  const toggle = document.getElementById("availableOnlyToggle");
  if (!toggle) return;
  toggle.checked = false;
  toggle.dispatchEvent(new Event("change", { bubbles: true }));
}

function enhanceCards(itemsByTitle, phone) {
  document.querySelectorAll(".item-card").forEach((card) => {
    const title = card.querySelector("h3")?.textContent?.trim();
    const item = itemsByTitle.get(title);
    if (!item) return;

    removeCardStatusBadge(card);
    updateCardAvailability(card, item);

    if (item.status === "sold") {
      clearReservedCard(card, item);
      enhanceSoldCard(card, item);
      card.querySelector(".item-card__whatsapp")?.remove();
      return;
    }

    card.classList.remove("item-card--sold-enhanced");
    if (card.hasAttribute("aria-disabled")) card.removeAttribute("aria-disabled");

    if (item.status === "reserved") {
      enhanceReservedCard(card, item);
    } else {
      clearReservedCard(card, item);
    }

    if (!phone || card.querySelector(".item-card__whatsapp")) return;

    const link = document.createElement("a");
    link.className = "item-card__whatsapp";
    link.href = createItemWhatsappLink(phone, item);
    link.target = "_blank";
    link.rel = "noreferrer";
    link.setAttribute("aria-label", `פתיחת וואטסאפ לגבי ${item.title}`);

    const label = item.status === "reserved"
      ? "הצטרפות לרשימת ההמתנה"
      : "אני רוצה! בוואטסאפ";

    link.innerHTML = `${ITEM_WHATSAPP_ICON}<span>${label}</span>`;
    link.addEventListener("click", (event) => event.stopPropagation());
    link.addEventListener("keydown", (event) => event.stopPropagation());
    card.querySelector(".item-card__body")?.appendChild(link);
  });
}

function removeCardStatusBadge(card) {
  card.querySelector(".item-card__topline .status-badge")?.remove();
}

function updateCardAvailability(card, item) {
  const availability = card.querySelector(".item-card__availability");
  if (!availability) return;

  availability.querySelector(":scope > span")?.remove();

  let value = availability.querySelector("strong");
  if (!value) {
    value = document.createElement("strong");
    availability.appendChild(value);
  }

  const nextText = getCardAvailabilityText(item);
  if (value.textContent !== nextText) value.textContent = nextText;

  availability.classList.remove(
    "item-card__availability--available",
    "item-card__availability--reserved",
    "item-card__availability--sold"
  );

  const status = item.status === "reserved" || item.status === "sold"
    ? item.status
    : "available";
  availability.classList.add(`item-card__availability--${status}`);
}

function enhanceReservedCard(card, item) {
  card.classList.add("item-card--reserved-enhanced");
  card.setAttribute(
    "aria-label",
    `פתיחת פרטים על ${item.title}; הפריט שמור זמנית ואפשר להצטרף לרשימת ההמתנה`
  );

  const details = card.querySelector(".details-link");
  if (details && details.textContent !== "לפרטים ←") {
    details.textContent = "לפרטים ←";
  }

  const image = card.querySelector(".item-card__image");
  if (image && !image.querySelector(".reserved-waitlist-badge")) {
    const badge = document.createElement("span");
    badge.className = "reserved-waitlist-badge";
    badge.textContent = "שמור זמנית";
    image.appendChild(badge);
  }
}

function clearReservedCard(card, item) {
  card.classList.remove("item-card--reserved-enhanced");
  card.querySelector(".reserved-waitlist-badge")?.remove();

  const details = card.querySelector(".details-link");
  if (details && details.textContent !== "לפרטים ←") {
    details.textContent = "לפרטים ←";
  }

  if (item.status !== "sold") {
    card.setAttribute("aria-label", `פתיחת פרטים על ${item.title}`);
  }
}

function enhanceSoldCard(card, item) {
  card.classList.add("item-card--sold-enhanced");
  card.tabIndex = -1;
  if (card.getAttribute("aria-disabled") !== "true") card.setAttribute("aria-disabled", "true");
  card.setAttribute("aria-label", `${item.title} — נמכר ומצא בית חדש`);

  if (!card.dataset.soldInteractionBlocked) {
    const blockInteraction = (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    card.addEventListener("click", blockInteraction, true);
    card.addEventListener("keydown", blockInteraction, true);
    card.dataset.soldInteractionBlocked = "true";
  }

  const image = card.querySelector(".item-card__image");
  if (image && !image.querySelector(".sold-home-badge")) {
    const badge = document.createElement("span");
    badge.className = "sold-home-badge";
    badge.textContent = "מצא בית חדש! 🎉";
    image.appendChild(badge);
  }
}

function enhanceDialog(items, phone) {
  const match = location.hash.match(/^#item=(.+)$/);
  if (!match) return;

  const id = decodeURIComponent(match[1]);
  const item = items.find((candidate) => String(candidate.id) === id);
  if (!item) return;

  updateDialogAvailability(item);
  updateReservedDialogNote(item);

  const button = document.getElementById("dialogWhatsapp");
  if (!button) return;

  if (item.status === "sold") {
    if (button.getAttribute("href") !== "#") button.setAttribute("href", "#");
    if (button.getAttribute("aria-disabled") !== "true") button.setAttribute("aria-disabled", "true");
    if (button.textContent !== "מצא בית חדש 🎉") button.textContent = "מצא בית חדש 🎉";
    button.classList.add("button--sold");
    return;
  }

  button.classList.remove("button--sold");
  if (!phone) return;

  const expectedHref = createItemWhatsappLink(phone, item);
  const expectedLabel = item.status === "reserved"
    ? "הצטרפות לרשימת ההמתנה"
    : "אני רוצה! בוואטסאפ";

  if (button.hasAttribute("aria-disabled")) button.removeAttribute("aria-disabled");
  if (button.getAttribute("href") !== expectedHref) button.setAttribute("href", expectedHref);
  if (button.textContent !== expectedLabel) button.textContent = expectedLabel;
  button.setAttribute("aria-label", `פתיחת וואטסאפ לגבי ${item.title}`);
}

function updateReservedDialogNote(item) {
  const details = document.querySelector(".dialog-details");
  if (!details) return;

  let note = details.querySelector(".reserved-waitlist-note");
  if (item.status !== "reserved") {
    note?.remove();
    return;
  }

  if (!note) {
    note = document.createElement("p");
    note.className = "reserved-waitlist-note";
    details.querySelector(".dialog-description")?.insertAdjacentElement("afterend", note);
  }

  note.textContent = "הפריט שמור כרגע. אפשר להשאיר הודעה ונעדכן אם הוא יתפנה.";
}

function updateDialogAvailability(item) {
  document.querySelectorAll("#dialogFacts .fact").forEach((fact) => {
    if (fact.querySelector("dt")?.textContent?.trim() !== "זמינות") return;
    const value = fact.querySelector("dd");
    const nextText = getAvailabilityText(item);
    if (value && value.textContent !== nextText) value.textContent = nextText;
  });
}

function getCardAvailabilityText(item) {
  if (item.status === "sold") return "נמכר";
  if (item.status === "reserved") return "שמור זמנית · רשימת המתנה פתוחה";

  const availableFrom = parseDateOnly(item.availableFrom);
  const dateText = availableFrom ? formatDateOnly(availableFrom) : "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureDate = availableFrom && availableFrom > today;

  return futureDate ? `זמין מ־${dateText}` : "זמין מיידית";
}

function getAvailabilityText(item) {
  if (item.status === "sold") return "לא זמין";

  const availableFrom = parseDateOnly(item.availableFrom);
  const dateText = availableFrom ? formatDateOnly(availableFrom) : "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureDate = availableFrom && availableFrom > today;

  if (item.status === "reserved") {
    return futureDate
      ? `שמור זמנית — אם יתפנה, איסוף מ־${dateText}`
      : "שמור זמנית — רשימת המתנה פתוחה";
  }

  return futureDate ? `זמין החל מ־${dateText}` : "זמין מיידית";
}

function parseDateOnly(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateOnly(date) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "numeric",
    year: "numeric"
  }).format(date);
}

function createItemWhatsappLink(phone, item) {
  const message = item.status === "reserved"
    ? `היי! ראיתי את "${item.title}" שמסומן כשמור זמנית. אשמח להצטרף לרשימת ההמתנה ולקבל עדכון אם הוא יתפנה 😊`
    : `היי! ראיתי את "${item.title}" בעמוד המכירה שלכם ואני מעוניין/ת 😊 האם הוא עדיין זמין?`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
