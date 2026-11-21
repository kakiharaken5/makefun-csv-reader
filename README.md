# csv-reader-speed — make.fun bounty entry

Faster drop-in for make.fun's csv-reader 1.0.0 ("Read broken CSV files faster,
21 November 2026", $100, 1st–10th $10 each).

- `solve.js` — the fast reader. Same `{columns, rows, errors}` as csv-reader
  1.0.0 for every input, verified on the kit's practice set (6/6 cases) and on
  22,000 randomised edge-case inputs (0 divergences from the reference).
- `main.ts` — the house driver, unchanged from the kit's baseline.
- `LICENSE` — MIT.

Speed (this machine, practice set of 6 cases, ~10.2 MB of CSV):
about 135–170 ms per set for `run()` vs about 500 ms for the house baseline
(csv-reader 1.0.0 itself) — roughly 3–4x faster. Official kit grading:
`grade-local --driver process` → `passed: 1`, `cases_passed: 6/6`.

## Still needed before submitting (deadline 2026-11-23 11:42 JST)

1. A Solana wallet, created and held by the user (the payout wallet).
2. A public GitHub repository created after the bounty opened
   (2026-11-21 02:42 UTC), containing these files plus
   `.makefun/owner.json` with `{"wallet": "<base58 address>"}`.
   GitHub About: description naming make.fun, homepage
   https://make.fun/bounty/csv-reader-speed-01-run-20261121, topic `makefun`.
3. Submit with the kit CLI before the deadline:
   `node cli/makefun.mjs submit --competition csv-reader-speed-01-run-20261121
   --repo-url <url> --commit <sha> --title "..." --keypair <wallet.json>`
   from inside the unpacked kit. No transcripts are required for this
   bounty (all transcript checks are `applies: false` in its requirements),
   so an entry without a transcript bundle is still prize-eligible.

Kit: https://make.fun/c/csv-reader-speed-01-run-20261121/kit
Bounty: https://make.fun/bounty/csv-reader-speed-01-run-20261121
