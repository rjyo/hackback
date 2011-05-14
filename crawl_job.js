var Log = require('log'),
    log = new Log(Log.INFO);

// Start crawler job
var EventEmitter = require('node-evented').EventEmitter;
var HNCrawler = require('./lib/crawler').HNCrawler;

// Do as you usual do!
var emitter = new EventEmitter();
var crawler = new HNCrawler(3);
var last_run = new Date();

emitter.on('digging_pop', function() {
  crawler.run('/news', function() {
    last_run = new Date();
    var timeout = 10 + Math.random()  * 10;
    log.info("Will dig HN Newest News in " + timeout + " secs");
    setTimeout(function() {
      emitter.emit('digging_new');
    }, timeout * 1000);
  });
});

emitter.on('digging_new', function() {
  crawler.run('/newest', function() {
    last_run = new Date();
    var timeout = 10 + Math.random()  * 10;
    log.info("Will dig HN Popular News in " + timeout + " secs");
    setTimeout(function() {
      emitter.emit('digging_pop');
    }, timeout);
  });
});

emitter.emit('digging_new');

exports.last_run = function() {
  return last_run;
};
