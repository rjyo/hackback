var mongoose = require('mongoose');
var boundServices = process.env.VCAP_SERVICES ? JSON.parse(process.env.VCAP_SERVICES) : null;
var credentials = null;
var db = null;

if (boundServices === null) {
  db = mongoose.connect('mongodb://localhost/hackback');
} else {
  credentials = boundServices['mongodb-1.8'][0]['credentials'];
  db = mongoose.createConnection("mongodb://"
                           + credentials["username"]
                           + ":" + credentials["password"]
                           + "@" + credentials["hostname"]
                           + ":" + credentials["port"]
                           + "/" + credentials["db"]);
}

Schema = mongoose.Schema;

// News schema
var News = new Schema({
  title:      { type: String, default: '', required: true, index: false },
  href:       { type: String, default: '', required: true, index: true },
  comment:    { type: String, default: '', required: true},
  c_count:    { type: Number, default: 0},
  created_at: { type: Date, default: Date.now},
  updated_at: { type: Date, default: Date.now}
});

News.static('saveNews', function (title, href, comment, c_count, fn) {
  fn = fn ? fn : function() {};

  var doc = {};
  doc.title = title;
  doc.href = href;
  doc.comment = comment;
  doc.c_count = c_count;
  doc.updated_at = new Date();

  News.collection.findAndModify({ href: doc.href}, [],
    {$set: doc}, {'new': false, upsert: true}, function(err) {
    if (err) {
      console.log(err);
    }
    fn(err, doc);
  });
});

mongoose.model('News', News);

// AccessCounter model
var AccessCounter = new Schema({
  date:         { type: Number, required: true, index: true },
  hit_counter:  { type: Number, required: true, default: 0 },
  miss_counter: { type: Number, required: true, default: 0 }
});

AccessCounter.static('incr', function(type) {
  var today = Date.now();
  today = (today - today % 86400000);

  var data = { $inc: {} };
  data.$inc[type + '_counter'] = 1;

  var mode = { 'new': false, upsert: true };

  AccessCounter.collection.findAndModify({ date: today }, [], data, mode , function(err) {
    if (err) {
      console.log(err);
    }
  });
});

mongoose.model('AccessCounter', AccessCounter);

// as we attained db variable, db.model not mongoose.model
var News = exports.News = db.model('News');
var AccessCounter = exports.AccessCounter = db.model('AccessCounter');

