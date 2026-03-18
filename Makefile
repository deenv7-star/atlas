# ATLAS — Developer commands
.PHONY: setup dev build ios-sync icons help

# ── App Store Setup (one-time) ─────────────────────────────────────
setup:
	@echo "Starting App Store setup wizard..."
	@bash scripts/setup-appstore.sh

# ── Local development ──────────────────────────────────────────────
dev:
	npm run dev:full

build:
	npm run build

# ── iOS ────────────────────────────────────────────────────────────
icons:
	npm run generate:icons

ios-sync:
	npm run ios:sync

# ── Help ───────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  ATLAS — Available commands"
	@echo ""
	@echo "  make setup     → One-time App Store setup (run from Codespaces)"
	@echo "  make dev       → Start local dev server (API + UI)"
	@echo "  make build     → Build web app"
	@echo "  make icons     → Regenerate app icons"
	@echo "  make ios-sync  → Sync web assets to iOS (needs Mac)"
	@echo ""
