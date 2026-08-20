# Animated Product Website — Scroll-Driven Frame Sequence

Your upload is a 300-frame render (1280x720) of an RGB-lit smart alarm clock with a wireless charging pad, LED display, and fabric speaker body. That sequence becomes the centerpiece: as the visitor scrolls, the product rotates and lights up frame by frame — the Apple-style "scrollytelling" effect.

## The page

Single page at `/`, dark cinematic theme so the RGB glow carries the whole design.

1. **Hero** — full-bleed first frame, product name and one-line pitch, subtle scroll cue.
2. **Scroll sequence** — a tall sticky section where the 300 frames play in sync with scroll. Short captions fade in and out at key moments in the animation (wireless charging, RGB ring, clock display, Bluetooth audio).
3. **Feature grid** — 4 features in an asymmetric layout, each revealing on scroll.
4. **Specs** — clean two-column technical table.
5. **Closing CTA** — pre-order / buy band with the glow motif, minimal footer.

Placeholder copy: product named "Aurora" with plausible feature and spec text. Send me real names/specs and I'll swap them in.

## Look

- Near-black background, soft spectral gradient accents pulled from the RGB ring in the frames.
- Large tight-tracked sans headings, restrained body text, sharp-ish corners.
- Motion is restrained everywhere except the scroll sequence — fades and small offsets only, no bouncing.

## Technical notes

- All 300 frames uploaded to CDN storage as Lovable Assets (~7 MB total); no binaries added to the repo.
- Sequence renders to a `<canvas>` pinned with `position: sticky`. Frames are preloaded into an `Image[]` array with a progress gate so the animation never stutters on a half-loaded frame; scroll progress maps to a frame index and draws with `requestAnimationFrame`.
- Loading strategy: first frame eager, then batched preload of the rest behind a lightweight loading indicator on the hero.
- Reduced-motion users get a static frame instead of the scroll animation.
- Canvas sized by device pixel ratio and object-fit-cover math so it stays crisp and full-bleed on any viewport; on mobile the sequence is throttled to every 2nd frame to cut memory.
- Design tokens go in `src/styles.css`; page built in `src/routes/index.tsx` with extracted section components.
- Route `head()` gets a product-specific title, description, and og/twitter tags.

No backend needed — the CTA is a link/anchor unless you want real pre-order capture.
