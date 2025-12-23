COMPOSE := docker compose -f http-compose.yml
PROFILE_TOOLS := --profile tools

.PHONY: run up stop down restart logs migrate rebuild reset hard-reset ps

# Start postgres + http (keeps DB data)
run up:
	$(COMPOSE) up --build

# Stop containers (keeps DB data)
stop:
	$(COMPOSE) stop

# Stop + remove containers/networks (keeps DB data)
down:
	$(COMPOSE) down

# Restart services
restart:
	$(COMPOSE) restart

# Follow logs
logs:
	$(COMPOSE) logs -f --tail=200

# Run prisma migrations
migrate:
	$(COMPOSE) $(PROFILE_TOOLS) run --rm migrate

# Rebuild images without cache
rebuild:
	$(COMPOSE) build --no-cache

# Show status
ps:
	$(COMPOSE) ps

# Reset containers (keeps DB data)
reset:
	$(COMPOSE) down
	$(COMPOSE) up --build

# HARD reset: deletes DB volume (ALL DATA LOST)
hard-reset:
	$(COMPOSE) down -v
	$(COMPOSE) up --build -d
	$(COMPOSE) $(PROFILE_TOOLS) run --rm migrate
	$(COMPOSE) logs -f --tail=200
