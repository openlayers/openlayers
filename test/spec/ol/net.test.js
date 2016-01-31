goog.provide('ol.test.net');


describe('ol.net', function() {

  describe('jsonp()', function() {
    var head = goog.global.document.getElementsByTagName('head')[0];
    var origAppendChild = head.appendChild;
    var origSetTimeout = goog.global.setTimeout;
    var key;

    function createCallback(url, done) {
      var callback = function(data) {
        expect(data).to.be(url + key);
        done();
      };
      key = 'olc_' + goog.getUid(callback);
      return callback;
    }

    beforeEach(function() {
      head.appendChild = function(element) {
        origSetTimeout(function() {
          goog.global[key](element.getAttribute('src'));
        }, 0);
      };
      goog.global.setTimeout = function(fn, time) {
        origSetTimeout(fn, 100);
      };
    });

    afterEach(function() {
      head.appendChild = origAppendChild;
      goog.global.setTimeout = origSetTimeout;
    });

    it('appends callback param to url, cleans up after call', function(done) {
      ol.net.jsonp('foo', createCallback('foo?callback=', done));
    });
    it('appends correct callback param to a url with query', function(done) {
      var callback = createCallback('http://foo/bar?baz&callback=', done);
      ol.net.jsonp('http://foo/bar?baz', callback);
    });
    it('calls errback when jsonp is not executed, cleans up', function(done) {
      head.appendChild = function() {};
      function callback() {
        expect.fail();
      }
      function errback() {
        expect(goog.global[key]).to.be(undefined);
        done();
      }
      ol.net.jsonp('foo', callback, errback);
    });
    it('accepts a custom callback param', function(done) {
      var callback = createCallback('foo?mycallback=', done);
      ol.net.jsonp('foo', callback, undefined, 'mycallback');
    });

  });

});


goog.require('ol.net');
