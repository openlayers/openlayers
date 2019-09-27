import {getUid} from '../../../src/ol/util.js';
import {jsonp as requestJSONP} from '../../../src/ol/net.js';

describe('ol.net', function() {

  describe('jsonp()', function() {
    const head = document.getElementsByTagName('head')[0];
    const origAppendChild = head.appendChild;
    const origCreateElement = document.createElement;
    const origSetTimeout = setTimeout;
    let key, removeChild;

    function createCallback(url, done) {
      removeChild = sinon.spy();
      const callback = function(data) {
        expect(data).to.be(url + key);
        expect(removeChild.called).to.be(true);
        done();
      };
      key = 'olc_' + getUid(callback);
      return callback;
    }

    beforeEach(function() {
      const element = {};
      document.createElement = function(arg) {
        if (arg == 'script') {
          return element;
        } else {
          return origCreateElement.apply(document, arguments);
        }
      };
      head.appendChild = function(el) {
        if (el === element) {
          element.parentNode = {
            removeChild: removeChild
          };
          origSetTimeout(function() {
            window[key](element.src);
          }, 0);
        } else {
          origAppendChild.apply(head, arguments);
        }
      };
      setTimeout = function(fn, time) {
        origSetTimeout(fn, 100);
      };
    });

    afterEach(function() {
      document.createElement = origCreateElement;
      head.appendChild = origAppendChild;
      setTimeout = origSetTimeout;
    });

    it('appends callback param to url, cleans up after call', function(done) {
      requestJSONP('foo', createCallback('foo?callback=', done));
    });
    it('appends correct callback param to a url with query', function(done) {
      const callback = createCallback('http://foo/bar?baz&callback=', done);
      requestJSONP('http://foo/bar?baz', callback);
    });
    it('calls errback when jsonp is not executed, cleans up', function(done) {
      head.appendChild = function(element) {
        element.parentNode = {
          removeChild: removeChild
        };
      };
      function callback() {
        expect().fail();
      }
      function errback() {
        expect(window[key]).to.be(undefined);
        expect(removeChild.called).to.be(true);
        done();
      }
      requestJSONP('foo', callback, errback);
    });
    it('accepts a custom callback param', function(done) {
      const callback = createCallback('foo?mycallback=', done);
      requestJSONP('foo', callback, undefined, 'mycallback');
    });

  });

});
