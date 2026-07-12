# Managing the moving-sale website

The public website is in Hebrew, but the Pages CMS editing interface is in English.

## Normal item workflow

1. Open **Sale items** in Pages CMS.
2. Add a new item or open an existing one.
3. Upload up to eight photos.
4. Fill in the price, category, status, optional availability date, and display order.
5. Paste the shopper-facing Hebrew name, description, condition, and any special pickup instructions.
6. Save. Pages CMS commits the change to GitHub, and GitHub Pages publishes it automatically.

The **Available from** field is a date picker. Leave it empty when an item is available immediately. The website creates the Hebrew availability sentence automatically.

When an item is sold, change **Status** to **Sold**. Its card remains visible, becomes grey and non-clickable, and shows that it found a new home.

## ChatGPT prompt for Hebrew listing copy

Copy this prompt into ChatGPT, attach the item photos, and replace the notes at the bottom:

> Open and review the current moving-sale website at https://ophirsarusi.github.io/moving-sale/ so you can match its existing Hebrew language, warmth, and tone.
>
> I am adding another item to the website. Using the attached photos and my English notes, write natural Hebrew for an Israeli second-hand moving-sale listing.
>
> Match the website's current style: warm, straightforward, friendly, slightly playful, and concise. Do not sound like an advertisement or a product specification. Do not exaggerate the condition, hide defects, or invent details that are not visible or included in my notes.
>
> Return exactly these fields, with no additional explanation:
>
> **Item name — Hebrew:**
>
> **Description — Hebrew:**
>
> **Condition — Hebrew:**
>
> **Special pickup instructions — Hebrew:**
>
> Keep the item name short. Keep the description to two or three natural sentences. Leave the pickup field blank when there are no special instructions beyond normal pickup from Rehovot.
>
> My English notes:
> [Paste the brand/model, age, condition, dimensions, included accessories, defects, and pickup constraints here.]

Always review the Hebrew output before publishing, especially brand names, measurements, and any defects.
