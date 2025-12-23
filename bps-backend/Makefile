COMPOSE := docker compose -f http-compose.yml  # Variable to define docker compose command using the http-compose.yml file
PROFILE_TOOLS := --profile tools  # Variable to specify the tools profile for docker compose

# The PHONY target specifies that these targets are not files, meaning that these are commands to be executed.
# This means that running 'make run' will not mistake 'run' for a file named 'run'.

# Refactored .PHONY declaration to above each utility target for better readability.
# This is also done since during the development of the MakeFile, often people add new targets and
# having the .PHONY declaration just above each target makes it easier to remember to add it.

# Adding a help target to give a brief info about target:
.PHONY: help
help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# To use help system for a command have to have <command>: ## <description> format

.PHONY: run
run: ## Build, start services and run migrations
	up migrate

.PHONY: up
up:  ## Build and start services
	$(COMPOSE) up --build -d postgres http

.PHONY: migrate
migrate:  ## Run database migrations
	$(COMPOSE) $(PROFILE_TOOLS) run --rm migrate

.PHONY: down
down:  ## Stop and remove containers
	$(COMPOSE) down

.PHONY: stop
stop:  ## Stop services
	$(COMPOSE) stop

.PHONY: restart
restart:
	$(COMPOSE) restart

.PHONY: logs
logs:  ## Follow logs of services up to last 200 lines
	$(COMPOSE) logs -f --tail=200

.PHONY: rebuild
rebuild:  ## Rebuild services without using cache
	$(COMPOSE) build --no-cache

.PHONY: ps
ps:  ## List containers
	$(COMPOSE) ps

.PHONY: reset
reset:  ## Stop services, remove containers, and start services again with migrations
	$(COMPOSE) down
	$(COMPOSE) up --build -d
	$(COMPOSE) $(PROFILE_TOOLS) run --rm migrate

.PHONY: hard-reset
hard-reset:  ## Stop services, remove containers and volumes, and start services again with migrations
	$(COMPOSE) down -v
	$(COMPOSE) up --build -d
	$(COMPOSE) $(PROFILE_TOOLS) run --rm migrate

# Further explanation pending review ~ KnightFury1102
