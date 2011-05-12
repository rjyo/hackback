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
var News= new Schema({
  title:   {type: String, default: '', required: true, index: false },
  href:    {type: String, default: '', required: true, index: true },
  comment: {type: String, default: '', required: true},
  c_count: {type: Number, default: 0},
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
});

mongoose.model('News', News);
var News = exports.News = db.model('News'); // as we attained db variable, db.model not mongoose.model

function saveNews(title, href, comment, c_count ,callback) {
  var doc = {};
  doc.title = title;
  doc.href = href;
  doc.comment = comment;
  doc.c_count = c_count;

  News.collection.findAndModify({ href: doc.href}, [],
    {$set: doc}, {'new': false, upsert: true}, function(err) {
    if (err) {
      console.log(err);
    }
    if (callback) {
      callback(err, doc);
    }
  });
}

exports.saveNews = saveNews;
