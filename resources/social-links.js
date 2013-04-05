

// add tweet buttons (adapated from https://twitter.com/about/resources/buttons)
(function() {
  var self = document.getElementsByTagName('script')[0];
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = '//platform.twitter.com/widgets.js';
  self.parentNode.insertBefore(script, self);
})();


// add g+1 buttons (adapted from https://developers.google.com/+/web/+1button)
(function() {
  var self = document.getElementsByTagName('script')[0];
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = 'https://apis.google.com/js/plusone.js';
  self.parentNode.insertBefore(script, self);
})();
