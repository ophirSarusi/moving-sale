# Moving-sale website

An independent, Hebrew RTL, mobile-friendly moving-sale website. It is built with plain HTML, CSS and JavaScript and can be managed entirely in a browser.

## What is included

- Search and category filters
- Available, reserved and sold statuses
- A visible availability date or “available immediately” value for every item
- A configurable availability, reservation and pickup disclaimer
- Multiple photos per item
- Item detail gallery
- WhatsApp links with the item name prefilled
- Shareable links to individual items
- Pages CMS forms for editing settings, items and photos
- GitHub Pages compatibility without a build process
- Automated JSON validation on GitHub

## Before publishing

Edit `data/site.json` and replace the demo WhatsApp number. The number must use international format with digits only, for example `972541234567`.

The sample listings and illustrations are demonstrations. Delete or replace them through Pages CMS after setup.

## Browser-only installation

### 1. Create the repository

1. On GitHub, create a new **public** repository, for example `moving-sale`.
2. Download and unzip this starter package.
3. In the empty repository, choose **Add file → Upload files**.
4. Drag all files and folders from inside the unzipped `moving-sale-site` folder into the upload area.
5. Commit the upload to the `main` branch.

The repository root must contain `index.html`, `.pages.yml`, `data/`, `media/` and the other included files. Do not upload the outer folder as one ZIP file.

### 2. Publish with GitHub Pages

1. Open **Settings → Pages** in the repository.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch **main** and folder **/(root)**.
4. Save.

The public URL will normally be:

`https://YOUR-GITHUB-USERNAME.github.io/REPOSITORY-NAME/`

### 3. Connect Pages CMS

1. Open `https://app.pagescms.org`.
2. Sign in with GitHub.
3. Install the Pages CMS GitHub App for this repository.
4. Open the repository in Pages CMS.
5. Use **הגדרות העמוד** for general text and contact details.
6. Use **פריטים למכירה** to add, edit, reorder or mark items as sold.

The included `.pages.yml` file defines all editing forms and image-upload behavior.

### 4. Give another person editing access

A GitHub account is not required for the second editor. Use the collaborator invitation feature in Pages CMS and invite them by email. Email collaborators can edit content and media, including uploading item photos, but cannot edit `.pages.yml` or manage other collaborators.

## Daily editing workflow

1. Sign in to Pages CMS.
2. Open **פריטים למכירה**.
3. Add or edit an item.
4. Upload photographs in the **תמונות** field.
5. Fill in **זמינות**, for example `זמין מיידית` or `זמין החל מ-15.08.2026`.
6. Save.

Pages CMS commits the changes to GitHub. GitHub Pages republishes the site automatically.

## Important privacy note

GitHub Pages websites are public. Do not publish your exact home address, documents, keys, family photographs or other sensitive information. Use a general pickup area and provide the exact address privately.

## Development and testing

The website requires no build step. To test locally, serve the directory through any HTTP server. Opening `index.html` directly with `file://` will not load the JSON files in most browsers.

Validate the data with:

```bash
npm test
```

Future coding agents should read `AGENTS.md` before making changes.


## Installation when GitHub file upload is unavailable

You can still install the site without uploading files:

1. Create a repository with a README so that it has a `main` branch.
2. Connect that repository to Codex web.
3. Ask Codex to create the site files and open a pull request, then review and merge it.

GitHub also allows files to be created by copy and paste in the browser, and the free `github.dev` editor can create and commit multiple files. A one-file bootstrap workflow can be used to install this exact package with a single copy-and-paste operation.
