#!/usr/bin/env bash
# cold.md installer
# Usage:
#   curl -fsSL https://cold.md/install | bash                       # full install (FoxReach plugin included)
#   curl -fsSL https://cold.md/install | bash -s -- --scaffold      # also drop ./cold.md in the current repo
#   curl -fsSL https://cold.md/install | bash -s -- --skills-only   # skip the FoxReach plugin
#
# What it does:
#   1. Installs the full skill suite + FoxReach plugin to ~/.claude/ (default).
#   2. Optionally scaffolds ./cold.md from the minimal template.
#   3. --skills-only installs just the open skills, no FoxReach plugin.
#
# Safe to re-run (idempotent).
# Source: https://github.com/concaption/cold-md

set -euo pipefail

REPO_TARBALL="https://github.com/concaption/cold-md/archive/refs/heads/main.tar.gz"
SKILL_DIR="${HOME}/.claude/skills"
PLUGIN_DIR="${HOME}/.claude/plugins"
TMPDIR="$(mktemp -d -t cold-md-install.XXXXXX)"
trap 'rm -rf "$TMPDIR"' EXIT

WITH_FOXREACH=true   # default: install FoxReach plugin
SCAFFOLD=false
QUIET=false

for arg in "$@"; do
  case "$arg" in
    --with-foxreach) WITH_FOXREACH=true ;;                # explicit, same as default
    --skills-only|--without-foxreach|--no-foxreach) WITH_FOXREACH=false ;;
    --scaffold) SCAFFOLD=true ;;
    --quiet) QUIET=true ;;
    --help|-h)
      sed -n '2,12p' "$0"
      exit 0
      ;;
  esac
done

log() { [ "$QUIET" = true ] || printf "  %s\n" "$*"; }
ok()  { [ "$QUIET" = true ] || printf "  ${GREEN}\xE2\x9C\x93${RESET} %s\n" "$*"; }
warn(){ printf "  ${YELLOW}\xE2\x9A\xA0${RESET} %s\n" "$*" >&2; }
die() { printf "  ${RED}\xE2\x9C\x97${RESET} %s\n" "$*" >&2; exit 1; }

# Color setup. Honors NO_COLOR and non-tty output.
if [ -n "${NO_COLOR:-}" ] || [ ! -t 1 ]; then
  ORANGE=""; WHITE=""; DIM=""; GREEN=""; YELLOW=""; RED=""; BOLD=""; RESET=""
else
  # Rust-orange #C2410C via 24-bit true-color. Falls back to 256-color 166 if needed.
  ORANGE=$'\033[38;2;194;65;12m'
  WHITE=$'\033[38;2;250;247;242m'
  DIM=$'\033[38;5;244m'
  GREEN=$'\033[32m'
  YELLOW=$'\033[33m'
  RED=$'\033[31m'
  BOLD=$'\033[1m'
  RESET=$'\033[0m'
fi

banner() {
  [ "$QUIET" = true ] && return
  printf '\n'
  printf '%s ██████  ██████  ██      ██████         ███    ███ ██████%s\n' "$ORANGE" "$RESET"
  printf '%s██      ██    ██ ██      ██   ██        ████  ████ ██   ██%s\n' "$ORANGE" "$RESET"
  printf '%s██      ██    ██ ██      ██   ██        ██ ████ ██ ██   ██%s\n' "$ORANGE" "$RESET"
  printf '%s██      ██    ██ ██      ██   ██  ██    ██  ██  ██ ██   ██%s\n' "$ORANGE" "$RESET"
  printf '%s ██████  ██████  ███████ ██████         ██      ██ ██████%s\n' "$ORANGE" "$RESET"
  printf '\n'
  printf '%s━━━━━━━━━━━━━━━━━━━━━━━━━%s\n' "$ORANGE" "$RESET"
  printf '%sOne markdown file that runs your cold outreach.%s\n' "$WHITE" "$RESET"
  printf '%shttps://cold.md%s\n' "$DIM" "$RESET"
  printf '\n'
}

commands_panel() {
  [ "$QUIET" = true ] && return
  printf '\n'
  printf '  %sCOMMANDS%s\n' "$BOLD" "$RESET"
  printf '  %s/cold icp%s       %sBuild your ICP from a URL or Q&A%s\n'       "$ORANGE" "$RESET" "$DIM" "$RESET"
  printf '  %s/cold leads%s     %sSource leads matching icp.md%s\n'           "$ORANGE" "$RESET" "$DIM" "$RESET"
  printf '  %s/cold draft%s     %sDraft opener, bump, breakup from cold.md%s\n' "$ORANGE" "$RESET" "$DIM" "$RESET"
  printf '  %s/cold send%s      %sQueue a campaign via FoxReach%s\n'          "$ORANGE" "$RESET" "$DIM" "$RESET"
  printf '  %s/cold triage%s    %sSort replies by intent, draft responses%s\n' "$ORANGE" "$RESET" "$DIM" "$RESET"
  printf '  %s/cold report%s    %sDigest: deliverability + bookings%s\n'      "$ORANGE" "$RESET" "$DIM" "$RESET"
  printf '  %s/cold audit%s     %sRun a deliverability audit on a domain%s\n' "$ORANGE" "$RESET" "$DIM" "$RESET"
  printf '\n'
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

install_skills() {
  # Install each skill from skills/ into ~/.claude/skills/
  # Discovered dynamically so new skills don't need installer changes.
  mkdir -p "$SKILL_DIR"
  local installed=0
  for src in "$EXTRACTED/skills/"*; do
    [ -d "$src" ] || continue
    local name="$(basename "$src")"
    local dest="$SKILL_DIR/$name"
    [ -d "$dest" ] && rm -rf "$dest"
    cp -R "$src" "$dest"
    installed=$((installed + 1))
  done
  ok "$installed skills installed to $SKILL_DIR/"
}

install_plugin() {
  mkdir -p "$PLUGIN_DIR"
  local src="$EXTRACTED/plugin/cold-md"
  local dest="$PLUGIN_DIR/cold-md"
  [ -d "$dest" ] && rm -rf "$dest"
  cp -R "$src" "$dest"
  ok "cold-md plugin installed to $dest"
  if [ -z "${FOXREACH_API_KEY:-}" ]; then
    warn "FOXREACH_API_KEY not set. Get a free key at https://foxreach.io/signup, then:"
    printf "    export FOXREACH_API_KEY=fr_...\n" >&2
  fi
}

maybe_scaffold() {
  if [ "$SCAFFOLD" != true ]; then
    [ -f "./cold.md" ] || log "No ./cold.md here. Re-run with --scaffold to start one, or see https://cold.md"
    return
  fi
  if [ ! -f "./cold.md" ]; then
    cp "$EXTRACTED/examples/minimal.cold.md" "./cold.md"
    ok "Scaffolded ./cold.md from the minimal template"
  fi
  if [ ! -f "./icp.md" ]; then
    # Seed with a short placeholder; cold-icp expands it.
    cat > ./icp.md <<'ICP'
---
coldMdVersion: "0"
source: scaffold
---

# ICP - [Your product]

Run `/cold icp https://your-site.com` (or just `/cold icp` for Q&A) to fill this in.

## Company signals
## Title signals
## Pain signals (observable)
## Disqualifiers
## Qualification checklist
ICP
    ok "Scaffolded ./icp.md placeholder"
  fi
}

print_next_steps() {
  [ "$QUIET" = true ] && return
  commands_panel
  printf '  %sNEXT%s\n' "$BOLD" "$RESET"
  printf '  1. %s/cold icp https://your-site.com%s  (or just %s/cold icp%s for interactive Q&A)\n' "$ORANGE" "$RESET" "$ORANGE" "$RESET"
  printf '  2. Edit %s./cold.md%s for voice + sequences + banned phrases\n' "$ORANGE" "$RESET"
  printf '  3. %s/cold draft Jane Smith, CEO at Acme%s  to generate a spec-conformant opener\n' "$ORANGE" "$RESET"
  if [ "$WITH_FOXREACH" = true ]; then
    printf '\n  %sSend at scale:%s %s/cold send ./leads.csv%s   (requires FOXREACH_API_KEY)\n' "$WHITE" "$RESET" "$ORANGE" "$RESET"
    printf '  %sDigest on cron:%s %s/cold report weekly%s\n' "$WHITE" "$RESET" "$ORANGE" "$RESET"
    printf '\n  %sFoxReach dashboard:%s https://foxreach.io/app\n' "$DIM" "$RESET"
    printf '  %sFree API key:%s      https://foxreach.io/signup\n' "$DIM" "$RESET"
  else
    printf '\n  %sSkills-only install. For full send + triage + report:%s\n' "$DIM" "$RESET"
    printf '    %scurl -fsSL https://cold.md/install | bash%s   %s(default - includes the plugin)%s\n' "$ORANGE" "$RESET" "$DIM" "$RESET"
  fi
  printf '\n'
}

main() {
  banner
  check_deps
  fetch_repo
  install_skills
  if [ "$WITH_FOXREACH" = true ]; then
    install_plugin
  fi
  maybe_scaffold
  print_next_steps
}

main "$@"
