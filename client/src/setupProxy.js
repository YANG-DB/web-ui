// Dev-server proxy for both backends (replaces the single "proxy" field in package.json).
//   /api  -> mock Express server (server.js), port 5001
//   /fuse -> YangDB (Fuse), FUSE_PROXY_TARGET or http://localhost:8888
// The client calls /fuse unless REACT_APP_FUSE_URL points it at Fuse directly.
const { createProxyMiddleware } = require("http-proxy-middleware");

const MOCK_TARGET = process.env.MOCK_PROXY_TARGET || "http://localhost:5001";
const FUSE_TARGET = process.env.FUSE_PROXY_TARGET || "http://localhost:8888";

module.exports = function(app) {
  app.use(
    createProxyMiddleware("/api", { target: MOCK_TARGET, changeOrigin: true, logLevel: "warn" })
  );
  app.use(
    createProxyMiddleware("/fuse", { target: FUSE_TARGET, changeOrigin: true, logLevel: "warn" })
  );
};
