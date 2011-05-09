var jsdom = require("jsdom"),
    models = require('./model');

var host = "http://news.ycombinator.com";

function HNCrawler(pages) {
  this.pages = pages || 3;
  this.counter = 0;
  this.onCompleted = undefined;
  this.page = 1;
}

HNCrawler.prototype.run = function(url, cb) {
  this.onCompleted = cb;

  if (this.pages === 0) {
    console.log("All pages crawled.");
    return;
  }

  // do crawling
  var crawler = this;
  var page = this.page;

  var _complete = function(err, doc) {
    crawler.counter--;
    //console.log(crawler.counter + "," + crawler.pages);
    if (crawler.pages == page && crawler.counter === 0) {
      crawler.counter = 0;
      crawler.page = 1;
      console.log("All saved.");
      if (crawler.onCompleted) {
        crawler.onCompleted();
      }
    }

    if (err) {
      console.error(err);
      console.error(doc);
    }
  };


  jsdom.env(host + url, [ 'jquery-1.6.min.js' ],
    function(errors, window) {
      if (errors) {
        console.log("failed in crawling HN page: " + crawler.page);
        console.log(errors);
        process.exit(1);
      }

      console.log("digged page " + page + " ...");

      var $ = window.$;
      var links = $('td.title a');
      for (var i = 0; i < links.length; i++) {
        var link = $(links[i]);
        var commentlink = $(link.parent().parent().next().find("a")).last();

        var href = link.attr('href');
        var title = link.html();
        var comment = commentlink.attr('href');

        if (commentlink.html() === null) {
          crawler.page++;
          console.log("this is the more link: " + host + href);

          if (crawler.page <= crawler.pages) {
            crawler.run(href, crawler.onCompleted);
          }
        } else {
          crawler.counter++;
          models.saveNews(title, href, comment, _complete);
        }
      }
  });
};

// how many pages will this crawler dig into

/*
 * a demo here
 *
 ----------------
var c = new HNCrawler(1);
c.run("/news", function() {
  console.log("finished");
//  process.exit(0);
});
*/

exports.HNCrawler = HNCrawler;

// Start crawler job
var EventEmitter = require('node-evented').EventEmitter;

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
