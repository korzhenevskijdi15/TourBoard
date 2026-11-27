# Modern template rebuild — v0.20.0

## Changes

- Rebuilt the Modern client page layout with desktop and mobile breakpoints.
- Desktop offer cards use a two-column image/content layout; narrow screens stack the image above the offer details.
- Preserved collection data and offer elements: hotel/title, image, location, description, manager note, terms, travel details, price, and contact CTA.
- Added a dedicated table-based HTML email renderer for the Modern template. The email preview and send flow now start from the same generated HTML instead of copying computed browser styles from the client page.
- Email styles are primarily inline, with a small responsive media query as progressive enhancement.
- Updated the client script cache version and package version to 0.20.0.

## Validation performed

- `node --check public/client.js`
- Renderer smoke test using representative offer data, including HTML escaping and multiline description checks.

## Remaining acceptance testing

This source package does not include configured SMTP credentials or real inboxes. After deployment, send a test collection to Gmail, Mail.ru, and Yandex Mail and inspect desktop/mobile rendering, images, links, button, and text wrapping.
