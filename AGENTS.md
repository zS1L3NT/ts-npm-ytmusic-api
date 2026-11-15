- Code style lives in `STYLE.md`: read it before writing code, and add new style rules there.
- Commit, branch, and pull request rules live in `COMMIT.md`: read it before any commit, branch, or PR.

## Commands

- `bun install --frozen-lockfile`: install dependencies.
- `bun run lint`: type check and Biome check. `bun run lint:fix` applies formatting.
- `bun run test:coverage`: offline unit tests with the coverage thresholds that CI enforces.
- `bun run test:live`: tests against the real YouTube Music. Set `YTMUSIC_COOKIES` to a Cookie header to run them signed in.
- `bun run build && bun run test:package`: build and check the CommonJS and ES module exports.

## Verification

- YouTube Music changes its responses without notice, and offline fixtures cannot show that. After changing a parser or a request, run `bun run test:live` and compare the parsed output with the raw response.
- Never print, log or commit cookies. Read them from `YTMUSIC_COOKIES` only.
