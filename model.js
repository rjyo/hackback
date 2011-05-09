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
  console.log(db);
}

Schema = mongoose.Schema;

// News schema
var News= new Schema({
  title:   {type: String, default: '', required: true, index: true },
  href:    {type: String, default: '', required: true, index: true },
  comment: {type: String, default: '', required: true},
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
});

mongoose.model('News', News);
var News = exports.News = db.model('News'); // as we attained db variable, db.model not mongoose.model

function saveNews(title, href, comment, callback) {
  var doc = {};
  doc.title = title;
  doc.href = href;
  doc.comment = comment;

  console.log("try saving: " + doc.title);

  // News.findOne({href: href}, function(err, d) {
  //   if (!err) {
  //     if (d === null) {
  //       console.log("not found, save one");
  //       var news = new News(doc);
  //       news.save(function(err) {
  //         console.log('Created: ' + doc.title);
  //       });
  //     } else {
  //       console.log("found, no need to save.");
  //     }
  //   }
  //   if (callback) {
  //     callback(err, doc);
  //   }
  // });

  News.collection.findAndModify({ href: doc.href}, [],
    {$set: doc}, {'new': false, upsert: true}, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log('Updated/Created: ' + doc.title);
    }
    if (callback) {
      callback(err, doc);
    }
  });
}

exports.saveNews = saveNews;
