# LEVCHIN: contribution rules

- This is a static brand showcase, not yet an online shop. Preserve the buildless HTML/CSS/JS architecture unless a concrete need justifies a migration.
- Read the current files and Git diff before editing. Never undo unrelated work.
- Preserve Montserrat, the black background, the supplied curtain and the existing editorial copy/translations.
- Do not invent products, testimonials, investors, certifications, commercial results or manufacturing evidence.
- Avoid generic UI decoration: floating section cards, pills, shadows, gradient blobs, excessive motion and ornamental counters.
- Keep global styles in styles.css; Histoire layout belongs in histoire-responsive.css. Edit the owning rule instead of appending competing overrides.
- Histoire has exactly eight slides. Header belongs only to slide 1; footer is outside the count. Slides 2, 5 and 8 are full-screen splits. Slide 3 is text-only; histoire3 belongs to slide 4. Do not restore the obsolete shared-image layout.
- Histoire image frames are intentionally #40434A while data-story-preview is present. Do not generate substitute photos or remove this preview flag before final photos are approved.
- Public service configuration lives in site-config.js. Never put credentials in client-side files. Never display a successful subscription or message delivery without an actual service response.
- Keep existing nine-language content and language-change behavior intact.
- Test all six pages at representative widths from 320 to 1920 pixels, portrait and landscape. Test translations, keyboard navigation, reduced motion and storage denied. For Histoire also test all eight steps and footer access.
- Do not claim testing on physical devices or browser engines that were not actually tested.
- Do not publish, commit, push or activate a paid service unless requested.
- Finish code work with: Summary GitHub Desktop : ...
