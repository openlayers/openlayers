import {
  getJSON,
  jsonp as requestJSONP,
  resolveUrl,
} from '../../../../src/ol/net.js';
import {getUid} from '../../../../src/ol/util.js';

describe('ol/net', function () {
  describe('getJSON()', function () {
    it('returns a promise that resolves to a parsed JSON object', function (done) {
      const url = 'spec/ol/data/point.json';
      const result = getJSON(url);
      expect(result).to.be.a(Promise);
      result.then(function (json) {
        expect(json).to.be.an(Object);
        expect(json.type).to.be('FeatureCollection');
        done();
      });
      result.catch(done);
    });
  });

  describe('resolveUrl()', function () {
    it('resolves an absolute URL given a base and relative URL', function () {
      const url = resolveUrl('https://example.com/base/', 'relative/path');
      expect(url).to.be('https://example.com/base/relative/path');
    });

    it('returns the second arg if it is an absolute URL', function () {
      const url = resolveUrl(
        'https://example.com',
        'https://other-example.com'
      );
      expect(url).to.be('https://other-example.com');
    });
  });

  describe('jsonp()', function () {
    const head = document.head;
    const origAppendChild = head.appendChild;
    const origCreateElement = document.createElement;
    const origSetTimeout = setTimeout;
    let key, removeChild;

    function createCallback(url, done) {
      removeChild = sinon.spy();
      const callback = function (data) {
        expect(data).to.be(url + key);
        expect(removeChild.called).to.be(true);
        done();
      };
      key = 'olc_' + getUid(callback);
      return callback;
    }

    beforeEach(function () {
      const element = {};
      document.createElement = function (arg) {
        if (arg == 'script') {
          return element;
        }
        return origCreateElement.apply(document, arguments);
      };
      head.appendChild = function (el) {
        if (el === element) {
          element.parentNode = {
            removeChild: removeChild,
          };
          origSetTimeout(function () {
            window[key](element.src);
          }, 0);
        } else {
          origAppendChild.apply(head, arguments);
        }
      };
      setTimeout = function (fn, time) {
        origSetTimeout(fn, 100);
      };
    });

    afterEach(function () {
      document.createElement = origCreateElement;
      head.appendChild = origAppendChild;
      setTimeout = origSetTimeout;
    });

    it('appends callback param to url, cleans up after call', function (done) {
      requestJSONP('foo', createCallback('foo?callback=', done));
    });
    it('appends correct callback param to a url with query', function (done) {
      const callback = createCallback('http://foo/bar?baz&callback=', done);
      requestJSONP('http://foo/bar?baz', callback);
    });
    it('calls errback when jsonp is not executed, cleans up', function (done) {
      head.appendChild = function (element) {
        element.parentNode = {
          removeChild: removeChild,
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
    it('accepts a custom callback param', function (done) {
      const callback = createCallback('foo?mycallback=', done);
      requestJSONP('foo', callback, undefined, 'mycallback');
    });
  });
});
