COMPOSE := docker compose -f http-compose.yml
PROFILE_TOOLS := --profile tools

.PHONY: run up migrate down

run: up migrate

up:
	$(COMPOSE) up --build -d postgres http

migrate:
	$(COMPOSE) $(PROFILE_TOOLS) run --rm migrate

down:
	$(COMPOSE) down


stop:
	$(COMPOSE) stop

restart:
	$(COMPOSE) restart

logs:
	$(COMPOSE) logs -f --tail=200

rebuild:
	$(COMPOSE) build --no-cache

ps:
	$(COMPOSE) ps

reset:
	$(COMPOSE) down
	$(COMPOSE) up --build -d
	$(COMPOSE) $(PROFILE_TOOLS) run --rm migrate

hard-reset:
	$(COMPOSE) down -v
	$(COMPOSE) up --build -d
	$(COMPOSE) $(PROFILE_TOOLS) run --rm migrate
