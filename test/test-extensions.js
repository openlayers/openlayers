function waitsFor(condition, message, timeout, callback) {
  var timeWaiting = 0;

  function inner() {
    if (condition()) {
      callback();
      return;
    }

    if (timeWaiting >= timeout) {
      throw new Error(message);
    }

    timeWaiting += 10;
    setTimeout(inner, 10);
  }

  inner();
}


// helper functions for async testing
(function(global) {

  function afterLoad(type, path, next) {
    var done, error, data;

    goog.net.XhrIo.send(path, function(event) {
      var xhr = event.target;
      if (xhr.isSuccess()) {
        if (type === 'xml') {
          data = xhr.getResponseXml();
        } else if (type === 'json') {
          data = xhr.getResponseJson();
        } else {
          data = xhr.getResponseText();
        }
      } else {
        error = new Error(path + ' loading failed: ' + xhr.getStatus());
      }
      done = true;
    });

    waitsFor(function() {
      return done;
    }, 'XHR timeout', 1000, function() {
      if (error) {
        throw error;
      }
      next(data);
    });
  }


  /**
   * @param {string} path Relative path to file (e.g. 'spec/ol/foo.json').
   * @param {function(Object)} next Function to call with response object on
   *     success.  On failure, an error is thrown with the reason.
   */
  global.afterLoadJson = function(path, next) {
    afterLoad('json', path, next);
  };


  /**
   * @param {string} path Relative path to file (e.g. 'spec/ol/foo.txt').
   * @param {function(string)} next Function to call with response text on
   *     success.  On failure, an error is thrown with the reason.
   */
  global.afterLoadText = function(path, next) {
    afterLoad('text', path, next);
  };


  /**
   * @param {string} path Relative path to file (e.g. 'spec/ol/foo.xml').
   * @param {function(Document)} next Function to call with response xml on
   *     success.  On failure, an error is thrown with the reason.
   */
  global.afterLoadXml = function(path, next) {
    afterLoad('xml', path, next);
  };

})(this);
