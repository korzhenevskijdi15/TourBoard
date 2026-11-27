# v0.19.3 — Strict template mobile email rebuild

- Reworked the strict-template email mobile media query to fluidly stack header cells and price/action cells below 600px.
- Explicitly resets `td` display/width for the price block, preventing the CTA from expanding beyond the former 40% column.
- Keeps object detail table cells constrained and wrapping long room/meal values.
- Keeps manager social links in a single full-width 3-column table row, with wrapping labels and fixed-size icons.
- Makes email wrappers fluid with `min-width:0` and avoids clipping overflow at the outer wrapper.
- Normalizes manager/footer social links to wrap instead of forcing `white-space:nowrap`.
- Desktop email width remains max 760px; mobile width is fluid.
