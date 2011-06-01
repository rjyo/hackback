
var l=window.location;var el=encodeURIComponent(l.href);var apiUrl="http://hackback.cloudfoundry.com/api/comment/";function jsonp(src){var s=document.createElement('script');old=document.getElementById('srvCall');old&&document.body.removeChild(old);s.charset='UTF-8';s.id='srvCall';document.body.insertBefore(s,document.body.firstChild);s.src=src+'?'+Date.now();}
function srvCallback(doc){if(!doc.errcode){window.location=doc.comment;}else{var answer=confirm("Can't find this article on HackerNews recently. Do you want to post it?");if(answer){window.location="http://news.ycombinator.com/submitlink?u="+
encodeURIComponent(document.location)+"&t="+
encodeURIComponent(document.title);}}}
if(/^news\.ycombinator\.com$/.test(l.host)){console.log('Already on HN');}else{jsonp(apiUrl+el+"/srvCallback");}