/**
 * Module dependencies.
 */

var express = require('express'),
    sys = require('sys'),
    crypto = require('crypto'),
    app = module.exports = express.createServer(),
    models = require('./model');

var News = models.News;

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


function chooseLayout(req) {
  var layout = !req.headers['x-pjax'];
  var ua = req.headers['user-agent'];

  // if (layout && (ua && ua.match(/(iPhone|iPod|Android)/))) {
  //   layout = 'mobile';
  // }

  return layout;
}

app.get('/', function(req, res) {

  res.render('index', {
    title: 'Geolary - Worldwide Salary - the Secret You Should Know!',
    layout: chooseLayout(req)
  });
});

app.get('/privacy.html', function(req, res) {
  var useLayout = !req.headers['x-pjax'];

  res.render('privacy', {
    title: 'Geolary - Privacy Policy',
    layout: chooseLayout(req)
  });
});

// JSON API
// Listing of Articles
app.get('/salaries/json/:long,:lat/:device_token?', function(req, res) {
  var loc_long = Number(req.params.long);
  var loc_lat = Number(req.params.lat);
  var token = req.params.device_token;

  models.getStats(loc_long, loc_lat, token, function(result) {
    res.send(result);
  });
});

// Show webpage salary with lng/lat
app.get('/salaries/:long,:lat/:device_token?', function(req, res) {
  var loc_long = Number(req.params.long);
  var loc_lat = Number(req.params.lat);
  var token = req.params.device_token;

  var layout = chooseLayout(req);
  var mapSize = layout == 'mobile'? '300x200' : '520x340';

  models.getStats(loc_long, loc_lat, token, function(result) {
    res.render('salaries/show', {
      title: 'Geolary - Worldwide Salary',
      long: loc_long,
      lat: loc_lat,
      stats: result,
      mapSize: mapSize,
      layout: layout
    });
  });
});

app.post('/query/zip', function(req, res) {
  var zip = req.body.zip;

  if (isNaN(zip)) {
    res.send({
      errcode: -1
    });
    return;
  } else {
    console.log('finding zip: ' + zip);
    Zip.findOne({zip_code: zip}, function(err, doc) {
      if (err || doc === null) {
        console.log('not found');
        res.send({
          errcode: -1
        });
      } else {
        res.send(doc);
      }
    });
  }
});

// Create/Update salaries
app.post('/salaries/json', function(req, res) {
  var row = req.body.salary;
  var loc_long = Number(row['loc.long']);
  var loc_lat = Number(row['loc.lat']);
  delete(row['loc.long']);
  delete(row['loc.lat']);
  row.loc = {'long': loc_long, 'lat': loc_lat};

  // check sign
  var data = row.device_id + row.currency + row.amount + "huafen";
  var digest = crypto.createHash('md5').update(data).digest("hex");
  if (digest != row.sign) {
    console.log('failed to pass sign validation.');
    res.send({errcode: -1, msg: 'failed to pass sign validation.'});
  } else if (row.amount < 1000) {
    console.log('strange amount: ' + row.amount);
    res.send({errcode: -2, msg: 'annual salary less than 1000, pass.'});
  } else {
    // no need to save sign
    delete(row.sign);

    row.amount = Number(row.amount.trim().replace(' ', ''));

    Currency.findOne({name: row.currency}, function(err, c) {
      if (err || !c) {
        console.log(err);
      } else {
        console.log('Calculating salary in USD.');
        row.usd_amount = row.amount / c.price;

        // omit too high / too low numbers
        if (row.usd_amount >= 2000000 || row.usd_amount < 5000) {
          console.log('omit too high / too low numbers: ' + row.usd_amount);
          res.send({errcode: 0});
        } else {
          row.fake = false;
          row.created_at = Date.now();

          console.log(row);

          Salary.collection.findAndModify({device_id: row.device_id}, [], 
              {$set: row}, {'new': true, upsert: true}, function(err) {
            if (err) {
              console.log(err);
              res.send({errcode: -1, msg: 'failed to update record.'});
            } else {
              console.log('Created/Updated');
              res.send({errcode: 0});
            }
          });
        }
      }
    });
  }
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}

