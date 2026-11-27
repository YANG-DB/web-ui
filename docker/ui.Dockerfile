# web-ui: the React app, built once and served by nginx, which also forwards
#   /fuse -> the Fuse service (YangDB)   and   /api -> the mock service.
# Built by docker-compose.yml at the repository root.

FROM node:22-alpine AS build
WORKDIR /app/client
COPY client/package.json client/yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000
COPY client/ ./
# CI=false: lint warnings must not fail the build. The app calls Fuse at /fuse (same origin).
ENV CI=false GENERATE_SOURCEMAP=false
RUN yarn build

FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/build /usr/share/nginx/html
EXPOSE 80
