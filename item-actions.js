"use strict";

const ITEM_WHATSAPP_ICON = `
  <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
    <path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 1 1-4.2 15.3l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8zm-3.1 4c-.2 0-.5 0-.7.3-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.8 4.3 3.9 2.1.9 2.6.7 3 .7.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2l-.4-.2-1.5-.7c-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1-.2-.1-.9-.3-1.8-1.1-.7-.6-1.1-1.3-1.2-1.5-.1-.2 0-.3.1-.5l.4-.5c.1-.2.1-.3.2-.4v-.4L10 8.2c-.2-.4-.4-.4-.6-.4h-.5z"/>
  </svg>`;

window.addEventListener("DOMContentLoaded", initializeItemWhatsappActions);

async function initializeItemWhatsappActions() {
  try {
    const [siteResponse, itemsResponse] = await Promise.all([
      fetch("data/site.json", { cache: "no-store" }),
      fetch("data/items.json", { cache: "no-store" })
    ]);

    if (!siteResponse.ok || !itemsResponse.ok) return;

    const site = await siteResponse.json();
    const items = await itemsResponse.json();
    const phone = String(site.whatsapp || "").replace(/\D/g, "");
    if (!/^\d{8,15}$/.test(phone) || !Array.isArray(items)) return;

    const itemsByTitle = new Map(
      items
        .filter((item) => item && item.title)
        .map((item) => [String(item.title).trim(), item])
    );

    const enhance = () => {
      enhanceCards(itemsByTitle, phone);
      enhanceDialog(items, phone);
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
    console.error("Could not initialize item WhatsApp actions", error);
  }
}

function enhanceCards(itemsByTitle, phone) {
  document.querySelectorAll(".item-card").forEach((card) => {
    if (card.querySelector(".item-card__whatsapp")) return;

    const title = card.querySelector("h3")?.textContent?.trim();
    const item = itemsByTitle.get(title);
    if (!item || item.status === "sold") return;

    const link = document.createElement("a");
    link.className = "item-card__whatsapp";
    link.href = createItemWhatsappLink(phone, item);
    link.target = "_blank";
    link.rel = "noreferrer";
    link.setAttribute("aria-label", `פתיחת וואטסאפ לגבי ${item.title}`);

    const label = item.status === "reserved"
      ? "לבדוק אם התפנה"
      : "אני רוצה! בוואטסאפ";

    link.innerHTML = `${ITEM_WHATSAPP_ICON}<span>${label}</span>`;

    link.addEventListener("click", (event) => event.stopPropagation());
    link.addEventListener("keydown", (event) => event.stopPropagation());

    card.querySelector(".item-card__body")?.appendChild(link);
  });
}

function enhanceDialog(items, phone) {
  const button = document.getElementById("dialogWhatsapp");
  if (!button || button.getAttribute("aria-disabled") === "true") return;

  const match = location.hash.match(/^#item=(.+)$/);
  if (!match) return;

  const id = decodeURIComponent(match[1]);
  const item = items.find((candidate) => String(candidate.id) === id);
  if (!item || item.status === "sold") return;

  const expectedHref = createItemWhatsappLink(phone, item);
  if (button.getAttribute("href") !== expectedHref) {
    button.setAttribute("href", expectedHref);
  }

  const label = item.status === "reserved"
    ? "לבדוק אם התפנה בוואטסאפ"
    : "אני רוצה! בוואטסאפ";

  if (button.textContent !== label) button.textContent = label;
  button.setAttribute("aria-label", `פתיחת וואטסאפ לגבי ${item.title}`);
}

function createItemWhatsappLink(phone, item) {
  const message = item.status === "reserved"
    ? `היי! ראיתי את "${item.title}" שמסומן כשמור זמנית. אשמח לדעת אם הוא התפנה 😊`
    : `היי! ראיתי את "${item.title}" בעמוד המכירה שלכם ואני מעוניין/ת 😊 האם הוא עדיין זמין?`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
