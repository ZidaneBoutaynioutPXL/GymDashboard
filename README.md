# Ascend — Training Command Center

A personal Dragon Ball–themed training PWA built with React, TypeScript, Vite, Dexie, Motion, and Recharts. It runs entirely in your browser and stores your data in IndexedDB.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. First launch opens a three-step Dragon Ball onboarding: welcome, athlete profile, and personal lift goals. Returning profiles go straight to the dashboard. No online account is required.

For the installable, offline build:

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

Open http://127.0.0.1:4173. After the first online load, the service worker caches the app, local fonts, character artwork, and comparison data. Use the browser's install action where supported. A deployed PWA needs HTTPS; phone access through an ordinary LAN HTTP address is not a secure PWA context.

## Included

- Overview with power score, big-three total, goals, lift progress, and a saga/XP shortcut.
- Four-chapter training sagas with sequential workout nodes, program snapshots, reflections, block recaps, archives, and undo.
- A customizable training room with 15 starter/unlockable rooms, auras, card frames, and trophies. Earn XP, collect rewards, and equip cosmetics; later rewards extend through 10,000 XP.
- A next-transformation coach on each lift: current/target 1RM, distance to the next form, recent timeline, and editable next-session load/reps/date/increment.
- Six illustrated lift cards: bench, squat, deadlift, overhead press, weighted dip, and weighted pull-up. Opening a card launches a full-screen character entrance with its own procedural effects and rotating character vocals, then reveals rank, comparisons, history, and logging. Skip or cancel with Back/Escape.
- Remove/restore cards without losing logs; delete recorded sets with an Undo action. Card visibility is a device preference and is separate from training backups.
- Latest true/estimated 1RM, personal best, history chart, and individual ranks.
- Eight characters with seven illustrated stages each (56 previews), seven animation styles, and character-specific energy-burst rank-up audio with replay, mute, and volume. Reduced-motion preferences are respected.
- Eight final-rank character cinematics: local moving-character clips, including Legends ink-brush intros, followed by the earned-form card. Skip/replay/mute/volume, load-error recovery, reduced-motion opt-in, and offline playback. Available animated forms can differ from the custom earned form; the clip caption identifies the animation. Trunks and Piccolo currently use action/transformation clips. See `MEDIA.md` and `src/revealClips.json` for sources.
- 96 voiced audio cues: 12 per character, including three rotating entrances and two saved-set variations. Actual matching character vocals with original effects; all work offline.
- Competitor-only streetlifting references, visible athlete counts and per-tier added-weight requirements.
- Automatic lift/FFMI rank reveals followed by Goku when the ultimate rank also rises.
- Editable training days with exercises, sets, reps, and effort targets.
- Searchable notebook with Training, Strength, Nutrition, and Mindset categories.
- Bodyweight, body-fat percentage, and waist check-ins with history.
- Sourced strength and body-fat comparisons by available age, bodyweight, and category cohorts.
- Local persistence, JSON backup export/import, responsive mobile layout, and offline use.

The four-day starter plan is an editable template. Workout logs and notes start empty. There are no accounts or cloud synchronization in this version. Export a backup regularly; importing replaces local data.

## Saga progression and rewards

Open **Training saga** to start a named block from your current training plan. Each of the four chapters (Foundation, Strength Arc, Peak Week, Test Day) contains one full rotation of that plan. These are narrative chapter names; the app does not automatically prescribe a peak, deload, or max attempt. The saga copies your program at creation, so later edits affect the next saga. Check off exercises you completed and enter the workout date/reflection to advance. This is self-reported program completion, separate from logged lifting records.

Each completed workout grants 100 cosmetic XP. Each completed chapter grants another 150 XP; a full saga grants another 500 XP. There is one rewarded workout per calendar day, in chronological order, and no streak penalty for rest days. Each 500 XP adds an adventurer level. Repeated submissions cannot grant duplicate XP. Undo removes the last workout from the current saga and recalculates XP/reward eligibility; equipped items that become locked return to defaults. Previously collected items become available again when their requirements are met. Claimed trophies require their milestone to remain eligible.

The **Training room** lets you collect unlocked rewards and equip rooms, auras, and frames. Frames also appear on the lift collection. Fighter choice, cosmetics, progression, and coach plans persist locally and are included in backup version 2. Version 1 backups remain supported; importing one resets progression because it has no progression data. The IndexedDB upgrade preserves existing training data. No cosmetic reward changes a lift rank or creates a lifting record.

The coach uses your existing rank thresholds and latest recorded set. Its increment button adds your chosen increment to the last working weight; the displayed planned 1RM uses the usual formula, including bodyweight for weighted lifts. Plans remain separate from actual logs. There is no predicted unlock date or automatic readiness assessment.

## Calculation rules

For one rep, the entered load is the true 1RM. For multiple reps, the app estimates 1RM with `load × (1 + reps / 30)`. For dips and pull-ups it applies that formula to bodyweight plus added weight, then subtracts bodyweight to display the estimated added load. High-rep estimates are less precise.

The latest result is selected by training date, then save time. Personal best is the maximum 1RM across all logged sets. Barbell game ranks use the bodyweight thresholds in `src/strength.ts`. Streetlifting ranks use pooled competitor ratio percentiles P10/P25/P50/P75/P90/P97.5, scaled to profile bodyweight and rounded up to 1.25 kg. These unlocks are separate from the band-specific comparison percentile. Bench: Vegeta; squat: Broly; deadlift: Future Trunks; OHP: Piccolo; dip: Gohan; pull-up: Frieza. Some stages represent different poses/power levels within the same form.

**FFMI / Cell:** raw FFMI = `bodyweight × (1 − bodyFat / 100) / (heightCm / 100)²`. Uses the current profile, without height normalization. Missing body fat leaves FFMI unranked. The custom open milestones are 17, 19, 21, 23, 25, 27; the women's track uses 14, 15.5, 17, 18.5, 20, 22. These are game milestones, not health targets, population percentiles, or an inference about drug use. [FFMI formula reference](https://pubmed.ncbi.nlm.nih.gov/7496846/).

**Ultimate / Goku:** six lifts plus FFMI each contribute exactly 1/7. Each component scores `(rankIndex + fractionalProgressToNextTier) / 6 × 100`, capped at 100. Missing inputs score zero and coverage is displayed. The seven Goku stages span Base to Ultra Instinct; the final stage requires every component at 100. Previewing forms does not change data or unlock a tier.

The big-three total sums the latest squat, bench and deadlift 1RMs once all three are logged. Power level remains a separate volume-free strength score: `100 × sum(latest 1RM / current profile bodyweight)` across all six lifts. Dips and pull-ups use added load for rank and global comparison. Their metric panel also shows total estimated system load and added load divided by session bodyweight. Sound preference is stored locally in localStorage, separately from training backups.

## Reference data

**Streetlifting competitors:** [OpenStreetlifting](https://openstreetlifting.org/), 41 eligible meets, 636 men and 149 women in the pooled sample. One best successful ratio per named competitor/lift/cohort. Excludes disqualified results, missing bodyweights, recovered bodyweights, and future events. Use a sex-specific 10 kg band with 30+ athletes; otherwise visibly fall back to pooled bodyweight ratios. No age matching is implied. See [STREETLIFTING_RESEARCH.md](STREETLIFTING_RESEARCH.md) for provenance, thresholds, filtering and limitations. Rebuild with `python scripts/build_street.py` (requests and tomli).

**Trained barbell lifters:** [Strength Level](https://strengthlevel.com/strength-standards), bodyweight-specific male/female kg tables for bench press, squat, deadlift and shoulder press. Snapshot retrieved 23 September 2026; each card links its source and cutoff date. Linear interpolation between bodyweight rows and percentile anchors (5, 20, 50, 80, 95); tails stay below 5th or above 95th without extrapolation. Bodyweight outside the source range, age below 18, and unsupported/unset sex categories return unavailable. This compares community lifters, not all people worldwide, and is not age-adjusted. The archived dip/pull-up tables are retained for reproducibility but the UI uses competition data instead. Rebuild with `python scripts/build_global.py` (requests and beautifulsoup4).

**Age-matched competition strength:** [OpenPowerlifting public data](https://openpowerlifting.gitlab.io/opl-csv/), revision `openpowerlifting-2026-09-19-ed07773f`. The bundled curves use raw SBD competition results, grouped by competition category, age band, and 10 kg bodyweight band. Each named competitor contributes their best result within each cohort. Missing age/bodyweight records are excluded; cohorts need at least 30 competitors. Percentiles interpolate between 5-percentile quantiles. Gym estimates and competition singles are not directly equivalent, so results are marked approximate.

**Body fat:** [CDC NHANES 2017–2018 DXA documentation](https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2017/DataFiles/DXX_J.htm). `DEMO_J`, `BMX_J`, and `DXX_J` are joined on SEQN. The curves use total percent fat (DXDTOPF), examination weights (WTMEC2YR), sex, age bands, and 20 kg bodyweight bands. At least 25 valid scans are required. This is a descriptive DXA reference, subject to sampling and scan nonresponse limitations, not a health score. Home measurement methods differ. Adult comparisons are available only through age 59 and only for cohorts present in the source.

To rebuild reference files, download the original datasets into `tmp/` and run `scripts/build_benchmarks.py` and `scripts/build_body_reference.py`. The latter requires Python pandas. The app itself needs no Python or network access to calculate comparisons.

## Verification

```sh
npm run build
npm run lint
npm run test:migration
npm run test:progression
npm run test:progression-offline
npm run test:characters
npm run test:experience
npm run test:smoke
npm run test:ranks
npm run test:cinematic
npm run test:offline
```

The smoke test expects the dev server on port 5173. The offline test expects the production preview on port 4173. Both use headless Chrome at its standard Windows installation path and isolated browser contexts; they do not alter your normal browser data. `BASE_URL` can override the server URL.

Experience tests cover first-run onboarding, required fields, back navigation, returning profiles, card opening, logging, delete/undo, remove/restore, mobile layout, reduced motion, and cancelled transitions.

Smoke coverage includes profile edits, lift calculations, same-day latest versus best, weighted pull-ups, automatic rank reveals, the big-three total, notebook creation/filtering, program edits, body check-ins, reference cohorts, backup round trip, persistence, and mobile navigation. The offline test verifies the service worker, manifest, cached artwork/pages, and offline note writes across a reload. Screenshots are written to `tmp/`.

Rank tests use the dev server on 5173 and verify FFMI, weighted formulas, missing/full ultimate inputs, global table anchors and bounds, all 56 previews, seven effect classes, sound mute/replay/persistence, and mobile overflow. Offline coverage fetches all eight character atlases with networking disabled.

Character tests verify all six voiced entrances, eight final character videos with embedded scene audio, 96 unique credited cue files, mute/volume/replay/cancellation, reduced motion and mobile. Final reveals play their embedded soundtrack without a second character cue. The offline test decodes all eight videos and all 96 character cues with networking disabled.

Progression tests exercise all four chapters, reward bonuses, duplicate/date guards, undo/replay, all 15 reward requirements, cosmetic effects, coach calculations, snapshots and archives, migration, validated backup round trips, mobile, and offline creation/claim/equip/planning.

## Files

- `src/CharacterStage.tsx`, `src/FinalFormReveal.tsx`, `src/LiftEntrance.tsx`, `src/characterExperience.css`: character scenes and entrances.
- `src/characterAudio.json`: exact audio source and hash manifest.
- `src/gameTypes.ts`, `src/progression.ts`: progression schema, validation, XP, reward eligibility and transactional mutations.
- `src/ProgressionPages.tsx`, `src/CoachPanel.tsx`, `src/progression.css`: saga map, room, vault, and lift planning.
- `src/App.tsx`: application shell and navigation.
- `src/Onboarding.tsx`, `src/LiftDeck.tsx`, `src/experience.css`: first-run setup and animated lift collection.
- `src/Pages.tsx`, `src/Modals.tsx`: training views and editors.
- `src/Comparisons.tsx`, `src/benchmarks.ts`: reference displays and cohort matching.
- `src/data.ts`: IndexedDB schema, starter template, validated backup import/export.
- `src/strength.ts`: 1RM, rank, and score calculations.
- `src/ranks.ts`, `src/RankUI.tsx`, `src/ranks.css`, `src/sound.ts`: character progression, FFMI/ultimate scoring, animation and audio.
- `src/global.ts`, `src/globalBenchmarks.json`: six-lift community benchmarks.
- `src/App.css`: responsive theme and transformation effects.
- `ARTWORK.md`: generated character asset paths, generation mode, and final prompt.
- `CHARACTER_ART.md`: built-in imagegen prompts and saved paths for all eight new character atlases in `public/characters/`.
- `MEDIA.md`: actual video/vocal sources, edits, original sound generation, and final media paths.
- `src/street.ts`, `src/StreetPanel.tsx`, `src/streetBenchmarks.json`: competition comparisons and per-tier streetlifting goals.
