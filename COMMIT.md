# Commit Guide

Rules for every commit, branch, and pull request an AI agent makes in this repository.

<!-- setup-conventions:generated-start -->

## Commits

- **Signed only.** Commit with `git commit -S` using the GPG key. Before the first commit, confirm `git config gpg.format` is unset or `openpgp` and `git config user.signingkey` names a key listed by `gpg --list-secret-keys`. With no GPG key, or if signing fails, leave the changes uncommitted and tell the user. Never pass `--no-gpg-sign` or disable `commit.gpgsign`.
- **Your lines only.** Other agents edit this working tree in parallel, so stage only the lines this thread changed. Stage whole files only when every change in them is yours; for mixed files, write a patch holding just your hunks and stage it with `git apply --cached <patch>`. Before committing, confirm `git diff --cached` contains your changes and nothing else. Never use `git add -A`, `git add .`, or `git commit -a`.
- **Format:** `<gitmoji>🤖 <message>`, for example `✨🤖 add CSV export to reports page`.
  - `<gitmoji>` is the emoji from [gitmoji.dev](https://gitmoji.dev) that best fits the change; 🤖 marks the commit as AI-made.
  - `<message>` starts lowercase and uses uppercase only where necessary: proper nouns, acronyms, identifiers.

Common gitmojis (full list at [gitmoji.dev](https://gitmoji.dev)):

| Emoji | Change                         | Emoji | Change                       |
| ----- | ------------------------------ | ----- | ---------------------------- |
| ✨    | new feature                    | ♻️    | refactor                     |
| 🐛    | bug fix                        | 🚑️    | critical hotfix              |
| 🩹    | simple non-critical fix        | 🔥    | remove code or files         |
| 📝    | documentation                  | 💡    | source code comments         |
| 🎨    | structure or formatting        | ⚡️    | performance                  |
| 💄    | UI and style files             | 🚸    | user experience              |
| ✅    | add or update tests            | 🧪    | add a failing test           |
| 🔧    | configuration files            | 🔨    | development scripts          |
| ➕    | add a dependency               | ➖    | remove a dependency          |
| ⬆️    | upgrade dependencies           | ⬇️    | downgrade dependencies       |
| 🏷️    | types                          | 🦺    | validation                   |
| 🥅    | catch errors                   | 🔒️    | security or privacy          |
| 🗃️    | database                       | 🚚    | move or rename               |
| 💚    | fix CI build                   | 👷    | CI build system              |
| 🙈    | .gitignore                     | ⚰️    | remove dead code             |
| 💬    | text and literals              | ✏️    | typos                        |
| 🏗️    | architectural change           | 💥    | breaking change              |
| ⏪️    | revert                         | 🔀    | merge branches               |

## Branches

- Name new branches `ai/<short-kebab-description>`, independent of the AI tool.
- **Rename, never fork.** When working on a tool-named branch (`claude/`, `codex/`, `t3code/`), rename it in place with `git branch -m ai/<short-kebab-description>` before the first push or pull request, so no tool-named branch is left behind. `git switch -c` or `git checkout -b` would create a second branch instead.

## Pull Requests

- **Ask first.** Pull request numbers are permanent, so a PR is irreversible. Open one only after the user approves that specific PR in the conversation.
- Open it from the `ai/` branch.
- **Title:** a plain sentence with the first letter capitalized and no emoji, for example `Add CSV export to reports page`.
- **Body:** write it with the `/pr` skill (mattpocock's).
- **Approval** belongs to humans. Leave reviews as comments; never approve a pull request.

<!-- setup-conventions:generated-end -->
