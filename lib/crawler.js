var jsdom = require("jsdom"),
    Log = require('log'),
    log = new Log(Log.INFO),
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

  jsdom.env(host + url, [ 'jquery-1.6.min.js' ],
    function(errors, window) {
      if (errors) {
        log.info("Failed in crawling HN page: " + self.page);
        log.info(errors);
        process.exit(1);
      }

      var $ = window.$;
      var links = $('td.title a');
      log.info("Digged page " + self.page + ", found "+ links.length + " links ...");

      if (links.length === 0) {
        log.info(window.document.innerHTML);
        self.done();
        log.info("Not all pages crawled, ending");
        return;
      }

      var href;

      for (var i = 0; i < links.length; i++) {
        var link = $(links[i]);
        var commentlink = $(link.parent().parent().next().find("a")).last();

        href = link.attr('href');
        var title = link.html();
        var comment = commentlink.attr('href');

        if (commentlink.html() !== null) {
          var c_count = commentlink.html().match(/(\d+) comments?/);
          c_count = c_count ? c_count[1] : 0;
          News.saveNews(title, href, comment, c_count);
        }
      }

      self.page++;
      if (self.page <= self.pages) {
        var sleepTime = 15 + Math.random() * 15;
        log.info("Sleep for " + sleepTime + " secs");
        setTimeout(function() {
          self.run(href, self.onCompleted);
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
