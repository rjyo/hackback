/**
 * Module dependencies.
 */
require.paths.unshift('./node_modules'); // for CloudFoundry.com

var express       = require('express')
  , sys           = require('sys')
  , crypto        = require('crypto')
  , app           = module.exports = express.createServer()
  , models        = require('./lib/model')
  , Log           = require('log')
  , log           = new Log(Log.INFO)
  , News          = models.News
  , AccessCounter = models.AccessCounter;

var HNHost = "http://news.ycombinator.com";  // Configuration

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.use(express.logger('[:date] INFO :method :url :response-timems'));
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

app.get('/', function(req, res) {
  log.info('GET /');
  res.render('index', {
    title: 'Say Hello to HackBack'
  });
});

function sendJSONP(res, cb, json) {
  var jsonp = cb + '(' + JSON.stringify(json) + ')';
  res.header('Content-Type', 'application/javascript');
  res.send(jsonp);
}

app.get('/api/comment/:url/:cb?', function(req, res) {
  log.info('GET /comment');
  var url = req.params.url;
  var cb = req.params.cb;


  News.findOne({href: url}, function(err, doc) {
    var result;

    if (err || doc === null) {
      AccessCounter.incr('miss');
      log.info('Can not found any news with url = ' + url);
      result = { errcode: -1 };
    } else {
      AccessCounter.incr('hit');
      log.info('Found news with url = ' + url);
      result = {
          title: doc.title,
          href: doc.href,
          comment: HNHost + '/' + doc.comment,
          count: doc.c_count
      };
    }

    if (cb) {
      sendJSONP(res, cb, result);
    } else {
      res.send(result);
    }
  });
});

app.get('/api/statistics', function(req, res) {
  AccessCounter.stats(function (err, doc) {
    res.send(doc);
  });
});

app.get('/api/summary', function(req, res) {
  log.info('GET /summary');

  News.count({}, function(err, count) {
    if (err) {
      log.error(err);
      res.send(500);
    } else {
      res.send({count: count, last_run: crawler.last_run()});
    }
  });
});

app.get('/api/gc', function(req, res, next) {
  log.info('GET /gc');

  var d = Date.now();
  d = d - 14 * 24 * 60 * 60 * 1000; // remove links 2 weeks ago
  var valid_date = new Date(d);

  News.count({}, function(err, count) {
    var before = count;

    News.remove({'updated_at': { $lt : valid_date}}, function(err) {
      if (err) {
        next(err);
        return;
      }

      News.count({}, function(err, count) {
        res.send({before: before, after: count});
      });
    });
  });
});

// Only listen on $ node app.js
if (!module.parent) {
  app.listen(process.env.VMC_APP_PORT || 3000);
  log.info("Express server listening on port " + app.address().port);

  require('./lib/job'); // start crawler job
}

