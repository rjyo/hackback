/**
 * Module dependencies.
 */

var express = require('express'),
    sys = require('sys'),
    crypto = require('crypto'),
    app = module.exports = express.createServer(),
    models = require('./model');

var News = models.News;
var HNHost = "http://news.ycombinator.com";

// Configuration

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
  app.use(express.logger('  \033[90m:method\033[0m \033[36m:url\033[0m \033[90m:response-timems\033[0m'));
});

app.configure('production', function() {
  app.use(express.errorHandler()); 
});

app.get('/', function(req, res) {
  res.render('index', {
    title: 'Back to HN'
  });
});

function sendJSONP (res, cb, json) {
  var jsonp = cb + '(' + JSON.stringify(json) + ')';
  res.header('Content-Type', 'application/javascript');
  res.send(jsonp);
}

app.get('/comment.:format?/:url/:cb?', function(req, res) {
  var url = req.params.url;
  var format = req.params.format;
  var cb = req.params.cb;

  News.findOne({href: url}, function(err, doc) {
    console.log(doc);
    if (err || doc === null) {
      console.log('Can not found any news with url = ' + url);
      var err_result = {
        errcode: -1
      };

      if (cb) {
        sendJSONP(res, cb, err_result);
      } else {
        res.send(err_result);
      }
    } else {
      console.log('Found news with url = ' + url);
      var result = {
          title: doc.title,
          href: doc.href,
          comment: HNHost + '/' + doc.comment
      };

      if (format == 'json') {
        if (cb) {
          sendJSONP(res, cb, result);
        } else {
          res.send(result);
        }
      } else {
        res.render('news', result);
      }
    }
  });
});


// Only listen on $ node app.js
if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}

// Start crawler job
var EventEmitter = require('node-evented').EventEmitter;
// var Crawler = require('./run');

// Do as you usual do!
var hncrawler = new EventEmitter();

hncrawler.on('digging', function() {

  // This line removes current listener from EventEmitter !
  //this.removeListener('digging');
  console.log("Will dig HN in 10 sec");
  setTimeout(function() {
    hncrawler.emit('digging');
  }, 10000);
});

hncrawler.emit('digging'); // Works!
