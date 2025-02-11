const cds = require("@sap/cds");
const cov2ap = require("@cap-js-community/odata-v2-adapter");
cds.on("bootstrap", (app) => app.use(cov2ap()));

cds.once('listening', ({ server }) => {
    server.keepAliveTimeout = 5 * 60 * 1000 // > 5 mins
  });

module.exports = cds.server
