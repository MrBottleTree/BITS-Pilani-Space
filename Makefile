COMPOSE_FILE := bps-backend/http-compose.yml  # Path to the docker compose file
COMPOSE := docker compose -f $(COMPOSE_FILE)  # Variable to define docker compose command using the specified compose file

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
run: delete start ## run = delete everything + start fresh + migrate
	$(COMPOSE) --profile tools run --rm migrate

.PHONY: delete
delete: ## delete = stop + remove containers + REMOVE DB volume (wipe data)
	$(COMPOSE) down -v --remove-orphans

.PHONY: stop
stop: ## stop = stop containers but KEEP DB volume
	$(COMPOSE) stop

.PHONY: start
start: ## start = start containers using existing DB volume
	$(COMPOSE) up --build -d postgres http

.PHONY: test
test: run ## test = fresh run then run tests and then return to previous directory
	cd tests && npm install && npm run test && cd ..
