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

reset:
	$(COMPOSE) down
	$(COMPOSE) up --build -d
	$(COMPOSE) $(PROFILE_TOOLS) run --rm migrate

hard-reset:
	$(COMPOSE) down -v
	$(COMPOSE) up --build -d
	$(COMPOSE) $(PROFILE_TOOLS) run --rm migrate
