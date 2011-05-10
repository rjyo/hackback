// Start crawler job
var EventEmitter = require('node-evented').EventEmitter;
var HNCrawler = require('./lib/crawler').HNCrawler;

// Do as you usual do!
var emitter = new EventEmitter();
var crawler = new HNCrawler(4);

var timeout = 90;

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
