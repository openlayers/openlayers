beforeEach(function() {
  var parent = this.getMatchersClass_();
  this.addMatchers({
    toBeA: function(type) {
      return this.actual instanceof type;
    },
    toRoughlyEqual: function(other, tol) {
      return Math.abs(this.actual - other) <= tol;
    }
  });
});

// helper functions for async testing
(function(global) {

  function afterLoad(type, path, next) {
    var done, error, data;
    runs(function() {
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
    });
    waitsFor(function() {
      return done;
    });
    runs(function() {
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

