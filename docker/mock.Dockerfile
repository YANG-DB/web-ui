# The mock backend (server.js + mocks/), used by the Mock server backend and the API page.
FROM node:22-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production --ignore-scripts --network-timeout 600000
COPY server.js ./
COPY mocks ./mocks
ENV MOCK_PORT=5001
EXPOSE 5001
CMD ["node", "server.js"]
