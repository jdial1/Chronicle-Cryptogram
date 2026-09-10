# Palette's Journal

## 2026-09-10 - The Primer coach loses its rail and its copy on a phone

**Learning:** `.primer-coach-rail` and `.primer-coach-copy` are both `display: none`
under `@media (max-width: 767px)` (src/styles/paper.css). On a phone the entire
Five Tells panel collapses to one line: the tell number and its title. Anything a
player needs from that panel on mobile — state, progress, an affordance — has to
live in the card's header row, because the rail (prev/next, "N of 5") and the body
copy are simply not there. That is also why the panel's found/not-found state was
carried by card colour alone: on desktop the copy softens it, on mobile the colour
was the whole message.

**Action:** Before adding anything to `PrimerCoach`, check it against the 767px
rule. If it belongs in the rail or the copy, a phone player will never see it.
Put state signals in the header row and let them wrap (`flex-wrap` + `ml-auto`),
since the tell titles run long ("Attack the Single-Letter Words First").
