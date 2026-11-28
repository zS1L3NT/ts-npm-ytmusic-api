# Commit Guide

Rules for every commit, branch, and pull request an AI agent makes in this repository.

<!-- setup-conventions:generated-start -->

## Explicitness

Branches and pull requests change what the user has to review, so act on them only when the user says so explicitly, or after you ask directly and get an explicit yes. A request to commit, push, prepare, or run CI is not a request for a new branch or pull request. When unsure, ask.

Pull requests are the costlier mistake: a PR number is permanent and cannot be taken back. A wrong branch is cheap to fix, until a pull request is opened from it.

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

- **Descriptive `ai/` name.** Name branches `ai/<short-kebab-description>` after the feature or fix, independent of the AI tool. Never leave a branch named after an issue number (such as `ai/issue-63`): if you only have the issue number when the branch is created, rename it once you load the issue into context, before pushing or opening a pull request.
- **Rename, never fork.** When renaming a tool-named branch (`claude/`, `codex/`, `t3code/`) or an issue-number branch, rename it in place with `git branch -m ai/<short-kebab-description>` before the first push or pull request, so no extra branch is left behind. `git switch -c` or `git checkout -b` would create a second branch instead.
- **Stay on the thread's branch.** Follow-up work in a thread is committed to that thread's branch, including work handed to delegates. Branch off it only when the user explicitly asks; otherwise ask first.
- **Branch from `main`.** A new branch starts from `main` unless the user explicitly asks for a branch based on another one, for example a large sub-feature with its own review.

## Pull Requests

- **Explicit only.** Open a pull request only when the user explicitly asks for one, or after you ask directly and the user explicitly confirms that specific PR. The same applies to closing, retargeting, or stacking one.
- **Target `main`.** A pull request targets `main` unless the user explicitly approves a stacked PR.
- Open it from the `ai/` branch.
- **Title:** a plain sentence with the first letter capitalized and no emoji, for example `Add CSV export to reports page`.
- **Body:** write it with the `/pr` skill (mattpocock's).
- **Approval** belongs to humans. Leave reviews as comments; never approve a pull request.

### PR Evidence

- **UI changes** need before and after screenshots. **Motion or timing changes** also need a short before and after video.
- **Upload evidence to GitHub.** Open the pull request first, because the upload goes through its comment box. Then upload the files and edit the body. With the `pr-evidence` skill installed, upload through it. Without it, drop the files into the pull request's comment box in a signed-in browser, copy the `https://github.com/user-attachments/assets/…` URLs, discard the unsent comment, and put the URLs in the body.
- **Never commit evidence.** Screenshots, videos, and other assets that only the pull request needs stay out of the repository, including `.github/pr-assets/`.
- **One block per feature.** Under `## Evidence`, add one `<details>` block for each feature or part that changed. Open the first block (`<details open>`) and leave the rest closed.
  - **Summary line:** the feature name in bold, then the tags that apply: `screenshots`, `motion`, `new` (no before state).
  - **First line:** the route, the data state, and the theme the evidence shows.
  - **Screenshots:** a Before | After table with one row per viewport: Desktop (1280×800) and Mobile (390×844). Both sides of a row use the same route, data, theme, and crop. Add a Dark row only when the change depends on the theme. For new UI, write `—` in the Before cell.
  - **Motion:** a Before clip and an After clip, stacked, each with a one-line caption naming the interaction. Use MP4 clips of 10 seconds or less at the same viewport. Put each video URL on its own line, never inside a table, or GitHub shows a link instead of a player.
  - **Blank lines:** leave one after `</summary>` and one before `</details>`, or GitHub shows the Markdown inside as raw text.

Repeat this block for each feature:

````markdown
<details open>
<summary><b>Settings form saves on blur</b> · screenshots · motion</summary>

`/settings` · seeded account · light

#### Screenshots

<table>
  <tr><th></th><th>Before</th><th>After</th></tr>
  <tr>
    <td><b>Desktop</b></td>
    <td><img src="https://github.com/user-attachments/assets/…" width="480"></td>
    <td><img src="https://github.com/user-attachments/assets/…" width="480"></td>
  </tr>
  <tr>
    <td><b>Mobile</b></td>
    <td><img src="https://github.com/user-attachments/assets/…" width="240"></td>
    <td><img src="https://github.com/user-attachments/assets/…" width="240"></td>
  </tr>
</table>

#### Motion

**Before** · edit a field and tab away

https://github.com/user-attachments/assets/…

**After** · edit a field and tab away

https://github.com/user-attachments/assets/…

</details>
````

<!-- setup-conventions:generated-end -->
