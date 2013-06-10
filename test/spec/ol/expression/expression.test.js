goog.provide('ol.test.expression.Expression');


describe('ol.expression.Call', function() {

  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expression.Call(
          new ol.expression.Identifier('sqrt'),
          [new ol.expression.Literal(42)]);
      expect(expr).to.be.a(ol.expression.Expression);
      expect(expr).to.be.a(ol.expression.Call);
    });
  });

  describe('#evaluate()', function() {
    var fns = {
      sqrt: function(value) {
        return Math.sqrt(value);
      },
      strConcat: function() {
        return Array.prototype.join.call(arguments, '');
      },
      discouraged: function() {
        return this.message;
      }
    };

    it('calls method on scope with literal args', function() {
      var expr = new ol.expression.Call(
          new ol.expression.Identifier('sqrt'),
          [new ol.expression.Literal(42)]);
      expect(expr.evaluate(fns)).to.be(Math.sqrt(42));
    });

    it('accepts a separate scope for functions', function() {
      var expr = new ol.expression.Call(
          new ol.expression.Identifier('sqrt'),
          [new ol.expression.Identifier('foo')]);
      expect(expr.evaluate({foo: 42}, fns)).to.be(Math.sqrt(42));
    });

    it('accepts multiple expression arguments', function() {
      var expr = new ol.expression.Call(
          new ol.expression.Identifier('strConcat'),
          [
            new ol.expression.Identifier('foo'),
            new ol.expression.Literal(' comes after '),
            new ol.expression.Math(
                ol.expression.MathOp.SUBTRACT,
                new ol.expression.Identifier('foo'),
                new ol.expression.Literal(1))
          ]);
      expect(expr.evaluate({foo: 42}, fns)).to.be('42 comes after 41');
    });

    it('accepts optional this arg', function() {
      var expr = new ol.expression.Call(
          new ol.expression.Identifier('discouraged'), []);

      var thisArg = {
        message: 'avoid this'
      };

      expect(expr.evaluate(fns, null, thisArg)).to.be('avoid this');
    });

  });

});


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

  describe('#isValidOp()', function() {
    it('determines if a string is a valid operator', function() {
      expect(ol.expression.Comparison.isValidOp('<')).to.be(true);
      expect(ol.expression.Comparison.isValidOp('<')).to.be(true);
      expect(ol.expression.Comparison.isValidOp('<=')).to.be(true);
      expect(ol.expression.Comparison.isValidOp('<=')).to.be(true);
      expect(ol.expression.Comparison.isValidOp('==')).to.be(true);
      expect(ol.expression.Comparison.isValidOp('!=')).to.be(true);
      expect(ol.expression.Comparison.isValidOp('===')).to.be(true);
      expect(ol.expression.Comparison.isValidOp('!==')).to.be(true);

      expect(ol.expression.Comparison.isValidOp('')).to.be(false);
      expect(ol.expression.Comparison.isValidOp('+')).to.be(false);
      expect(ol.expression.Comparison.isValidOp('-')).to.be(false);
      expect(ol.expression.Comparison.isValidOp('&&')).to.be(false);
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


describe('ol.expression.Logical', function() {

  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expression.Logical(
          ol.expression.LogicalOp.OR,
          new ol.expression.Identifier('foo'),
          new ol.expression.Identifier('bar'));
      expect(expr).to.be.a(ol.expression.Expression);
      expect(expr).to.be.a(ol.expression.Logical);
    });
  });

  describe('#evaluate()', function() {
    it('applies || to resolved identifiers', function() {
      var expr = new ol.expression.Logical(
          ol.expression.LogicalOp.OR,
          new ol.expression.Identifier('foo'),
          new ol.expression.Identifier('bar'));

      expect(expr.evaluate({foo: true, bar: true})).to.be(true);
      expect(expr.evaluate({foo: true, bar: false})).to.be(true);
      expect(expr.evaluate({foo: false, bar: true})).to.be(true);
      expect(expr.evaluate({foo: false, bar: false})).to.be(false);
    });

    it('applies && to resolved identifiers', function() {
      var expr = new ol.expression.Logical(
          ol.expression.LogicalOp.AND,
          new ol.expression.Identifier('foo'),
          new ol.expression.Identifier('bar'));

      expect(expr.evaluate({foo: true, bar: true})).to.be(true);
      expect(expr.evaluate({foo: true, bar: false})).to.be(false);
      expect(expr.evaluate({foo: false, bar: true})).to.be(false);
      expect(expr.evaluate({foo: false, bar: false})).to.be(false);
    });
  });

  describe('#isValidOp()', function() {
    it('determines if a string is a valid operator', function() {
      expect(ol.expression.Logical.isValidOp('||')).to.be(true);
      expect(ol.expression.Logical.isValidOp('&&')).to.be(true);

      expect(ol.expression.Logical.isValidOp('')).to.be(false);
      expect(ol.expression.Logical.isValidOp('+')).to.be(false);
      expect(ol.expression.Logical.isValidOp('<')).to.be(false);
      expect(ol.expression.Logical.isValidOp('|')).to.be(false);
    });
  });

});

describe('ol.expression.Math', function() {

  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expression.Math(
          ol.expression.MathOp.ADD,
          new ol.expression.Literal(40),
          new ol.expression.Literal(2));
      expect(expr).to.be.a(ol.expression.Expression);
      expect(expr).to.be.a(ol.expression.Math);
    });
  });

  describe('#evaluate()', function() {
    it('does + with numeric literal', function() {
      var expr = new ol.expression.Math(
          ol.expression.MathOp.ADD,
          new ol.expression.Literal(40),
          new ol.expression.Literal(2));

      expect(expr.evaluate({})).to.be(42);
    });

    it('does + with string literal (note: subject to change)', function() {
      var expr = new ol.expression.Math(
          ol.expression.MathOp.ADD,
          new ol.expression.Literal('foo'),
          new ol.expression.Literal('bar'));

      expect(expr.evaluate({})).to.be('foobar');
    });

    it('does + with identifiers', function() {
      var expr = new ol.expression.Math(
          ol.expression.MathOp.ADD,
          new ol.expression.Identifier('foo'),
          new ol.expression.Identifier('bar'));

      expect(expr.evaluate({foo: 40, bar: 2})).to.be(42);
    });

    it('does - with identifiers', function() {
      var expr = new ol.expression.Math(
          ol.expression.MathOp.SUBTRACT,
          new ol.expression.Identifier('foo'),
          new ol.expression.Literal(2));

      expect(expr.evaluate({foo: 40})).to.be(38);
    });

    it('casts to number with - (note: this may throw later)', function() {
      var expr = new ol.expression.Math(
          ol.expression.MathOp.SUBTRACT,
          new ol.expression.Identifier('foo'),
          new ol.expression.Literal(2));

      expect(expr.evaluate({foo: '40'})).to.be(38);
    });

    it('does * with identifiers', function() {
      var expr = new ol.expression.Math(
          ol.expression.MathOp.MULTIPLY,
          new ol.expression.Literal(2),
          new ol.expression.Identifier('foo'));

      expect(expr.evaluate({foo: 21})).to.be(42);
    });

    it('casts to number with * (note: this may throw later)', function() {
      var expr = new ol.expression.Math(
          ol.expression.MathOp.MULTIPLY,
          new ol.expression.Identifier('foo'),
          new ol.expression.Literal(2));

      expect(expr.evaluate({foo: '21'})).to.be(42);
    });

    it('does % with identifiers', function() {
      var expr = new ol.expression.Math(
          ol.expression.MathOp.MOD,
          new ol.expression.Literal(97),
          new ol.expression.Identifier('foo'));

      expect(expr.evaluate({foo: 55})).to.be(42);
    });

    it('casts to number with % (note: this may throw later)', function() {
      var expr = new ol.expression.Math(
          ol.expression.MathOp.MOD,
          new ol.expression.Identifier('foo'),
          new ol.expression.Literal(100));

      expect(expr.evaluate({foo: '150'})).to.be(50);
    });
  });

  describe('#isValidOp()', function() {
    it('determines if a string is a valid operator', function() {
      expect(ol.expression.Math.isValidOp('+')).to.be(true);
      expect(ol.expression.Math.isValidOp('-')).to.be(true);
      expect(ol.expression.Math.isValidOp('*')).to.be(true);
      expect(ol.expression.Math.isValidOp('/')).to.be(true);
      expect(ol.expression.Math.isValidOp('%')).to.be(true);

      expect(ol.expression.Math.isValidOp('')).to.be(false);
      expect(ol.expression.Math.isValidOp('|')).to.be(false);
      expect(ol.expression.Math.isValidOp('&')).to.be(false);
      expect(ol.expression.Math.isValidOp('<')).to.be(false);
      expect(ol.expression.Math.isValidOp('||')).to.be(false);
      expect(ol.expression.Math.isValidOp('.')).to.be(false);
    });
  });


});

describe('ol.expression.Member', function() {
  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expression.Member(
          new ol.expression.Identifier('foo'),
          new ol.expression.Identifier('bar'));

      expect(expr).to.be.a(ol.expression.Expression);
      expect(expr).to.be.a(ol.expression.Member);
    });
  });

  describe('#evaluate()', function() {
    it('accesses an object property', function() {

      var expr = new ol.expression.Member(
          new ol.expression.Identifier('foo'),
          new ol.expression.Identifier('bar'));

      var scope = {foo: {bar: 42}};
      expect(expr.evaluate(scope)).to.be(42);
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


goog.require('ol.expression.Call');
goog.require('ol.expression.Comparison');
goog.require('ol.expression.ComparisonOp');
goog.require('ol.expression.Expression');
goog.require('ol.expression.Identifier');
goog.require('ol.expression.Literal');
goog.require('ol.expression.Logical');
goog.require('ol.expression.LogicalOp');
goog.require('ol.expression.Math');
goog.require('ol.expression.MathOp');
goog.require('ol.expression.Member');
goog.require('ol.expression.Not');
