var jsdom = require("jsdom"),
    models = require('./model');

var News = models.News;
var host = "http://news.ycombinator.com";

// how many pages will this crawler dig into
var pages = 3;
var counter = 0;

function onCompleted(err, doc) {
  counter--;
  if (pages === 0 && counter === 0) {
    console.log("All saved.");
    process.exit(0);
  }

  if (err) {
    console.log(err);
    console.log(doc);
  }
}

function crawlHN(url) {
  if (pages === 0) {
    console.log("All pages crawled.");
    return;
  }

  jsdom.env(host + url, [ 'jquery-1.6.min.js' ],
    function(errors, window) {
      if (errors) {
        console.log("failed in crawling HN page: " + (4 - pages));
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
          console.log("this is the more link: " + host + href);
          console.log("digging page " + (4 - pages) + " ...");

          pages--;
          crawlHN(href);
        } else {
          counter++;
          models.saveNews(title, href, comment, onCompleted);
        }
      }
  });
}

crawlHN("/news");
