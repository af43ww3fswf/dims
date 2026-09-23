# Sitecore Content Hub Dimensions Editor

A black-and-white React dimensions editor designed for a Sitecore Content Hub Artwork detail page.

## Behaviour

- Starts with **no dimension sets**.
- Starts with **Enable Custom Override off**.
- Adds and removes unlimited dimension sets.
- Accepts measurements only in centimetres.
- Converts centimetres to inches, rounded to the nearest 1/16 inch.
- Supports `Standard (H × W × D)` and `Diameter (Ø × D)`.
- Calculates read-only area in cm² and in².
- Controls framed, approximate and output inclusion per set.
- Generates a presentable preview.
- Enables override fields only when the override checkbox is selected.

## Run locally

```bash
npm install
npm run dev
```

The local preview stores saved data in browser `localStorage`.

## Test

```bash
npm test
```

## Build for Sitecore Content Hub

```bash
npm install
npm run build:bundle
```

This compiles a single, self-contained JavaScript bundle into `dist/wc-dimensions-editor.js` (including embedded styles and production optimizations).

Upload `dist/wc-dimensions-editor.js` as a portal asset in Content Hub (**Manage > Portal assets**) or host it on an approved CDN, then:
1. In Content Hub, go to **Manage > Pages** and navigate to the target page layout (e.g. Artwork details).
2. Add an **External** component.
3. In the component settings, select **From asset** (and pick the uploaded portal asset) or **From path** (enter the CDN URL).
4. Save the component and publish the page changes.

The bundle exports Sitecore Content Hub's required root factory `createExternalRoot(rootElement, clientBuilder)` with `render` and `unmount` methods, and registers global fallbacks on `window`. When the component's Save button is clicked, it stages property values on the current entity using `setPropertyValue`. The user then clicks the standard Content Hub page save action to commit the changes.

Create the members listed in [CONTENT_HUB_SCHEMA.md](CONTENT_HUB_SCHEMA.md) before adding the component.

### Optional member-name configuration

Add custom JSON to the External component if your schema uses different names:

```json
{
  "memberNames": {
    "data": "WC.DimensionsData",
    "notes": "WC.DimensionsDescription",
    "computed": "WC.DimensionsComputedValue",
    "overrideEnabled": "WC.DimensionsUseOverride",
    "overrideValue": "WC.DimensionsOverrideValue",
    "overrideReason": "WC.DimensionsOverrideReason",
    "overrideNote": "WC.DimensionsOverrideNote",
    "presentable": "WC.DimensionsPresentableValue"
  }
}
```

## Production note

The included adapter stores the repeatable set collection in a long string member as JSON, which is the smallest deployable configuration. If each set must be independently searchable, auditable or related to other entities, use a dedicated `WC.DimensionSet` entity definition and replace `contentHubBridge.js` with a one-to-many repository. The UI and calculation logic do not need to change.
