var l = window.location.href;
var el = encodeURIComponent(l);
var apiUrl = "http://hackback.cloudfoundry.com/comment.json/";

function jsonp(src){
  var s = document.createElement('script');
      old = document.getElementById('srvCall');
  old && document.body.removeChild(old);
  s.charset = 'UTF-8';
  s.id = 'srvCall';
  document.body.insertBefore(s, document.body.firstChild);
  s.src = src + '?' + new Date().getTime();
}

jsonp(apiUrl + el + "/srvCallback");

function srvCallback (doc) {
  if (!doc.errcode) {
    window.location = doc.comment;
  } else {
    var answer = confirm("Can't find this article on HackerNews recently. Do you want to post it?");
    if (answer) {
      window.location = "http://news.ycombinator.com/submitlink?u=" + 
        encodeURIComponent(document.location) + "&t=" + 
        encodeURIComponent(document.title);
    }
  }
}
