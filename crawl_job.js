// Start crawler job
var EventEmitter = require('node-evented').EventEmitter;
var HNCrawler = require('./lib/crawler').HNCrawler;

// Do as you usual do!
var emitter = new EventEmitter();
var crawler = new HNCrawler(5);

var timeout = 180; // in seconds

emitter.on('digging_pop', function() {
  crawler.run('/news', function() {
    console.log("Will dig HN Newest News in " + timeout + "sec");
    setTimeout(function() {
      emitter.emit('digging_new');
    }, timeout * 1000);
  });
});

emitter.on('digging_new', function() {
  crawler.run('/newest', function() {
    console.log("Will dig HN Popular News in " + timeout + "sec");
    setTimeout(function() {
      emitter.emit('digging_pop');
    }, timeout * 1000);
  });
});

emitter.emit('digging_pop');
