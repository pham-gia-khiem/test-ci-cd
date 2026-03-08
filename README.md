# Backend Recall Shop

`Backend Recall Shop` is a small full-stack interview demo: NestJS monolith, Postgres, thin React UI, Docker Compose, and Nginx reverse proxy. It is intentionally scoped to cover the topics most backend interviews probe without burying them under extra features.

## Stack
- Backend: NestJS, TypeORM, JWT auth, Postgres
- Frontend: React + Vite
- Infra: Docker, Docker Compose, Nginx
- Tests: Nest e2e with sql.js in-memory DB

## Quick Start
### Docker
```bash
docker compose up --build
```

Open:
- App: `http://localhost:8080`
- API through Nginx: `http://localhost:8080/api`
- Frontend direct with HMR: `http://localhost:4173`
- Backend direct: `http://localhost:3000/api`

Seeded users:
- `customer@example.com` / `customer123`
- `admin@example.com` / `admin123`

### Local development
Terminal 1:
```bash
cd backend
npm install
npm run start:dev
```

Terminal 2:
```bash
cd frontend
npm install
npm run dev
```

Local backend env: copy values from `backend/.env.example`. The frontend can use `VITE_API_URL=http://localhost:3000/api`.

## Architecture
```text
Browser -> Nginx -> Nest API -> Services -> Postgres
                  -> Middleware
                  -> Guards
                  -> Interceptors
                  -> Pipes
```

Main backend modules:
- `auth`
- `users`
- `products`
- `cart`
- `orders`
- `common`

Main data model:
- `users` -> `carts` -> `cart_items`
- `users` -> `orders` -> `order_items`
- `products` referenced by both cart and order items

## Request Lifecycle In This Project
1. Frontend calls `/api/...` through Nginx.
2. Nest middleware attaches `requestId` and logs the request.
3. JWT guard authenticates protected endpoints.
4. Roles guard enforces admin-only routes.
5. Validation pipes validate DTOs and parse route params.
6. Controller delegates to service logic.
7. Service reads/writes Postgres with TypeORM.
8. Response interceptor wraps the result in a consistent envelope.

## Where Key Concepts Live
- Middleware: `backend/src/common/middleware/request-context.middleware.ts`
- Guard: `backend/src/common/guards/jwt-auth.guard.ts`
- Roles guard: `backend/src/common/guards/roles.guard.ts`
- Interceptor: `backend/src/common/interceptors/response-envelope.interceptor.ts`
- Pipes: global validation in `backend/src/main.ts`, param parsing with `ParseIntPipe`
- Auth and JWT flow: `backend/src/auth/auth.service.ts`
- Transaction demo: `backend/src/orders/orders.service.ts`

## Auth vs Authorization In This Codebase
- Authentication: JWT proves who the caller is.
- Authorization: role checks decide whether that authenticated user may perform an action.

Examples:
- `POST /api/auth/login` authenticates and returns access/refresh tokens.
- `POST /api/products` requires an authenticated user with the `admin` role.

## SQL Talking Points
- Primary keys: `id` on every table.
- Foreign keys: `cart.user`, `cart_items.cart`, `orders.user`, `order_items.order`, `order_items.product`.
- Joins: order history queries join orders, items, products, and users.
- Indexes: `users.email`, `products.slug`, `cart_items.cart`, `order_items.order`, `orders.user`.
- Transaction: order creation validates stock, creates order rows, updates stock, and clears the cart atomically.

## REST Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PATCH /api/products/:id`
- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:id`
- `DELETE /api/cart/items/:id`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `GET /api/admin/orders`

## Monolith vs Microservices
This project is a monolith on purpose:
- easier local setup
- one deployable unit
- simpler debugging and request tracing

How it could split later:
- `auth` service
- `catalog` service
- `orders` service

Tradeoff:
- microservices improve team and scaling boundaries
- they add service-to-service communication, deployment complexity, retries, and observability overhead

## Tests
Backend e2e coverage includes:
- login success/failure
- protected route blocking
- admin route blocking for customers
- DTO validation failures
- successful order transaction
- rollback on insufficient stock
- per-user order access protection

Run:
```bash
cd backend
npm run test:e2e
```

## Interview Guide
See `INTERVIEW_GUIDE.md` for short speaking answers tied directly to this project.

## Extra Docs
- `DOCKER_GUIDE.md`: Docker terms, Compose structure, examples, and interview answers for this repo
- `CI_CD_GUIDE.md`: GitHub Actions CI/CD flow, GHCR publishing, and how to extend it to deployment

## Notes
- In Docker Compose, the backend runs the Nest dev server with file watching. Edit files under `backend/` and the container will rebuild and restart the app automatically.
- In Docker Compose, the frontend runs the Vite dev server with hot reload. Edit files under `frontend/` and refresh through `http://localhost:8080` or `http://localhost:4173`.
- Frontend build currently expects Node `20.19+` because of the Vite version in use. The Dockerfiles already use a compatible Node image.
- This repo uses `synchronize: true` for speed of setup. That is fine for interview prep, but real production services should use migrations.
