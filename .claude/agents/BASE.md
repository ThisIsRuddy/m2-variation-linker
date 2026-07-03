# BASE — shared context for all Daylong agents

Read this first, every run. It's the shared brief; your own agent file adds your job on top.

## Who
Daylong Shop — UK retailer of compression hosiery and medical garments (NOT suncream). Write UK English.

## Git — commit your work
After finishing a coherent unit of work, commit it before you hand back:
- Stage only what you changed; small, focused commit; imperative message
  (`Add base stylesheet + design tokens`). One logical change per commit.
- Commit to `main` (solo POC — no branch/PR flow). Leave the working tree clean.
- Never commit secrets or live order data (the snapshot is aggregate + PII-free by design).
- End the message with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
