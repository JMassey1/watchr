# Issue tracker: Forgejo (self-hosted)

Issues and PRDs for this repo live in the **Forgejo** issue tracker at:

> `https://orbiter.taild7aa61.ts.net/jordan/watchr/issues`

Forgejo is a Gitea fork and exposes a Gitea-compatible REST API, but there is **no first-party CLI** (`gh`/`glab` don't talk to it). The default workflow is therefore **manual via the web UI**: a skill composes a ready-to-paste title + body and hands it to you, rather than auto-creating the issue.

## Conventions

- **Create an issue**: open the web UI "New issue" page and paste the title + body the skill produced. (Forgejo supports `?title=...&body=...` query params on the new-issue URL for a one-click pre-fill — a skill may emit that link.)
- **Read an issue**: open it in the web UI. For automation, `curl -H "Authorization: token <TOKEN>" https://orbiter.taild7aa61.ts.net/api/v1/repos/jordan/watchr/issues/<n>` (Forgejo/Gitea REST API).
- **List issues**: web UI, or `curl .../api/v1/repos/jordan/watchr/issues?state=open&type=issues`.
- **Comment / label / close**: web UI, or the corresponding `api/v1/repos/jordan/watchr/issues/<n>` endpoints (`POST .../comments`, `PATCH .../labels`, `PATCH .../issues/<n>` with `state=closed`).
- **PRs**: Forgejo PRs are issues with a `pull_request` field. One number space covers both, so a bare `#42` may be either — resolve via the web UI or the API's `pull_request` field.

The tracker instance is on a Tailscale tail (`orbiter.taild7aa61.ts.net`), so any CLI/`curl` automation requires Tailscale connectivity + a personal access token from `https://orbiter.taild7aa61.ts.net/user/settings/applications`.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the API `pull_request` endpoints (`api/v1/repos/jordan/watchr/pulls/<n>`).

## When a skill says "publish to the issue tracker"

Emit a complete issue body (title + markdown body, ready to paste) and the pre-filled new-issue URL. Don't call the API unless the user has provided a token and asked for automation. Let the user click "Submit".

## When a skill says "fetch the relevant ticket"

Either open the issue in the web UI, or — if a token is configured in the environment — `curl .../api/v1/repos/jordan/watchr/issues/<n>` and parse the JSON.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. Create via web UI with that label.
- **Child ticket**: an issue with `Part of #<map>` at the top of its body and a back-link added to the map's task list. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: no native issue dependencies in Forgejo's stable tracker workflow by default — use a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed. (If the instance has the dependencies feature enabled, use `api/v1/repos/jordan/watchr/issues/<n>/dependencies`.)
- **Frontier query**: list the map's open children (web UI or API), drop any with an open `Blocked by` entry or an assignee; first in map order wins.
- **Claim**: assign the issue to yourself in the web UI — the session's first write.
- **Resolve**: comment the answer on the child issue, close it, then append a context pointer (link) to the map's Decisions-so-far.
