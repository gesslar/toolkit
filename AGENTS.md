# Repository Guidelines

## Project Structure & Module Organization

Source lives in `src/`; `index.js` re-exports the primary classes under `src/lib/`, while matching `.d.ts` definitions sit in `src/types/` for downstream TypeScript users. Unit specs and supporting fixtures reside under `tests/` (`tests/unit/*.test.js`, `tests/helpers/`, `tests/fixtures/`). Use the `work/` sandbox for scratch scripts and never commit long-lived artifacts from it.

## Build, Test, and Development Commands

Run `npm run lint` before sending changes; `npm run lint:fix` applies safe autofixes when spacing allows. Execute `npm test` (alias `npm run test:unit`) to run the Node 20+ native test suite. `npm run update` refreshes dependencies via npm-check-updates—reserve it for coordinated maintenance PRs. Publishing scripts (`npm run submit`) are owner-only; avoid them unless you coordinate with the maintainer.

## Coding Style & Naming Conventions

Follow the ESLint setup in `eslint.config.js`: two-space indentation, no semicolons, double quotes, and arrow functions without forced parentheses. Control statement keywords intentionally hug their parentheses (`if(`, `for(`); do not "fix" that spacing. Public exports must carry JSDoc blocks with explicit types, and helper files should mirror class casing (e.g., `Glog.js`, `Glog.test.js`). Review `CODE_FORMATTING_RULES.md` before proposing stylistic tweaks.

## Testing Guidelines

Tests rely on Node's built-in `node --test`; place new specs beside the feature with the pattern `Name.test.js`. Reuse shared data from `tests/fixtures/` and custom assertions in `tests/helpers/` instead of redefining utilities. When changing behavior, add the smallest deterministic test that demonstrates the new contract and confirm the full suite passes locally. Document any skipped tests in the PR discussion with a justification.

## Commit & Pull Request Guidelines

History mixes Conventional Commit prefixes (`fix:`) and short imperative headlines; match the dominant style of your change (`feat:`, `fix:`, `chore:`) or keep it crisp and action-oriented. Group related edits per commit and include context in the body when behavior shifts. PRs should link issues when relevant, outline testing evidence, and call out breaking or risky scenarios. Screenshots are unnecessary, but shell transcripts or sample outputs help reviewers verify CLI-facing updates.

## Documentation & Working Notes

If you add terminology or workflows, cross-reference `TERMINOLOGY.txt`, `TESTING.txt`, or `WIRE_UP_AND_TESTING.md` so contributors can discover the rationale. Prefer short Markdown notes in `docs/` or `work/` (ignored by lint) and clean them up before merge. Keep AGENTS.md current whenever the repository structure or lint rules evolve.
