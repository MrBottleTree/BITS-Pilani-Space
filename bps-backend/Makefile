COMPOSE := docker compose -f http-compose.yml
PROFILE_TOOLS := --profile tools

.PHONY: run up stop down restart logs migrate rebuild reset hard-reset ps

# Run: start infra in background, apply migrations, then restart http
run: up migrate restart-http

# Bring up services in background
up:
	$(COMPOSE) up --build -d

# Run migrations (requires postgres healthy)
migrate:
	$(COMPOSE) $(PROFILE_TOOLS) run --rm migrate

# Restart only http to pick up schema changes cleanly
restart-http:
	$(COMPOSE) restart http

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
	$(COMPOSE) restart http

# HARD reset: deletes DB volume (ALL DATA LOST), then rebuild + migrate
hard-reset:
	$(COMPOSE) down -v
	$(COMPOSE) up --build -d
	$(COMPOSE) $(PROFILE_TOOLS) run --rm migrate
	$(COMPOSE) restart http
