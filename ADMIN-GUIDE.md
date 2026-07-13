# Managing the moving-sale website

The public website is in Hebrew, but the Pages CMS editing interface is in English.

## Normal item workflow

1. Open **Sale items** in Pages CMS.
2. Each item starts as a compact row. Click a row to open its fields.
3. Add a new item or edit an existing one.
4. Upload up to eight photos.
5. Fill in the Hebrew item name and description, price, category and status.
6. Add optional details such as an original price, availability date, condition, dimensions or special pickup instructions only when they are useful.
7. Save. Pages CMS commits the change to GitHub, and GitHub Pages publishes it automatically.

The internal item ID is generated automatically and is hidden from the editor.

The **Available from** field is a date picker. Leave it empty when an item is available immediately. The website creates the Hebrew availability sentence automatically.

When an item is sold, change **Status** to **Sold**. Its card remains visible, becomes grey and non-clickable, and shows that it found a new home.

## Changing the item order

Use the drag handle beside a collapsed item row to move it up or down. There are no display-order numbers to maintain.

The website keeps available items before reserved items, and sold items last. Dragging controls the order within those groups.

## Avoiding save conflicts

The catalogue is stored in one shared file. Being logged in at the same time is harmless, but two people should not edit and save **Sale items** at the same time.

Before starting an editing session:

1. Refresh Pages CMS so you are working from the latest version.
2. Confirm that nobody else is currently editing the catalogue.
3. Save one item before beginning another large edit.

If an upload or save reports an error, refresh the page before retrying. Check the existing photo picker first, because an image may already have uploaded successfully even when the final item save failed.

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

Always review the Hebrew output before publishing, especially brand names, measurements, prices and any defects.
