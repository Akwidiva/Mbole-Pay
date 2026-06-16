.PHONY: up down restart logs ps build

## Build and start everything (streams live logs — Ctrl+C to detach, app keeps running)
up:
	docker compose up --build

## Start in background (detached)
start:
	docker compose up -d --build
	@echo ""
	@echo "  App  →  http://localhost:3000"
	@echo "  DB   →  localhost:5432  (mbole / mbole_password)"
	@echo "  Redis → localhost:6379"
	@echo ""
	@echo "  Tail logs: make logs"
	@echo ""

## Stop all containers
down:
	docker compose down

## Rebuild images without starting
build:
	docker compose build

## Tail app logs
logs:
	docker compose logs -f app

## Show container status
ps:
	docker compose ps
