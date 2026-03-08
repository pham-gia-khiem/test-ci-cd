# Interview Guide

Use this repo to answer questions concretely instead of abstractly.

## 30-Second Project Summary
“I built a small e-commerce interview demo as a NestJS monolith with Postgres, JWT auth, a thin React frontend, Docker Compose, and Nginx as a reverse proxy. It covers request flow, authentication vs authorization, SQL relations, joins, indexes, and transactional order creation.”

## Fast Talking Points
| Topic | Project answer |
|---|---|
| Request flow | “The browser calls Nginx, Nginx forwards `/api` to Nest, middleware logs and attaches a request ID, guards check auth and roles, pipes validate input, controllers call services, TypeORM talks to Postgres, and an interceptor wraps the response.” |
| Middleware | “I use middleware for request ID and logging because it is cross-cutting and runs early.” |
| Guard | “I use a JWT guard for authentication and a roles guard for authorization.” |
| Interceptor | “The interceptor adds a consistent response envelope and timing metadata.” |
| Pipe | “I use a global validation pipe for DTOs and `ParseIntPipe` for route params.” |
| Auth vs authorization | “Authentication answers who the user is. Authorization answers what that user can do. In this app, JWT login authenticates and role checks authorize admin routes.” |
| JWT | “Access tokens protect API routes and refresh tokens issue new access tokens without logging in again.” |
| PK/FK | “Every table has an `id` primary key, and foreign keys connect users, carts, orders, and products.” |
| Join | “Order history joins orders, order items, products, and users so the API can return a full order view.” |
| Index | “I index fields like `users.email` and `products.slug` because they are frequent lookup keys.” |
| Transaction | “Order creation is transactional so stock updates, order rows, and cart clearing either all succeed or all roll back.” |
| REST methods | “I use `GET` for reads, `POST` for create/login/order placement, `PATCH` for partial updates, and `DELETE` for removing cart items.” |
| Docker | “Docker packages the frontend and backend consistently, and Compose runs the whole stack locally.” |
| Nginx reverse proxy | “Nginx is the entry point. It routes `/api` to Nest and `/` to the frontend.” |
| Monolith vs microservices | “I kept it monolithic for simplicity and interview clarity, but the module boundaries make it clear how auth, catalog, and orders could be extracted later.” |

## Practical Examples You Can Say
- Authentication: “`POST /api/auth/login` verifies email/password and returns JWTs.”
- Authorization: “`POST /api/products` is blocked for customers and allowed for admins.”
- Transaction: “When placing an order, the app creates the order, writes order items, decrements stock, and clears the cart in one transaction.”
- Join: “The order history endpoint joins orders with items and products to return one response instead of multiple round trips.”
- Index: “Login uses `users.email`, so indexing that column reduces lookup cost.”

## Monolith To Microservices Answer
“For this size, a monolith is faster to build, debug, and deploy. If the system grew, I would consider splitting auth, catalog, and orders into separate services, but only when team ownership or scaling patterns justified the added operational complexity.”
