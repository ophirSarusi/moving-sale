# Maintenance instructions

This is a zero-build static website hosted on GitHub Pages.

## Architecture

- `index.html`: semantic page structure and modal.
- `styles.css`: all visual styling and responsive behavior.
- `app.js`: data loading, filtering, item modal, sharing and WhatsApp links.
- `data/site.json`: editable site-wide content.
- `data/items.json`: editable sale item list.
- `.pages.yml`: Pages CMS form schema.
- `media/items/`: photographs uploaded by editors.
- `media/demo/`: removable demo illustrations.

## Rules for code changes

1. Keep the site usable under a GitHub project-pages subpath such as `/moving-sale/`.
2. Do not add a build step unless there is a strong reason. Browser-only maintenance is a core requirement.
3. Preserve Hebrew RTL support, mobile responsiveness and keyboard accessibility.
4. Do not put item content directly into HTML or JavaScript. Keep it in the JSON files.
5. Do not add tracking, analytics, cookies or third-party scripts without explicit approval.
6. Do not copy code or assets from the reference website. This implementation is independent.
7. Run `npm test` after modifying the content schema or sample data.

## Testing checklist

- Load through an HTTP server, not `file://`, because JSON is fetched at runtime.
- Test at desktop and mobile widths.
- Verify search, category filters and the available-only switch.
- Open an item through a card and through a `#item=<id>` URL.
- Test items with no image, one image and multiple images.
- Test available, reserved and sold states.
- Confirm the page works when hosted below a repository subpath.
