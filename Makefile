help:
	@echo "Available commands:"
	@echo "  make up      : Start the server and DB (persists data)"
	@echo "  make down    : Stop the server (persists data)"
	@echo "  make logs    : View logs of all services"
	@echo "  make clean   : Stop server, DELETE data (volumes), and DELETE built images"
	@echo "  make test    : Restart services (keeping data) and run tests"

up:
	docker compose up -d backend postgres minio minio-setup

down:
	docker compose down

logs:
	docker compose logs -f

clean:
	docker compose down --volumes --rmi local

test:
	@echo "Restarting services..."
	docker compose down
	docker compose up -d --build backend postgres minio minio-setup
	@echo "Running tests..."
	docker compose run --rm --build tests