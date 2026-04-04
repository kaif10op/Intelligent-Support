.PHONY: help build up down logs clean dev test migrate seed stop

help:
	@echo "Customer Support Agent - Available Commands"
	@echo "==========================================="
	@echo "make dev           - Start all services in development mode"
	@echo "make build         - Build Docker images"
	@echo "make up            - Start all services (detached)"
	@echo "make down          - Stop all services and remove containers"
	@echo "make logs          - View logs from all services"
	@echo "make logs-server   - View server logs"
	@echo "make logs-client   - View client logs"
	@echo "make migrate       - Run database migrations"
	@echo "make seed          - Seed the database"
	@echo "make clean         - Clean everything including volumes"
	@echo "make test          - Run tests"
	@echo "make ps            - List running containers"
	@echo "make stop          - Stop all services without removing"
	@echo "make format        - Format code"
	@echo "make lint          - Lint code"

# Development
dev:
	@echo "Starting services in development mode..."
	docker-compose up

# Build images
build:
	@echo "Building Docker images..."
	docker-compose build

# Start all services (detached)
up:
	@echo "Starting all services..."
	docker-compose up -d
	@echo "Services started!"
	@echo "Client: http://localhost:3000"
	@echo "Server: http://localhost:5000"

# Stop all services
down:
	@echo "Stopping all services..."
	docker-compose down

# Remove everything including volumes
clean:
	@echo "Cleaning everything including volumes..."
	docker-compose down -v
	@echo "Cleanup complete!"

# View logs
logs:
	docker-compose logs -f

logs-server:
	docker-compose logs -f server

logs-client:
	docker-compose logs -f client

logs-db:
	docker-compose logs -f db

# Database operations
migrate:
	@echo "Running database migrations..."
	docker-compose exec server npx prisma migrate deploy

seed:
	@echo "Seeding database..."
	docker-compose exec server npm run seed

# Show running containers
ps:
	docker-compose ps

# Stop services without removing
stop:
	@echo "Stopping services..."
	docker-compose stop

# Restart services
restart:
	@echo "Restarting services..."
	docker-compose restart

# Format code
format:
	cd server && npm run format 2>/dev/null || true
	cd client && npm run format 2>/dev/null || true
	@echo "Code formatted (if formatters are configured)"

# Lint code
lint:
	cd server && npm run lint 2>/dev/null || echo "No server lint script"
	cd client && npm run lint 2>/dev/null || echo "No client lint script"

# Run tests
test:
	cd server && npm test 2>/dev/null || echo "No server tests"
	cd client && npm test 2>/dev/null || echo "No client tests"

# Install dependencies
install:
	@echo "Installing dependencies..."
	cd server && npm install
	cd client && npm install
	@echo "Dependencies installed!"

# Local setup for development (without Docker)
local-setup:
	@echo "Setting up for local development..."
	$(MAKE) install
	@echo "Copying .env.example to .env if needed..."
	@if [ ! -f .env ]; then cp .env.example .env; fi
	@echo "Setup complete! Configure .env and run 'make local-dev'"

# Run locally without Docker (requires Node.js, PostgreSQL, Redis)
local-dev:
	@echo "Starting local development servers..."
	npm run dev --prefix server &
	npm run dev --prefix client &
	wait

# Open browser
open:
	@open http://localhost:3000 || xdg-open http://localhost:3000

# Health check
health:
	@echo "Checking service health..."
	@curl -f http://localhost:5000/healthz && echo "✓ Server healthy" || echo "✗ Server unhealthy"
	@curl -f http://localhost:3000/healthz && echo "✓ Client healthy" || echo "✗ Client unhealthy"

# Deploy to Render
deploy-render:
	@echo "Deploying to Render..."
	@echo "1. Push to your Git repository"
	@echo "2. Connect repository to Render"
	@echo "3. Render will automatically deploy based on render.yaml"

# Show environment info
info:
	@echo "System Information:"
	@docker --version
	@docker-compose --version
	@node --version || echo "Node.js not installed"
	@npm --version || echo "npm not installed"
