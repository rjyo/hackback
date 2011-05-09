/**
 * Module dependencies.
 */

var cluster = require('cluster');

cluster('app.js')
  .set('workers', 4)
  .set('socket path', '/tmp')
  .use(cluster.logger('logs'))
  .use(cluster.stats({ connections: true, requests: true }))
  .use(cluster.pidfiles())
  .use(cluster.cli())
  .listen(4000, '127.0.0.1');

