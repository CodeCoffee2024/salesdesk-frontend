# Build context is the repository root. Only used for a Render/self-hosted
# deploy — Vercel/Netlify build the SPA directly from git and don't need this.
FROM node:22-alpine AS build
WORKDIR /source

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# API_BASE_URL is a build-time argument (see DEPLOYMENT.md / deploy-web.yml) —
# it's substituted into environment.prod.ts before the Angular production
# build compiles it in, the same "static build secret" injection Vercel does.
ARG API_BASE_URL
RUN sed -i "s|__API_BASE_URL__|${API_BASE_URL}|" src/environments/environment.prod.ts \
    && npx ng build --configuration production

FROM nginx:1.27-alpine AS runtime
COPY infrastructure/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /source/dist/sales-desk.front-end /usr/share/nginx/html

EXPOSE 8080
