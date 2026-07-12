"use strict";

window.addEventListener("DOMContentLoaded", initializeShareFixes);

function initializeShareFixes() {
  bindShareButton(document.getElementById("sharePageButton"), () => ({
    title: document.getElementById("siteTitle")?.textContent?.trim() || document.title,
    text: document.getElementById("siteSubtitle")?.textContent?.trim() || "",
    url: getCleanBaseUrl()
  }));

  bindShareButton(document.getElementById("shareItemButton"), () => {
    const title = document.getElementById("dialogTitle")?.textContent?.trim() || document.title;
    const price = document.getElementById("dialogPrice")?.textContent?.trim() || "";

    return {
      title,
      text: [title, price].filter(Boolean).join(" - "),
      url: location.hash.startsWith("#item=")
        ? `${getCleanBaseUrl()}${location.hash}`
        : getCleanBaseUrl()
    };
  });
}

function bindShareButton(button, createPayload) {
  if (!button || button.dataset.shareFixBound === "true") return;

  button.dataset.shareFixBound = "true";
  button.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    await shareOrCopy(createPayload());
  }, true);
}

async function shareOrCopy(payload) {
  try {
    if (shouldUseNativeShare()) {
      await navigator.share(payload);
      return;
    }

    await copyText(payload.url);
    showShareToast("הקישור הועתק");
  } catch (error) {
    if (error?.name === "AbortError") return;
    console.error("Could not share link", error);
    showShareToast("לא הצלחנו להעתיק את הקישור");
  }
}

function shouldUseNativeShare() {
  if (typeof navigator.share !== "function") return false;

  const userAgent = navigator.userAgent || "";
  const mobileDevice = navigator.userAgentData?.mobile === true
    || /Android|iPhone|iPod/i.test(userAgent)
    || (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1);

  return mobileDevice;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Clipboard copy was rejected");
}

function getCleanBaseUrl() {
  return location.href.split("#")[0].split("?")[0];
}

function showShareToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  clearTimeout(window.shareToastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.shareToastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
}
