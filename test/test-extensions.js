// helper functions for async testing
(function(global) {

  function afterLoad(type, path, next) {
    goog.net.XhrIo.send(path, function(event) {
      var xhr = event.target;
      var data;
      if (xhr.isSuccess()) {
        if (type === 'xml') {
          data = xhr.getResponseXml();
        } else if (type === 'json') {
          data = xhr.getResponseJson();
        } else {
          data = xhr.getResponseText();
        }
      } else {
        throw new Error(path + ' loading failed: ' + xhr.getStatus());
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
