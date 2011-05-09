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
    alert("Can't find this article on HN");
  }
}
