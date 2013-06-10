goog.provide('ol.test.expression.Expression');


describe('ol.expression.Comparison', function() {

  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expression.Comparison(
          ol.expression.ComparisonOp.EQ,
          new ol.expression.Identifier('foo'),
          new ol.expression.Literal(42));
      expect(expr).to.be.a(ol.expression.Expression);
      expect(expr).to.be.a(ol.expression.Comparison);
    });
  });

  describe('#evaluate()', function() {
    it('compares with ==', function() {
      var expr = new ol.expression.Comparison(
          ol.expression.ComparisonOp.EQ,
          new ol.expression.Identifier('foo'),
          new ol.expression.Literal(42));

      expect(expr.evaluate({foo: 42})).to.be(true);
      expect(expr.evaluate({foo: '42'})).to.be(true);
      expect(expr.evaluate({foo: true})).to.be(false);
      expect(expr.evaluate({bar: true})).to.be(false);
    });

    it('compares with !=', function() {
      var expr = new ol.expression.Comparison(
          ol.expression.ComparisonOp.NEQ,
          new ol.expression.Identifier('foo'),
          new ol.expression.Literal(42));

      expect(expr.evaluate({foo: 42})).to.be(false);
      expect(expr.evaluate({foo: '42'})).to.be(false);
      expect(expr.evaluate({foo: true})).to.be(true);
      expect(expr.evaluate({bar: true})).to.be(true);
    });

    it('compares with ===', function() {
      var expr = new ol.expression.Comparison(
          ol.expression.ComparisonOp.STRICT_EQ,
          new ol.expression.Identifier('foo'),
          new ol.expression.Literal(42));

      expect(expr.evaluate({foo: 42})).to.be(true);
      expect(expr.evaluate({foo: '42'})).to.be(false);
      expect(expr.evaluate({foo: true})).to.be(false);
      expect(expr.evaluate({bar: true})).to.be(false);
    });

    it('compares with !==', function() {
      var expr = new ol.expression.Comparison(
          ol.expression.ComparisonOp.STRICT_NEQ,
          new ol.expression.Identifier('foo'),
          new ol.expression.Literal(42));

      expect(expr.evaluate({foo: 42})).to.be(false);
      expect(expr.evaluate({foo: '42'})).to.be(true);
      expect(expr.evaluate({foo: true})).to.be(true);
      expect(expr.evaluate({bar: true})).to.be(true);
    });

    it('compares with >', function() {
      var expr = new ol.expression.Comparison(
          ol.expression.ComparisonOp.GT,
          new ol.expression.Identifier('foo'),
          new ol.expression.Literal(42));

      expect(expr.evaluate({foo: 42})).to.be(false);
      expect(expr.evaluate({foo: 41})).to.be(false);
      expect(expr.evaluate({foo: 43})).to.be(true);
    });

    it('compares with <', function() {
      var expr = new ol.expression.Comparison(
          ol.expression.ComparisonOp.LT,
          new ol.expression.Identifier('foo'),
          new ol.expression.Literal(42));

      expect(expr.evaluate({foo: 42})).to.be(false);
      expect(expr.evaluate({foo: 41})).to.be(true);
      expect(expr.evaluate({foo: 43})).to.be(false);
    });

    it('compares with >=', function() {
      var expr = new ol.expression.Comparison(
          ol.expression.ComparisonOp.GTE,
          new ol.expression.Identifier('foo'),
          new ol.expression.Literal(42));

      expect(expr.evaluate({foo: 42})).to.be(true);
      expect(expr.evaluate({foo: 41})).to.be(false);
      expect(expr.evaluate({foo: 43})).to.be(true);
    });

    it('compares with <=', function() {
      var expr = new ol.expression.Comparison(
          ol.expression.ComparisonOp.LTE,
          new ol.expression.Identifier('foo'),
          new ol.expression.Literal(42));

      expect(expr.evaluate({foo: 42})).to.be(true);
      expect(expr.evaluate({foo: 41})).to.be(true);
      expect(expr.evaluate({foo: 43})).to.be(false);
    });
  });

});

describe('ol.expression.Identifier', function() {

  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expression.Identifier('foo');
      expect(expr).to.be.a(ol.expression.Expression);
      expect(expr).to.be.a(ol.expression.Identifier);
    });
  });

  describe('#evaluate()', function() {
    it('returns a number from the scope', function() {
      var expr = new ol.expression.Identifier('foo');
      expect(expr.evaluate({foo: 42})).to.be(42);
    });

    it('returns a string from the scope', function() {
      var expr = new ol.expression.Identifier('foo');
      expect(expr.evaluate({foo: 'chicken'})).to.be('chicken');
    });

    it('returns a boolean from the scope', function() {
      var expr = new ol.expression.Identifier('bar');
      expect(expr.evaluate({bar: false})).to.be(false);
      expect(expr.evaluate({bar: true})).to.be(true);
    });

    it('returns a null from the scope', function() {
      var expr = new ol.expression.Identifier('nada');
      expect(expr.evaluate({nada: null})).to.be(null);
    });

    it('works for unicode identifiers', function() {
      var expr = new ol.expression.Identifier('\u03c0');
      expect(expr.evaluate({'\u03c0': Math.PI})).to.be(Math.PI);
    });
  });

});

describe('ol.expression.Literal', function() {

  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expression.Literal(true);
      expect(expr).to.be.a(ol.expression.Expression);
      expect(expr).to.be.a(ol.expression.Literal);
    });
  });

  describe('#evaluate()', function() {
    it('works for numeric literal', function() {
      var expr = new ol.expression.Literal(42e-11);
      expect(expr.evaluate({})).to.be(4.2e-10);
    });

    it('works for string literal', function() {
      var expr = new ol.expression.Literal('asdf');
      expect(expr.evaluate({})).to.be('asdf');
    });

    it('works for boolean literal', function() {
      var expr = new ol.expression.Literal(true);
      expect(expr.evaluate({})).to.be(true);
    });

    it('works for null literal', function() {
      var expr = new ol.expression.Literal(null);
      expect(expr.evaluate({})).to.be(null);
    });
  });
});


describe('ol.expression.Not', function() {

  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expression.Not(
          new ol.expression.Literal(true));
      expect(expr).to.be.a(ol.expression.Expression);
      expect(expr).to.be.a(ol.expression.Not);
    });
  });

  describe('#evaluate()', function() {
    it('returns the logical complement', function() {
      var expr = new ol.expression.Not(new ol.expression.Literal(true));
      expect(expr.evaluate({})).to.be(false);

      expr = new ol.expression.Not(new ol.expression.Literal(false));
      expect(expr.evaluate({})).to.be(true);
    });

    it('negates a truthy string', function() {
      var expr = new ol.expression.Not(new ol.expression.Literal('asdf'));
      expect(expr.evaluate({})).to.be(false);
    });

    it('negates a falsy string', function() {
      var expr = new ol.expression.Not(new ol.expression.Literal(''));
      expect(expr.evaluate({})).to.be(true);
    });

    it('negates a truthy number', function() {
      var expr = new ol.expression.Not(new ol.expression.Literal(42));
      expect(expr.evaluate({})).to.be(false);
    });

    it('negates a falsy number', function() {
      var expr = new ol.expression.Not(new ol.expression.Literal(NaN));
      expect(expr.evaluate({})).to.be(true);
    });
  });

});


goog.require('ol.expression.Comparison');
goog.require('ol.expression.ComparisonOp');
goog.require('ol.expression.Expression');
goog.require('ol.expression.Identifier');
goog.require('ol.expression.Literal');
goog.require('ol.expression.Not');
