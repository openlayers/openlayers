goog.provide('ol.test.Expression');

describe('ol.Expression', function() {

  describe('constructor', function() {
    it('creates an expression', function() {
      var exp = new ol.Expression('foo');
      expect(exp).toBeA(ol.Expression);
    });
  });

  describe('#evaluate()', function() {

    it('evaluates and returns the result', function() {
      // test cases here with unique values only (lack of messages in expect)
      var cases = [{
        source: '42', result: 42
      }, {
        source: '10 + 10', result: 20
      }, {
        source: '"a" + "b"', result: 'ab'
      }, {
        source: 'Math.floor(Math.PI)', result: 3
      }, {
        source: 'ol', result: ol
      }, {
        source: 'this', result: goog.global
      }];

      var c, exp;
      for (var i = 0, ii = cases.length; i < ii; ++i) {
        c = cases[i];
        exp = new ol.Expression(c.source);
        expect(exp.evaluate()).toBe(c.result);
      }
    });

    it('accepts an optional this argument', function() {
      function Thing() {
        this.works = true;
      };

      var exp = new ol.Expression('this.works ? "yes" : "no"');
      expect(exp.evaluate(new Thing())).toBe('yes');
      expect(exp.evaluate({})).toBe('no');
    });

    it('accepts an optional scope argument', function() {
      var exp;
      var scope = {
        greeting: 'hello world',
        punctuation: '!',
        pick: function(array, index) {
          return array[index];
        }
      };

      // access two members in the scope
      exp = new ol.Expression('greeting + punctuation');
      expect(exp.evaluate({}, scope)).toBe('hello world!');

      // call a function in the scope
      exp = new ol.Expression(
          'pick([10, 42, "chicken"], 2) + Math.floor(Math.PI)');
      expect(exp.evaluate({}, scope)).toBe('chicken3');

    });

    it('throws on error', function() {
      var exp = new ol.Expression('@*)$(&');
      expect(function() {exp.evaluate()}).toThrow();
    });

  });

});

goog.require('ol.Expression');
