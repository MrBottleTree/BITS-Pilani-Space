COMPOSE_FILE := bps-backend/http-compose.yml
COMPOSE := docker compose -f $(COMPOSE_FILE)

.PHONY: run delete stop start test

# run = delete everything + start fresh + migrate
run: delete start
	$(COMPOSE) --profile tools run --rm migrate

# delete = stop + remove containers + REMOVE DB volume (wipe data)
delete:
	$(COMPOSE) down -v --remove-orphans

# stop = stop containers but KEEP DB volume
stop:
	$(COMPOSE) stop

# start = start containers using existing DB volume
start:
	$(COMPOSE) up --build -d postgres http

# test = fresh run then run tests
test: run
	cd tests && npm install && npm run test
