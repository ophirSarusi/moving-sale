import { readFile } from "node:fs/promises";

const site = JSON.parse(await readFile(new URL("../data/site.json", import.meta.url), "utf8"));
const itemData = JSON.parse(await readFile(new URL("../data/items.json", import.meta.url), "utf8"));
const items = Array.isArray(itemData) ? itemData : itemData?.items;
const errors = [];

if (!site.title) errors.push("data/site.json: title is required");
if (!site.subtitle) errors.push("data/site.json: subtitle is required");
if (!site.availabilityDisclaimer) errors.push("data/site.json: availabilityDisclaimer is required");
if (!site.reservationDisclaimer) errors.push("data/site.json: reservationDisclaimer is required");
if (!site.pickupDisclaimer) errors.push("data/site.json: pickupDisclaimer is required");
if (site.whatsapp && !/^\d{8,15}$/.test(String(site.whatsapp))) {
  errors.push("data/site.json: whatsapp must contain 8-15 digits only");
}

if (!Array.isArray(items)) {
  errors.push("data/items.json must contain an items array");
} else {
  const ids = new Set();
  const statuses = new Set(["available", "reserved", "sold"]);

  items.forEach((item, index) => {
    const label = `data/items.json item ${index + 1}`;
    if (!item.id) errors.push(`${label}: id is required`);
    if (ids.has(item.id)) errors.push(`${label}: duplicate id ${item.id}`);
    ids.add(item.id);
    if (!item.title) errors.push(`${label}: title is required`);
    if (!item.description) errors.push(`${label}: description is required`);
    if (!statuses.has(item.status)) errors.push(`${label}: invalid status ${item.status}`);
    if (typeof item.price !== "number" || item.price < 0) errors.push(`${label}: price must be a non-negative number`);
    if (item.images && !Array.isArray(item.images)) errors.push(`${label}: images must be an array`);
    if (item.availableFrom && !/^\d{4}-\d{2}-\d{2}$/.test(item.availableFrom)) {
      errors.push(`${label}: availableFrom must use YYYY-MM-DD`);
    }
  });
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Validation passed: ${items.length} item(s).`);
