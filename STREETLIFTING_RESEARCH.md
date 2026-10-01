# Streetlifting rank reference

The former Strength Level comparison was already a community-lifter reference, but it did not specifically identify trained streetlifting competitors. The new dip/pull-up reference uses completed competition results from [OpenStreetlifting](https://openstreetlifting.org/), whose [CC0 data archive](https://github.com/openstreetlifting/openstreetlifting) preserves original event sources.

Pinned commit: `20bf41230c05aebf8c7c0032254c60ad823c3ad4`. Event cutoff: 2026-09-23. The bundled reference includes 41 meets with eligible data, including open and national events rather than only world championships. Original event source URLs remain in `src/streetBenchmarks.json`.

Method: exclude no-shows and disqualified results, missing bodyweight, and bodyweights recovered mathematically from RIS. Use positive best successful added loads. Within each sex/cohort/lift, retain the best added-load/bodyweight ratio per normalized name, country and disambiguation field. Names can imperfectly identify people; this is a sample, not a complete worldwide census. The pooled sample has 636 men and 149 women for each lift. Require at least 30 athletes for a 10 kg band; otherwise visibly fall back to the pooled ratio distribution. Do not infer age-adjusted percentiles: age is not available consistently. Federations and allowed grip/equipment vary.

Character rank goals use the **pooled** sex-specific P10, P25, P50, P75, P90 and P97.5 ratio quantiles, multiplied by profile bodyweight and rounded up to 1.25 kg. Base is below P10. Using a pooled ratio for game goals avoids sudden changes when crossing a bodyweight-band boundary. The comparison percentile uses the narrower band when available and states its athlete count. Goal percentile and comparison percentile can consequently differ.

Example: 80 kg man, added load:

| Milestone | Dip | Pull / chin-up |
|---|---:|---:|
| P10 | 68.75 kg | 47.5 kg |
| P25 | 85 kg | 56.25 kg |
| P50 | 101.25 kg | 65 kg |
| P75 | 117.5 kg | 75 kg |
| P90 | 132.5 kg | 86.25 kg |
| P97.5 | 146.25 kg | 98.75 kg |

These thresholds deliberately make a good gym lift an early streetlifting tier. They are not prescribed training targets, official federation classifications, or estimates of how an average person performs. Gym Epley estimates do not enforce competition judging.

Cross-checks: [FinalRep's German Open 2025 report](https://final-rep.com/german-open-2025-a-new-era-for-streetlifting-in-germany/) reports a top -101 kg male athlete at +112.5 kg pull-up and +180 kg dip. [USA Streetlifting's 2025 national scoresheet](https://usastreetlifting.org/wp-content/uploads/2025/05/Nationals-2025-Scoresheet-Copy-of-Day-2-Flight-D.pdf) records bodyweights, attempts and best lifts. Those sources establish the competition context; the app thresholds come from the full eligible archive sample, not those standout results.

Rebuild: `python scripts/build_street.py` (requests, tomli). Output: `src/streetBenchmarks.json`. Dataset filtering and quantiles are explicit in the script. Barbell comparisons continue to use the trained-lifter Strength Level reference, with separate age/bodyweight-matched OpenPowerlifting competition results for SBD.
