# How This Repo Works

This repo is not just sample code. It ships the knowledge and behavior the agent should use while working in it.

Repo owners can commit rules, notes, lessons, topics, and triggers alongside the code. When Pi runs with `pi-brains`, it can discover that context and apply it before acting.

## Why This Matters

Most agents start from a prompt and then search the repo. This repo shows another pattern: the repo can tell the agent what matters.

That means a repo owner can ship:

- conventions the agent should follow
- file formats the agent should understand
- risky files the agent should treat carefully
- lessons learned from previous work
- triggers that warn, block, or run checks around tool actions

## What Is In This Repo

```text
.gitsense/
  rules/          Rules and trigger scripts the agent can apply
  notes/          Project context the agent can query
  topics/         Topics used to organize knowledge
config/           Protected config demo
data/accounting/  Ledger note demo
src/generated/    Generated file warning demo
src/parallel/     Parallel trigger demo
third_party/      AI provenance demo
docs/pi/          Pi hands-on guide
docs/testing/     Testing notes
```

## The Pattern

1. The repo ships code plus GitSense knowledge.
2. The agent starts in the repo.
3. `pi-brains` connects Pi to GitSense.
4. Pi can discover rules, notes, lessons, and triggers.
5. Pi applies the right context when the task calls for it.

The result is not that the agent stops reading source. The result is that the repo gives the agent a better starting point.
