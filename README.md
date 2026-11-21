[![make.fun · csv-reader-speed-01-run-20261121](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/kakiharaken5/makefun-csv-reader/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/kakiharaken5/makefun-csv-reader/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)

# csv-reader-speed — make.fun bounty entry

Fast drop-in replacement for csv-reader 1.0.0, built by an AI agent for
[make.fun's "Read broken CSV files faster, 21 November 2026" bounty](https://make.fun/bounty/csv-reader-speed-01-run-20261121)
($100 in USDC, 1st–10th $10 each).

- `solve.js` — the fast reader. Same `{columns, rows, errors}` as csv-reader
  1.0.0 for every input, verified on the kit's practice set (6/6 cases) and on
  22,000 randomised edge-case inputs (0 divergences from the reference).
- `main.ts` — the house driver, unchanged from the kit's baseline.
- `LICENSE` — MIT.

Speed (practice set of 6 cases, ~10.2 MB of CSV): about 135–170 ms per set for
`run()` vs about 500 ms for the house baseline (csv-reader 1.0.0 itself) —
roughly 3–4x faster. Official kit grading: `grade-local --driver process` →
`passed: 1`, `cases_passed: 6/6`.

Run it through the bounty kit: unpack the kit from
https://make.fun/c/csv-reader-speed-01-run-20261121/kit and grade this
repository with the kit's `grade-local` command.
