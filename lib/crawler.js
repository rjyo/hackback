var jsdom = require("jsdom"),
    Log = require('log'),
    log = new Log(Log.INFO),
    models = require('../model');

var host = "http://news.ycombinator.com";

function HNCrawler(pages) {
  this.pages = pages || 3;
  this.counter = 0;
  this.onCompleted = undefined;
  this.page = 1;
}

HNCrawler.prototype.run = function(url, cb) {
  this.onCompleted = cb;

  // do crawling
  var crawler = this;

  var _complete = function(err, doc) {
    crawler.counter--;
    //log.info(crawler.counter + "," + crawler.pages);
    if (crawler.pages <= crawler.page && crawler.counter === 0) {
      crawler.counter = 0;
      crawler.page = 1;
      log.info("All saved.");
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
        log.info("Failed in crawling HN page: " + crawler.page);
        log.info(errors);
        process.exit(1);
      }

      var $ = window.$;
      var links = $('td.title a');
      log.info("Digged page " + crawler.page + ", found "+ links.length + " links ...");

      if (links.length === 0) {
        log.info(window.document.innerHTML);
        crawler.onCompleted();
        log.info("Not all pages crawled, ending");
        return;
      }

      var href, next = function() {
        crawler.run(href, crawler.onCompleted);
      };

      for (var i = 0; i < links.length; i++) {
        var link = $(links[i]);
        var commentlink = $(link.parent().parent().next().find("a")).last();

        href = link.attr('href');
        var title = link.html();
        var comment = commentlink.attr('href');

        if (commentlink.html() === null) {
          crawler.page++;

          if (crawler.page <= crawler.pages) {
            var sleepTime = 15 + Math.random() * 15;
            log.info("Sleep for " + sleepTime + " secs");
            setTimeout(next, sleepTime * 1000);
          }
          break;
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

var c = new HNCrawler(1);
c.run("/news", function() {
  log.info("finished");
//  process.exit(0);
});

*/

exports.HNCrawler = HNCrawler;
