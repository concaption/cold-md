#!/usr/bin/env bash
# cold.md installer
# Usage:
#   curl -fsSL https://cold.md/install | bash
#   curl -fsSL https://cold.md/install | bash -s -- --with-foxreach
#   curl -fsSL https://cold.md/install | bash -s -- --scaffold
#
# What it does:
#   1. Installs the cold-outreach Claude Code skill to ~/.claude/skills/
#   2. Optionally scaffolds a cold.md in the current directory
#   3. Optionally installs the FoxReach plugin (with --with-foxreach)
#
# Safe to re-run (idempotent).
# Source: https://github.com/concaption/cold-md

set -euo pipefail

REPO_TARBALL="https://github.com/concaption/cold-md/archive/refs/heads/main.tar.gz"
SKILL_DIR="${HOME}/.claude/skills"
PLUGIN_DIR="${HOME}/.claude/plugins"
TMPDIR="$(mktemp -d -t cold-md-install.XXXXXX)"
trap 'rm -rf "$TMPDIR"' EXIT

WITH_FOXREACH=false
SCAFFOLD=false
QUIET=false

for arg in "$@"; do
  case "$arg" in
    --with-foxreach) WITH_FOXREACH=true ;;
    --scaffold) SCAFFOLD=true ;;
    --quiet) QUIET=true ;;
    --help|-h)
      sed -n '2,11p' "$0"
      exit 0
      ;;
  esac
done

log() { [ "$QUIET" = true ] || printf "  %s\n" "$*"; }
ok()  { [ "$QUIET" = true ] || printf "  \033[32m\xE2\x9C\x93\033[0m %s\n" "$*"; }
warn(){ printf "  \033[33m\xE2\x9A\xA0\033[0m %s\n" "$*" >&2; }
die() { printf "  \033[31m\xE2\x9C\x97\033[0m %s\n" "$*" >&2; exit 1; }

banner() {
  [ "$QUIET" = true ] && return
  cat <<'EOF'

   ┌──────────────────────────────────────────────┐
   │  cold.md  -  your cold outreach, in one file │
   │  https://cold.md  -  installer v0            │
   └──────────────────────────────────────────────┘

EOF
}

check_deps() {
  for dep in curl tar; do
    command -v "$dep" >/dev/null 2>&1 || die "missing required tool: $dep"
  done
}

fetch_repo() {
  log "Downloading cold-md..."
  curl -fsSL "$REPO_TARBALL" | tar -xz -C "$TMPDIR"
  EXTRACTED="$(find "$TMPDIR" -maxdepth 1 -type d -name 'cold-md-*' | head -1)"
  [ -n "$EXTRACTED" ] || die "failed to extract repo"
}

install_skill() {
  mkdir -p "$SKILL_DIR"
  local src="$EXTRACTED/skill/cold-outreach"
  local dest="$SKILL_DIR/cold-outreach"
  if [ -d "$dest" ]; then
    log "Updating cold-outreach skill at $dest"
    rm -rf "$dest"
  else
    log "Installing cold-outreach skill to $dest"
  fi
  cp -R "$src" "$dest"
  ok "cold-outreach skill installed"
}

install_foxreach_plugin() {
  mkdir -p "$PLUGIN_DIR"
  local src="$EXTRACTED/plugin/foxreach"
  local dest="$PLUGIN_DIR/foxreach"
  if [ -d "$dest" ]; then
    log "Updating FoxReach plugin at $dest"
    rm -rf "$dest"
  else
    log "Installing FoxReach plugin to $dest"
  fi
  cp -R "$src" "$dest"
  ok "FoxReach plugin installed"
  if [ -z "${FOXREACH_API_KEY:-}" ]; then
    warn "FOXREACH_API_KEY not set. Get a free key at https://foxreach.io/signup, then:"
    printf "    export FOXREACH_API_KEY=fr_...\n" >&2
  fi
}

maybe_scaffold() {
  if [ -f "./cold.md" ]; then
    log "cold.md already exists in this directory - skipping scaffold."
    return
  fi
  if [ "$SCAFFOLD" = true ]; then
    cp "$EXTRACTED/examples/minimal.cold.md" "./cold.md"
    ok "Scaffolded ./cold.md from the minimal template"
  else
    log "No ./cold.md in this directory. Run with --scaffold to start one, or see https://cold.md"
  fi
}

print_next_steps() {
  [ "$QUIET" = true ] && return
  cat <<EOF

  ─────────────────────────────────────────────
  Next:

    1. Edit ./cold.md for your product (or run with --scaffold to start one).
    2. In Claude Code: "draft an opener for [Name], [Title] at [Company]"
       The cold-outreach skill will read cold.md and obey the spec.

EOF
  if [ "$WITH_FOXREACH" = true ]; then
    cat <<EOF
    3. FoxReach plugin installed. Try: /cold draft [Name], [Company]
       Run at scale: /cold send ./leads.csv  (needs FOXREACH_API_KEY)

    Dashboard: https://foxreach.io/app
EOF
  else
    cat <<EOF
    Want to run it at scale? The FoxReach plugin adds multi-inbox warmup,
    reply triage, and booked-calls orchestration:

      curl -fsSL https://cold.md/install | bash -s -- --with-foxreach

    https://foxreach.io
EOF
  fi
  echo
}

main() {
  banner
  check_deps
  fetch_repo
  install_skill
  if [ "$WITH_FOXREACH" = true ]; then
    install_foxreach_plugin
  fi
  maybe_scaffold
  print_next_steps
}

main "$@"
