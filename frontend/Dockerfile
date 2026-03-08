FROM node:20.19-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM base AS dev
COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
EXPOSE 4173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "4173"]

FROM base AS build
COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM node:20.19-alpine AS runtime
WORKDIR /app

RUN npm install -g serve
COPY --from=build /app/dist ./dist

EXPOSE 4173

CMD ["serve", "-s", "dist", "-l", "4173"]
