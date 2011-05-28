var Log      = require('log')
  , log      = new Log(Log.INFO)
  , EventEmitter = require('node-evented').EventEmitter
  , emitter  = new EventEmitter()
  , HNCrawler = require('./crawler').HNCrawler
  , crawler  = new HNCrawler(3)
  , last_run = new Date();

// Start crawler job

emitter.on('digging_pop', function() {
  crawler.run('/news', function() {
    last_run = new Date();
    var timeout = randomDelay();
    log.info("Will dig HN Newest News in " + Math.floor(timeout / 1000)+ " secs");
    setTimeout(function() {
      emitter.emit('digging_new');
    }, timeout);
  });
});

emitter.on('digging_new', function() {
  crawler.run('/newest', function() {
    last_run = new Date();
    var timeout = randomDelay();
    log.info("Will dig HN Popular News in " + Math.floor(timeout / 1000) + " secs");
    setTimeout(function() {
      emitter.emit('digging_pop');
    }, timeout);
  });
});

var randomDelay = function() {
  return (20 + Math.random()  * 5) * 1000;
};

emitter.emit('digging_new');

exports.last_run = function() {
  return last_run;
};
