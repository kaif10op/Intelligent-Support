---
description: Deploy the AI Customer Support Agent to a production environment using Docker Compose.
---

Follow these steps to deploy the application to your production server.

### 1. Configure the Production Environment

First, create your production environment file from the example template:

// turbo
```bash
cp .env.production.example .env.production
```

> [!IMPORTANT]
> You must now edit `.env.production` and fill in your actual production secrets, database URLs, and API keys.

### 2. Run Database Migrations

Before starting the services, ensure your production database is up to date with the latest schema:

// turbo
```bash
make migrate-prod
```

### 3. Build and Start Services

Build the production Docker images and start the containers in detached mode:

// turbo
```bash
make deploy-prod
```

### 4. Verify the Deployment

Check the health status of your services to ensure they are running correctly:

// turbo
```bash
make health
```

Alternatively, you can manually verify with `curl`:

// turbo
```bash
curl http://localhost:8000/healthz
```
