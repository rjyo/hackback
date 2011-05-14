/**
 * Module dependencies.
 */

require.paths.unshift('./node_modules');

var express = require('express'),
    sys = require('sys'),
    crypto = require('crypto'),
    app = module.exports = express.createServer(),
    models = require('./model'),
    Log = require('log'),
    log = new Log(Log.INFO);

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
  app.use(express.logger('[:date] INFO :method :url :response-timems'));
});

app.get('/', function(req, res) {
  log.info('GET /');
  res.render('index', {
    title: 'Say Hello to HackBack'
  });
});

function sendJSONP (res, cb, json) {
  var jsonp = cb + '(' + JSON.stringify(json) + ')';
  res.header('Content-Type', 'application/javascript');
  res.send(jsonp);
}

app.get('/comment.:format?/:url/:cb?', function(req, res) {
  log.info('GET /comment');
  var url = req.params.url;
  var format = req.params.format;
  var cb = req.params.cb;

  News.findOne({href: url}, function(err, doc) {
    if (err || doc === null) {
      log.info('Can not found any news with url = ' + url);
      var err_result = {
        errcode: -1
      };

      if (cb) {
        sendJSONP(res, cb, err_result);
      } else {
        res.send(err_result);
      }
    } else {
      log.info('Found news with url = ' + url);
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

app.get('/summary', function (req, res) {
  log.info('GET /summary');

  News.count({}, function(err, count) {
    if (err) {
      res.send({err_result: -1});
    } else {
      News.find({})
        .sort('_id','descending')
        .limit(1)
        .each(function(err, doc) {
          if (!err) {
            res.send({count: count, last_insert: doc});
          }
          return;
        });
    }
  });
});


// Only listen on $ node app.js
if (!module.parent) {
  app.listen(process.env.VMC_APP_PORT || 3000);
  log.info("Express server listening on port " + app.address().port);
}

var crawler = require('./crawl_job');
