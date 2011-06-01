var jsdom   = require('jsdom')
  , request = require('request')
  , Log     = require('log')
  , log     = new Log(Log.INFO)
  , util    = require('util')
  , models  = require('./model')
  , News    = models.News;

var host = "http://news.ycombinator.com";

function HNCrawler(pages) {
  this.pages = pages || 3;
  this.onCompleted = undefined;
  this.page = 1;
}

HNCrawler.prototype.done = function() {
  log.info("All done!");
  this.page = 1;
  if (this.onCompleted) {
    this.onCompleted();
  }
};

HNCrawler.prototype.run = function(url, cb) {
  log.info("digging " + host + url);

  var self = this;
  this.onCompleted = cb;

  // use request as jsdom can't set user-agent
  var target = {};
  target.uri = host + url;
  target.method = "GET";
  target.headers = {"user-agent": "hackback-crawler-1.0"};

  try {
    request(target, function(error, response, body) {
      jsdom.env(body, [], function(errors, window) {
        if (errors) {
          log.error(errors);
          log.info("Failed in crawling HN page: " + self.page);
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
            row.href = href[0].getAttribute('href');
            row.title = href[0].innerHTML;

            var nextTr = links[i].parentNode.nextSibling;
            if (nextTr) {
              var group2 = nextTr.getElementsByTagName('a');
              var l2 = group2[group2.length - 1];
              row.comment = l2.getAttribute('href');
              var c_count = l2.innerHTML.match(/(\d+) comments?/);
              row.c_count = c_count ? c_count[1] : 0;
            } else {
              nextHref = row.href;
              break;
            }

            News.saveNews(row.title, row.href, row.comment, row.c_count);
          }
        };

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
    });
  } catch (e) {
    log.error('failed to crawl');
    log.error(e);
  }
};

exports.HNCrawler = HNCrawler;
