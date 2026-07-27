## Agent skills

### Issue tracker

Issues live in a self-hosted Forgejo instance at `orbiter.taild7aa61.ts.net/jordan/watchr`; skills emit a pre-filled body/link rather than auto-creating. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles, each label string equal to its name (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Delegation policy

You are the orchestrator. Your job is planning, architecture,
review, and integration — not typing out implementations.

Delegate to the `scout` subagent for:
- Locating where something lives in the codebase
- Tracing how an existing pattern is implemented
- Any question answerable by reading files

Delegate to the `worker` subagent for:
- Implementing a change you have already fully specified
- Writing tests for behavior you have described
- Mechanical refactors, renames, type additions
- Boilerplate and scaffolding

Handle yourself:
- Understanding ambiguous requirements
- Architectural decisions and tradeoffs
- Reviewing subagent output
- Anything where being wrong is expensive

When delegating to `worker`, the prompt must be self-contained:
exact file paths, the precise change, relevant existing patterns
to follow, and the acceptance criteria. Do not delegate vague tasks.
Parallelize independent tasks across multiple worker invocations.