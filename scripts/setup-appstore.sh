#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
#  ATLAS — App Store Setup Script
#  Run this once from GitHub Codespaces (or any machine with Ruby+gh)
#  Usage:  bash scripts/setup-appstore.sh
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC} $*"; }
info() { echo -e "${CYAN}ℹ${NC}  $*"; }
warn() { echo -e "${YELLOW}⚠${NC}  $*"; }
step() { echo -e "\n${BOLD}${BLUE}══ $* ══${NC}"; }
ask()  { echo -en "${BOLD}$* ${NC}"; }

BUNDLE_ID="co.il.atlas-app"
CERTS_REPO_NAME="atlas-certs"
GITHUB_SECRETS_SET=0

echo -e "${BOLD}${CYAN}"
cat << 'BANNER'
   ___  ____________   ___   ____
  / _ |/_  __/ /  _ | / __| / __/
 / __ | / / / / /_/ |_\ \  _\ \
/_/ |_|/_/ /_/|____//___/ /___/
         App Store Setup
BANNER
echo -e "${NC}"

# ── Step 0: Pre-flight checks ──────────────────────────────────────
step "0. Pre-flight checks"

if ! command -v gh &>/dev/null; then
  warn "GitHub CLI (gh) not found. Install from https://cli.github.com"
  exit 1
fi
ok "gh CLI found"

if ! gh auth status &>/dev/null; then
  info "Please login to GitHub:"
  gh auth login
fi
ok "GitHub authenticated as $(gh api /user -q .login)"

if ! command -v bundle &>/dev/null; then
  warn "Bundler not found. Run: gem install bundler"
  exit 1
fi
ok "Bundler found"

# ── Step 1: Create atlas-certs repo ───────────────────────────────
step "1. Create certificate storage repo"

GH_USER=$(gh api /user -q .login)
CERTS_REPO_URL="https://github.com/$GH_USER/$CERTS_REPO_NAME"

if gh repo view "$GH_USER/$CERTS_REPO_NAME" &>/dev/null; then
  ok "Repo already exists: $CERTS_REPO_URL"
else
  info "Creating private repo: $GH_USER/$CERTS_REPO_NAME"
  gh repo create "$CERTS_REPO_NAME" \
    --private \
    --description "Fastlane Match — ATLAS signing certificates (encrypted)"
  ok "Created: $CERTS_REPO_URL"
fi

# ── Step 2: App Store Connect API Key ─────────────────────────────
step "2. App Store Connect API Key"

echo ""
echo "  Go to: https://appstoreconnect.apple.com/access/integrations/api"
echo "  → Click + → Name: 'Atlas CI', Role: App Manager"
echo "  → Download the .p8 file"
echo ""

ask "Full path to the .p8 file (e.g. ~/Downloads/AuthKey_XXXXXXXX.p8): "
read -r P8_PATH
P8_PATH="${P8_PATH/#\~/$HOME}"

if [[ ! -f "$P8_PATH" ]]; then
  warn "File not found: $P8_PATH"
  exit 1
fi
ok "Found: $P8_PATH"

ask "Key ID (10 characters, e.g. ABC1234567): "
read -r KEY_ID

ask "Issuer ID (UUID, e.g. 69a6de7e-xxxx-xxxx-xxxx-xxxx): "
read -r ISSUER_ID

P8_BASE64=$(base64 < "$P8_PATH" | tr -d '\n')

# ── Step 3: Match password ─────────────────────────────────────────
step "3. Choose a Match password"
info "This encrypts your certificates. Store it safely (e.g. in 1Password)."
ask "Match password (will not echo): "
read -rs MATCH_PASSWORD
echo ""
ok "Password set"

# ── Step 4: Create GitHub Personal Access Token for Match ─────────
step "4. GitHub token for Match (to access atlas-certs)"

echo ""
echo "  Go to: https://github.com/settings/tokens/new"
echo "  → Note: 'Atlas Match', Expiration: No expiration (or 1 year)"
echo "  → Scopes: ✅ repo"
echo "  → Generate token"
echo ""

ask "Paste the token (ghp_...): "
read -rs MATCH_TOKEN
echo ""
ok "Token received"

MATCH_AUTH=$(echo -n "$GH_USER:$MATCH_TOKEN" | base64 | tr -d '\n')

# ── Step 5: Set GitHub Secrets ────────────────────────────────────
step "5. Setting GitHub Secrets"

ATLAS_REPO="$GH_USER/atlas"

set_secret() {
  local name="$1" val="$2"
  echo -n "  Setting $name... "
  echo "$val" | gh secret set "$name" --repo "$ATLAS_REPO"
  echo -e "${GREEN}✓${NC}"
}

set_secret "APP_STORE_CONNECT_API_KEY_ID"       "$KEY_ID"
set_secret "APP_STORE_CONNECT_API_ISSUER_ID"    "$ISSUER_ID"
set_secret "APP_STORE_CONNECT_API_KEY_CONTENT"  "$P8_BASE64"
set_secret "MATCH_GIT_URL"                      "$CERTS_REPO_URL"
set_secret "MATCH_PASSWORD"                     "$MATCH_PASSWORD"
set_secret "MATCH_GIT_BASIC_AUTHORIZATION"      "$MATCH_AUTH"

GITHUB_SECRETS_SET=1
ok "All 6 secrets set on $ATLAS_REPO"

# ── Step 6: Initialize Fastlane Match ─────────────────────────────
step "6. Initializing Fastlane Match (creating certificates)"

info "This will create App Store distribution certificates on Apple's servers"
info "and store them (encrypted) in $CERTS_REPO_URL"
echo ""

export MATCH_GIT_URL="$CERTS_REPO_URL"
export MATCH_PASSWORD="$MATCH_PASSWORD"
export MATCH_GIT_BASIC_AUTHORIZATION="$MATCH_AUTH"
export APP_STORE_CONNECT_API_KEY_ID="$KEY_ID"
export APP_STORE_CONNECT_API_ISSUER_ID="$ISSUER_ID"
export APP_STORE_CONNECT_API_KEY_PATH="$P8_PATH"

bundle install --quiet

bundle exec fastlane match appstore \
  --app_identifier "$BUNDLE_ID" \
  --readonly false

ok "Certificates created and stored in $CERTS_REPO_URL"

# ── Step 7: Trigger first build ────────────────────────────────────
step "7. Trigger first TestFlight build"

ask "Trigger GitHub Actions build now? [Y/n]: "
read -r TRIGGER
TRIGGER="${TRIGGER:-Y}"

if [[ "$TRIGGER" =~ ^[Yy] ]]; then
  gh workflow run "ios-deploy.yml" \
    --repo "$ATLAS_REPO" \
    --field lane=beta
  ok "Build triggered!"
  info "Watch it at: https://github.com/$ATLAS_REPO/actions"
fi

# ── Done ───────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${BOLD}${GREEN}  ✅  ATLAS App Store setup complete!${NC}"
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo "  📱 Build progress: https://github.com/$ATLAS_REPO/actions"
echo "  🧪 TestFlight:     https://appstoreconnect.apple.com"
echo ""
echo "  Next time you push to main → deploys automatically."
echo ""
