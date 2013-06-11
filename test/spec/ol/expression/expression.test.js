goog.provide('ol.test.expression');


describe('ol.expression.parse', function() {

  it('parses a string and returns an expression', function() {
    var expr = ol.expression.parse('foo');
    expect(expr).to.be.a(ol.expression.Expression);
  });

  describe('primary expressions', function() {
    // http://www.ecma-international.org/ecma-262/5.1/#sec-11.1

    it('parses identifier expressions', function() {
      var expr = ol.expression.parse('foo');
      expect(expr).to.be.a(ol.expression.Identifier);
      expect(expr.evaluate({foo: 'bar'})).to.be('bar');
    });

    it('consumes whitespace as expected', function() {
      var expr = ol.expression.parse('  foo  ');
      expect(expr).to.be.a(ol.expression.Identifier);
      expect(expr.evaluate({foo: 'bar'})).to.be('bar');
    });

    it('throws on invalid identifier expressions', function() {
      expect(function() {
        ol.expression.parse('3foo');
      }).throwException();
    });

    it('parses string literal expressions', function() {
      var expr = ol.expression.parse('"foo"');
      expect(expr).to.be.a(ol.expression.Literal);
      expect(expr.evaluate()).to.be('foo');
    });

    it('throws on unterminated string', function() {
      expect(function() {
        ol.expression.parse('"foo');
      }).throwException();
    });

    it('parses numeric literal expressions', function() {
      var expr = ol.expression.parse('.42e+2');
      expect(expr).to.be.a(ol.expression.Literal);
      expect(expr.evaluate()).to.be(42);
    });

    it('throws on invalid number', function() {
      expect(function() {
        ol.expression.parse('.42eX');
      }).throwException();
    });

    it('parses boolean literal expressions', function() {
      var expr = ol.expression.parse('false');
      expect(expr).to.be.a(ol.expression.Literal);
      expect(expr.evaluate()).to.be(false);
    });

    it('parses null literal expressions', function() {
      var expr = ol.expression.parse('null');
      expect(expr).to.be.a(ol.expression.Literal);
      expect(expr.evaluate()).to.be(null);
    });

  });

  describe('left-hand-side expressions', function() {
    // http://www.ecma-international.org/ecma-262/5.1/#sec-11.2

    it('parses member expressions with dot notation', function() {
      var expr = ol.expression.parse('foo.bar.baz');
      expect(expr).to.be.a(ol.expression.Member);
      var scope = {foo: {bar: {baz: 42}}};
      expect(expr.evaluate(scope)).to.be(42);
    });

    it('consumes whitespace as expected', function() {
      var expr = ol.expression.parse(' foo . bar . baz ');
      expect(expr).to.be.a(ol.expression.Member);
      var scope = {foo: {bar: {baz: 42}}};
      expect(expr.evaluate(scope)).to.be(42);
    });

    it('throws on invalid member expression', function() {
      expect(function() {
        ol.expression.parse('foo.4bar');
      }).throwException();
    });

    it('parses call expressions with literal arguments', function() {
      var expr = ol.expression.parse('foo(42, "bar")');
      expect(expr).to.be.a(ol.expression.Call);
      var scope = {
        foo: function(num, str) {
          expect(num).to.be(42);
          expect(str).to.be('bar');
          return str + num;
        }
      };
      expect(expr.evaluate(scope)).to.be('bar42');
    });

    it('throws on calls with unterminated arguments', function() {
      expect(function() {
        ol.expression.parse('foo(42,)');
      }).throwException();
    });

  });

  describe('unary operators', function() {
    // http://www.ecma-international.org/ecma-262/5.1/#sec-11.4

    it('parses logical not operator', function() {
      var expr = ol.expression.parse('!foo');
      expect(expr).to.be.a(ol.expression.Not);
      expect(expr.evaluate({foo: true})).to.be(false);
      expect(expr.evaluate({foo: false})).to.be(true);
      expect(expr.evaluate({foo: ''})).to.be(true);
      expect(expr.evaluate({foo: 'foo'})).to.be(false);
    });

    it('consumes whitespace as expected', function() {
      var expr = ol.expression.parse(' ! foo');
      expect(expr).to.be.a(ol.expression.Not);
      expect(expr.evaluate({foo: true})).to.be(false);
      expect(expr.evaluate({foo: false})).to.be(true);
    });

  });

  describe('multiplicitave operators', function() {
    // http://www.ecma-international.org/ecma-262/5.1/#sec-11.5

    it('parses * operator', function() {
      var expr = ol.expression.parse('foo*bar');
      expect(expr).to.be.a(ol.expression.Math);
      expect(expr.evaluate({foo: 10, bar: 20})).to.be(200);
    });

    it('consumes whitespace as expected with *', function() {
      var expr = ol.expression.parse(' foo * bar ');
      expect(expr).to.be.a(ol.expression.Math);
      expect(expr.evaluate({foo: 15, bar: 2})).to.be(30);
    });

    it('parses / operator', function() {
      var expr = ol.expression.parse('foo/12');
      expect(expr).to.be.a(ol.expression.Math);
      expect(expr.evaluate({foo: 10})).to.be(10 / 12);
    });

    it('consumes whitespace as expected with /', function() {
      var expr = ol.expression.parse(' 4 / bar ');
      expect(expr).to.be.a(ol.expression.Math);
      expect(expr.evaluate({bar: 3})).to.be(4 / 3);
    });

    it('parses % operator', function() {
      var expr = ol.expression.parse('12%foo');
      expect(expr).to.be.a(ol.expression.Math);
      expect(expr.evaluate({foo: 10})).to.be(2);
    });

    it('consumes whitespace as expected with %', function() {
      var expr = ol.expression.parse(' 4 %bar ');
      expect(expr).to.be.a(ol.expression.Math);
      expect(expr.evaluate({bar: 3})).to.be(1);
    });

  });
});


goog.require('ol.expression');
goog.require('ol.expression.Expression');
goog.require('ol.expression.Identifier');
goog.require('ol.expression.Literal');
goog.require('ol.expression.Math');
goog.require('ol.expression.Not');
