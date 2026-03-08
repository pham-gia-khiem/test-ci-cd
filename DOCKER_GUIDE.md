# Docker Guide

This note is for fast recall before interviews and for understanding how Docker is used in this repo.

## 1. Mental Model
- `Dockerfile`: recipe for building an image
- `image`: packaged app artifact
- `container`: running instance of an image
- `volume`: persistent storage managed by Docker
- `bind mount`: host folder mounted into a container
- `network`: communication layer between containers
- `docker compose`: tool to run multiple related containers together

Short memory hook:
- build recipe -> image -> container
- storage -> volume
- local source sync -> bind mount
- multi-service app -> compose

## 2. Core Terminologies

### Dockerfile
Definition:
- A text file with instructions Docker uses to build an image.

What it can do:
- choose a base image
- set working directory
- copy files
- install dependencies
- expose ports
- define the startup command
- create multi-stage builds

Example:
```dockerfile
FROM node:20.19-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "start"]
```

In this repo:
- [backend/Dockerfile](C:/code/learn-fullstack/backend/Dockerfile)
- [frontend/Dockerfile](C:/code/learn-fullstack/frontend/Dockerfile)

Interview answer:
- “A Dockerfile defines how an app is packaged into an image. I use it to install dependencies, copy source code, build artifacts, and define how the container starts.”

### Image
Definition:
- An immutable packaged snapshot of an app and its runtime environment.

What it can do:
- be stored in a registry
- be reused to start many containers
- provide consistent runtime across machines

Example:
```bash
docker build -t interview-backend ./backend
```

Interview answer:
- “An image is the packaged artifact. It contains the application and runtime setup, and I can start one or many containers from the same image.”

### Container
Definition:
- A running instance of an image.

What it can do:
- run your application process
- expose ports
- connect to networks
- mount volumes
- be started, stopped, removed, and recreated

Example:
```bash
docker run -p 3000:3000 interview-backend
```

Interview answer:
- “A container is the running process created from an image. I treat containers as disposable runtime instances.”

### Volume
Definition:
- Persistent storage managed by Docker and kept outside the container lifecycle.

What it can do:
- keep database data after container recreation
- share persistent data across compatible containers
- separate important state from ephemeral containers

Example:
```yaml
volumes:
  postgres-data:
```

```yaml
services:
  postgres:
    volumes:
      - postgres-data:/var/lib/postgresql/data
```

In this repo:
- [docker-compose.yml](C:/code/learn-fullstack/docker-compose.yml)

What actually happens:
- Docker creates named storage called `postgres-data`
- Docker mounts it into the Postgres container at `/var/lib/postgresql/data`
- Postgres writes database files there
- if the container is deleted, the volume can still remain

Interview answer:
- “A Docker volume is persistent storage managed by Docker. I use it for things like Postgres data so container deletion does not automatically remove the database files.”

### Bind Mount
Definition:
- A host machine path mounted directly into a container.

What it can do:
- sync local source code into a container
- enable hot reload in dev
- let the container read files from your machine directly

Example:
```yaml
volumes:
  - ./frontend:/app
```

In this repo:
- the frontend service uses a bind mount for Vite hot reload

Tradeoff:
- great for development
- less ideal for production because it couples the container to the host filesystem

Interview answer:
- “A bind mount maps a host folder into a container. I use it in development for hot reload, for example mounting the frontend source into the Vite container.”

### Port Mapping
Definition:
- A mapping between a host port and a container port.

What it can do:
- let your local machine access a service inside a container
- expose web apps, APIs, or databases for development

Example:
```yaml
ports:
  - "8080:80"
```

Meaning:
- host `8080`
- container `80`

In this repo:
- Nginx: `8080:80`
- backend: `3000:3000`
- frontend: `4173:4173`
- postgres: `5432:5432`

Interview answer:
- “Port mapping exposes a container port to the host, such as mapping host `8080` to container `80` for Nginx.”

### Network
Definition:
- A communication layer that lets containers talk to each other by service name.

What it can do:
- connect backend to database
- connect Nginx to backend and frontend
- isolate app services from unrelated containers

Example:
- In Compose, services join the default project network automatically.
- The backend can reach Postgres with host `postgres`.

In this repo:
```yaml
environment:
  DB_HOST: postgres
```

Why this works:
- `postgres` is the Compose service name
- Docker DNS resolves that service name on the Compose network

Interview answer:
- “Containers in the same Compose app can usually reach each other by service name because Docker creates a shared network and internal DNS.”

### Registry
Definition:
- A remote storage location for Docker images.

What it can do:
- store versioned images
- support deployment pipelines
- let environments pull the same build artifact

Examples:
- Docker Hub
- GitHub Container Registry
- Amazon ECR

Interview answer:
- “A registry stores Docker images so build systems and servers can pull the same versioned artifact.”

### Layer
Definition:
- A cached build step inside an image.

What it can do:
- speed up rebuilds
- reduce repeated work during `docker build`

Example:
```dockerfile
COPY package*.json ./
RUN npm ci
COPY . .
```

Why this pattern is good:
- dependency install is cached unless `package.json` changes
- source code changes do not force `npm ci` every time

Interview answer:
- “Docker images are built in layers. I order Dockerfile steps to maximize cache reuse, especially around dependency installation.”

## 3. Docker vs Docker Compose

### Docker
Use when:
- you want to build or run one container manually

Examples:
```bash
docker build -t backend-app ./backend
docker run -p 3000:3000 backend-app
docker logs <container>
docker exec -it <container> sh
```

### Docker Compose
Use when:
- your app has multiple services
- you want one command to start the whole stack

Examples:
```bash
docker compose up --build
docker compose down
docker compose logs -f
docker compose exec backend sh
```

In this repo:
- `postgres`
- `backend`
- `frontend`
- `nginx`

Interview answer:
- “Docker handles single images and containers, while Compose is for orchestrating a multi-container app locally.”

## 4. Read This Repo's Compose File

File:
- [docker-compose.yml](C:/code/learn-fullstack/docker-compose.yml)

### `services`
Purpose:
- defines each containerized component

In this repo:
- `postgres`
- `backend`
- `frontend`
- `nginx`

### `build`
Purpose:
- tells Docker how to build an image from a local directory

Example:
```yaml
backend:
  build:
    context: ./backend
```

Meaning:
- build from the `backend` folder

### `target`
Purpose:
- choose a specific stage from a multi-stage Dockerfile

Example:
```yaml
frontend:
  build:
    context: ./frontend
    target: dev
```

Meaning:
- use the `dev` stage instead of the production stage

### `environment`
Purpose:
- pass environment variables into the container

Example:
```yaml
environment:
  DB_HOST: postgres
  DB_PORT: 5432
```

Used for:
- DB connection config
- JWT secrets
- app mode
- runtime flags

### `depends_on`
Purpose:
- define startup order

Important caution:
- it does not mean “service is fully ready”
- it only means Docker starts the dependency first

Example:
```yaml
backend:
  depends_on:
    - postgres
```

Interview answer:
- “`depends_on` controls startup ordering, but not application readiness. For readiness I would use health checks or retry logic.”

### `volumes`
Purpose:
- attach persistent storage or bind mounts

Examples in this repo:
```yaml
postgres:
  volumes:
    - postgres-data:/var/lib/postgresql/data
```

```yaml
frontend:
  volumes:
    - ./frontend:/app
    - /app/node_modules
```

Meaning:
- `postgres-data` keeps DB files persistent
- `./frontend:/app` syncs local frontend code into the container
- `/app/node_modules` keeps container-installed packages from being overwritten by the host mount

### root `volumes`
Purpose:
- declare named volumes used by services

Example:
```yaml
volumes:
  postgres-data:
```

Meaning:
- create a reusable named volume called `postgres-data`

### `ports`
Purpose:
- expose service ports to your machine

Examples:
```yaml
ports:
  - "8080:80"
```

### `image`
Purpose:
- run a published image directly instead of building locally

Example in this repo:
```yaml
nginx:
  image: nginx:1.27-alpine
```

Meaning:
- pull and run that Nginx image

## 5. Commands You Actually Need

### Daily commands
```bash
docker compose up --build
docker compose down
docker compose ps
docker compose logs -f
docker compose exec backend sh
docker compose exec frontend sh
```

### Inspection
```bash
docker ps
docker images
docker volume ls
docker network ls
docker inspect <container>
docker logs <container>
```

### Cleanup
```bash
docker compose down -v
docker container prune
docker image prune
docker volume prune
docker system prune -a
```

Caution:
- `down -v` removes named volumes
- removing volumes can permanently delete local database data

## 6. Development vs Production

### Development setup
Typical choices:
- bind mounts
- hot reload
- source code visible in container
- dev server like Vite or Nest watch mode

This repo:
- frontend uses Vite dev server in Docker
- frontend source is bind-mounted into the container

### Production setup
Typical choices:
- no bind mounts for application code
- prebuilt optimized image
- static assets served by Nginx or app server
- smaller runtime image

This repo:
- frontend Dockerfile also has a production build stage
- backend Dockerfile builds and runs compiled Nest output

Interview answer:
- “In development I favor bind mounts and watch mode. In production I favor immutable images, smaller runtime layers, and no source-code mounts.”

## 7. Common Interview Questions

### What is the difference between image and container?
- An image is the packaged artifact.
- A container is the running instance created from that image.

### What is the difference between volume and bind mount?
- A volume is managed by Docker.
- A bind mount maps a specific host path into the container.

Short answer:
- “Volumes are better for persistent managed storage like databases. Bind mounts are common for local development and hot reload.”

### Why use Docker at all?
- consistent environment
- easier onboarding
- easier local multi-service setup
- fewer “works on my machine” issues

### Why use Compose?
- one command for frontend, backend, database, and proxy
- shared networking and config
- easier local development

### Why keep Postgres data in a volume?
- container recreation should not wipe the database

### How does one container reach another?
- by service name on the Compose network, for example `postgres` or `backend`

## 8. Examples From This Project

### Backend talking to Postgres
```yaml
backend:
  environment:
    DB_HOST: postgres
```

Meaning:
- backend container connects to the Postgres container using the Compose service name

### Nginx reverse proxy
```yaml
nginx:
  depends_on:
    - backend
    - frontend
```

Nginx routes:
- `/api` -> backend
- `/` -> frontend

Files:
- [docker-compose.yml](C:/code/learn-fullstack/docker-compose.yml)
- [nginx/default.conf](C:/code/learn-fullstack/nginx/default.conf)

### Frontend hot reload
```yaml
frontend:
  build:
    target: dev
  volumes:
    - ./frontend:/app
    - /app/node_modules
```

Meaning:
- use the Dockerfile dev stage
- mount source code from your machine
- keep container `node_modules`
- run Vite with HMR

## 9. Short Memorization Table

| Term | Fast meaning | Example in this repo |
|---|---|---|
| Dockerfile | Build recipe | `backend/Dockerfile` |
| Image | Packaged app artifact | built backend/frontend images |
| Container | Running app instance | `backend`, `frontend`, `postgres`, `nginx` |
| Volume | Persistent Docker-managed storage | `postgres-data` |
| Bind mount | Host folder mounted into container | `./frontend:/app` |
| Port mapping | Host port to container port | `8080:80` |
| Network | Container-to-container communication | backend reaches `postgres` |
| Compose | Multi-container orchestration | `docker compose up --build` |
| Registry | Remote image storage | Docker Hub |
| Layer | Cached image build step | `COPY package*.json` before `npm ci` |

## 10. Good Interview Answers

### Docker in one sentence
- “Docker packages an application and its runtime so it runs consistently across environments.”

### Docker Compose in one sentence
- “Docker Compose lets me define and run a multi-container app like frontend, backend, database, and proxy with one config file.”

### Volume in one sentence
- “A Docker volume is persistent storage managed by Docker, commonly used for stateful services like Postgres.”

### Bind mount in one sentence
- “A bind mount maps a host folder into a container, which is especially useful for local development and hot reload.”

### This repo in one sentence
- “This project uses Compose to run Nginx, NestJS, React/Vite, and Postgres together, with a named volume for DB persistence and a bind mount for frontend hot reload.”

## 11. Practical Cautions
- Containers are disposable; important data should not live only inside them.
- `depends_on` is not a readiness guarantee.
- Bind mounts are convenient for development but not the normal production deployment pattern.
- `docker compose down -v` removes named volumes and can wipe local DB data.
- Rebuilding an image is not the same as restarting a container.

## 12. If You Forget Everything
Remember these 6:
1. Dockerfile = recipe
2. image = packaged app
3. container = running app
4. volume = persistent data
5. bind mount = local folder into container
6. compose = run many services together
