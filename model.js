var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/hncrawler');
Schema = mongoose.Schema;

// Salary schema
var News= new Schema({
  title:   {type: String, default: '', required: true, index: true },
  href:    {type: String, default: '', required: true, index: true },
  comment: {type: String, default: '', required: true},
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
});
 
mongoose.model('News', News);
var News = exports.News = mongoose.model('News');

function saveNews(title, href, comment, callback) {
  var doc = {};
  doc.title = title;
  doc.href = href;
  doc.comment = comment;

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
