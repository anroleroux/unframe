# unframe

A no-framework single-file web app. The reactivity core and the build's `awk`
composer come from [`unframe-kit`](https://github.com/anroleroux/unframe-kit), vendored
here as a git submodule so the pattern stays in one source of truth.

## Setup

The build reads files from the submodule, so initialize it after cloning:

```bash
git clone https://github.com/anroleroux/unframe
cd unframe
git submodule update --init      # pulls vendor/unframe (the kit)
```

## Build

```bash
make uidev     # strip the online blocks; build the localStorage-only demo
make clean     # remove ui/dist
```

Output is a single static `ui/dist/index.html`.

## Where things live

| Path | Source |
|------|--------|
| `ui/layout.*`, `ui/comps/*` | this repo — the app itself |
| `make/web.map`, `Makefile` | this repo — build wiring |
| `vendor/unframe/runtime/reactivity.js` | submodule — the reactivity core |
| `vendor/unframe/runtime/tpl.mk` | submodule — the `compose` macro |
| `.claude/skills/unframe` | symlink into the submodule's skill |

To move the shared pattern to a newer version:

```bash
cd vendor/unframe && git fetch && git checkout origin/main && cd ../..
git add vendor/unframe && git commit -m "Bump unframe-kit"
```
