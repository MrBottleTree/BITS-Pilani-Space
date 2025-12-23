COMPOSE := docker compose -f http-compose.yml
PROFILE_TOOLS := --profile tools

.PHONY: run up stop down restart logs migrate rebuild reset hard-reset ps

# Always: start (detached) -> migrate
run: up migrate

up:
	$(COMPOSE) up --build -d

migrate:
	$(COMPOSE) $(PROFILE_TOOLS) run --rm migrate

stop:
	$(COMPOSE) stop

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart

logs:
	$(COMPOSE) logs -f --tail=200

rebuild:
	$(COMPOSE) build --no-cache

ps:
	$(COMPOSE) ps

# Reset containers (keeps DB data)
reset:
	$(COMPOSE) down
	$(COMPOSE) up --build -d
	$(COMPOSE) $(PROFILE_TOOLS) run --rm migrate

# HARD reset: deletes DB volume (ALL DATA LOST), then rebuild + migrate
hard-reset:
	$(COMPOSE) down -v
	$(COMPOSE) up --build -d
	$(COMPOSE) $(PROFILE_TOOLS) run --rm migrate
