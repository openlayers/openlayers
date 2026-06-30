import {assert} from 'chai';
import {
  getJSON,
  jsonp as requestJSONP,
  resolveUrl,
} from '../../../../src/ol/net.js';
import {getUid} from '../../../../src/ol/util.js';

describe('ol/net', function () {
  describe('getJSON()', function () {
    it('returns a promise that resolves to a parsed JSON object', () =>
      new Promise((resolve, reject) => {
        const url = 'spec/ol/data/point.json';
        const result = getJSON(url);
        assert.instanceOf(result, Promise);
        result.then(function (json) {
          assert.instanceOf(json, Object);
          assert.strictEqual(json.type, 'FeatureCollection');
          resolve();
        });
        result.catch(reject);
      }));
  });

  describe('resolveUrl()', function () {
    it('resolves an absolute URL given a base and relative URL', function () {
      const url = resolveUrl('https://example.com/base/', 'relative/path');
      assert.strictEqual(url, 'https://example.com/base/relative/path');
    });

    it('returns the second arg if it is an absolute URL', function () {
      const url = resolveUrl(
        'https://example.com',
        'https://other-example.com',
      );
      assert.strictEqual(url, 'https://other-example.com');
    });
  });

  describe('jsonp()', function () {
    const head = document.head;
    const origAppendChild = head.appendChild;
    const origCreateElement = document.createElement;
    const origSetTimeout = setTimeout;
    let key, removeChild;

    function createCallback(url, resolve) {
      removeChild = vi.fn();
      const callback = function (data) {
        assert.strictEqual(data, url + key);
        assert.isAbove(removeChild.mock.calls.length, 0);
        resolve();
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

    it('appends callback param to url, cleans up after call', () =>
      new Promise((resolve) => {
        requestJSONP('foo', createCallback('foo?callback=', resolve));
      }));
    it('appends correct callback param to a url with query', () =>
      new Promise((resolve) => {
        const callback = createCallback(
          'http://foo/bar?baz&callback=',
          resolve,
        );
        requestJSONP('http://foo/bar?baz', callback);
      }));
    it('calls errback when jsonp is not executed, cleans up', () =>
      new Promise((resolve) => {
        head.appendChild = function (element) {
          element.parentNode = {
            removeChild: removeChild,
          };
        };
        function callback() {
          assert.fail();
        }
        function errback() {
          assert.strictEqual(window[key], undefined);
          assert.isAbove(removeChild.mock.calls.length, 0);
          resolve();
        }
        requestJSONP('foo', callback, errback);
      }));
    it('accepts a custom callback param', () =>
      new Promise((resolve) => {
        const callback = createCallback('foo?mycallback=', resolve);
        requestJSONP('foo', callback, undefined, 'mycallback');
      }));
  });
});
