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
    console.log(crawler.counter + "," + crawler.pages);
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


  console.log("digging page " + page + " ...");
  jsdom.env(host + url, [ 'jquery-1.6.min.js' ],
    function(errors, window) {

      if (errors) {
        console.log("failed in crawling HN page: " + crawler.page);
        console.log(errors);
        process.exit(1);
      }
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

          if (page <= crawler.pages) {
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
var c = new HNCrawler(3);
c.run("/news", function() {
  console.log("hello");
  process.exit(0);
});
*/

exports.HNCrawler = HNCrawler;
