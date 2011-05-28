var jsdom = require('jsdom'),
    Log = require('log'),
    log = new Log(Log.INFO),
    util = require('util'),
    models = require('../model');

var News = models.News;
var host = "http://news.ycombinator.com";

function HNCrawler(pages) {
  this.pages = pages || 3;
  this.onCompleted = undefined;
  this.page = 1;
}

HNCrawler.prototype.done = function() {
  console.log("All done!");
  this.page = 1;
  if (this.onCompleted) {
    this.onCompleted();
  }
};

HNCrawler.prototype.run = function(url, cb) {
  this.onCompleted = cb;

  // do crawling
  var self = this;

  jsdom.env(host + url, [], function(errors, window) {
      if (errors) {
        log.info("Failed in crawling HN page: " + self.page);
        log.info(errors);
        process.exit(1);
      }

      var links = window.document.getElementsByClassName("title");

      log.info("Digged page " + self.page + ", found "+ links.length + " links ...");

      if (links.length === 0) {
        log.info(window.document.innerHTML);
        self.done();
        log.info("Not all pages crawled, ending");
        return;
      }

      var nextHref;

      for (var i = 0; i < links.length; i++) {
        var row = {};
        var href = links[i].getElementsByTagName('a');
        if (href.length) {
          row.link = href[0].getAttribute('href');
          row.title = href[0].innerHTML;

          var nextTr = links[i].parentNode.nextSibling;
          if (nextTr) {
            var group2 = nextTr.getElementsByTagName('a');
            var l2 = group2[group2.length - 1];
            row.comment = l2.getAttribute('href');
            var c_count = l2.innerHTML.match(/(\d+) comments?/);
            row.c_count = c_count ? c_count[1] : 0;
          } else {
            nextHref = row.link;
            break;
          }

          News.saveNews(row.title, row.href, row.comment, row.c_count);
        }
      };

      // log.info('done');
      // cb();
      // return;

      self.page++;
      if (self.page <= self.pages) {
        var sleepTime = 15 + Math.random() * 15;
        log.info("Sleep for " + sleepTime + " secs");
        setTimeout(function() {
          self.run(nextHref, self.onCompleted);
        }, sleepTime * 1000);
      } else {
        self.done();
      }
  });
};

// how many pages will this crawler dig into

/*
 * a demo here

var c = new HNCrawler(1);
c.run("/news", function() {
  log.info("finished");
//  process.exit(0);
});

*/

exports.HNCrawler = HNCrawler;
