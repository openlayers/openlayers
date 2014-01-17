goog.provide('ol.test.expression.Expression');


describe('ol.expr.Call', function() {

  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expr.Call(
          new ol.expr.Identifier('sqrt'),
          [new ol.expr.Literal(42)]);
      expect(expr).to.be.a(ol.expr.Expression);
      expect(expr).to.be.a(ol.expr.Call);
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
      var expr = new ol.expr.Call(
          new ol.expr.Identifier('sqrt'),
          [new ol.expr.Literal(42)]);
      expect(expr.evaluate(fns)).to.be(Math.sqrt(42));
    });

    it('accepts a separate scope for functions', function() {
      var expr = new ol.expr.Call(
          new ol.expr.Identifier('sqrt'),
          [new ol.expr.Identifier('foo')]);
      expect(expr.evaluate({foo: 42}, fns)).to.be(Math.sqrt(42));
    });

    it('accepts multiple expression arguments', function() {
      var expr = new ol.expr.Call(
          new ol.expr.Identifier('strConcat'),
          [
            new ol.expr.Identifier('foo'),
            new ol.expr.Literal(' comes after '),
            new ol.expr.Math(
                ol.expr.MathOp.SUBTRACT,
                new ol.expr.Identifier('foo'),
                new ol.expr.Literal(1))
          ]);
      expect(expr.evaluate({foo: 42}, fns)).to.be('42 comes after 41');
    });

    it('accepts optional this arg', function() {
      var expr = new ol.expr.Call(
          new ol.expr.Identifier('discouraged'), []);

      var thisArg = {
        message: 'avoid this'
      };

      expect(expr.evaluate(fns, null, thisArg)).to.be('avoid this');
    });

  });

  var callee = new ol.expr.Identifier('sqrt');
  var args = [new ol.expr.Literal(42)];
  var expr = new ol.expr.Call(callee, args);

  describe('#getArgs()', function() {
    it('gets the callee expression', function() {
      expect(expr.getArgs()).to.be(args);
    });
  });

  describe('#getCallee()', function() {
    it('gets the callee expression', function() {
      expect(expr.getCallee()).to.be(callee);
    });
  });

});


describe('ol.expr.Comparison', function() {

  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expr.Comparison(
          ol.expr.ComparisonOp.EQ,
          new ol.expr.Identifier('foo'),
          new ol.expr.Literal(42));
      expect(expr).to.be.a(ol.expr.Expression);
      expect(expr).to.be.a(ol.expr.Comparison);
    });
  });

  describe('#evaluate()', function() {
    it('compares with ==', function() {
      var expr = new ol.expr.Comparison(
          ol.expr.ComparisonOp.EQ,
          new ol.expr.Identifier('foo'),
          new ol.expr.Literal(42));

      expect(expr.evaluate({foo: 42})).to.be(true);
      expect(expr.evaluate({foo: '42'})).to.be(true);
      expect(expr.evaluate({foo: true})).to.be(false);
      expect(expr.evaluate({bar: true})).to.be(false);
    });

    it('compares with !=', function() {
      var expr = new ol.expr.Comparison(
          ol.expr.ComparisonOp.NEQ,
          new ol.expr.Identifier('foo'),
          new ol.expr.Literal(42));

      expect(expr.evaluate({foo: 42})).to.be(false);
      expect(expr.evaluate({foo: '42'})).to.be(false);
      expect(expr.evaluate({foo: true})).to.be(true);
      expect(expr.evaluate({bar: true})).to.be(true);
    });

    it('compares with ===', function() {
      var expr = new ol.expr.Comparison(
          ol.expr.ComparisonOp.STRICT_EQ,
          new ol.expr.Identifier('foo'),
          new ol.expr.Literal(42));

      expect(expr.evaluate({foo: 42})).to.be(true);
      expect(expr.evaluate({foo: '42'})).to.be(false);
      expect(expr.evaluate({foo: true})).to.be(false);
      expect(expr.evaluate({bar: true})).to.be(false);
    });

    it('compares with !==', function() {
      var expr = new ol.expr.Comparison(
          ol.expr.ComparisonOp.STRICT_NEQ,
          new ol.expr.Identifier('foo'),
          new ol.expr.Literal(42));

      expect(expr.evaluate({foo: 42})).to.be(false);
      expect(expr.evaluate({foo: '42'})).to.be(true);
      expect(expr.evaluate({foo: true})).to.be(true);
      expect(expr.evaluate({bar: true})).to.be(true);
    });

    it('compares with >', function() {
      var expr = new ol.expr.Comparison(
          ol.expr.ComparisonOp.GT,
          new ol.expr.Identifier('foo'),
          new ol.expr.Literal(42));

      expect(expr.evaluate({foo: 42})).to.be(false);
      expect(expr.evaluate({foo: 41})).to.be(false);
      expect(expr.evaluate({foo: 43})).to.be(true);
    });

    it('compares with <', function() {
      var expr = new ol.expr.Comparison(
          ol.expr.ComparisonOp.LT,
          new ol.expr.Identifier('foo'),
          new ol.expr.Literal(42));

      expect(expr.evaluate({foo: 42})).to.be(false);
      expect(expr.evaluate({foo: 41})).to.be(true);
      expect(expr.evaluate({foo: 43})).to.be(false);
    });

    it('compares with >=', function() {
      var expr = new ol.expr.Comparison(
          ol.expr.ComparisonOp.GTE,
          new ol.expr.Identifier('foo'),
          new ol.expr.Literal(42));

      expect(expr.evaluate({foo: 42})).to.be(true);
      expect(expr.evaluate({foo: 41})).to.be(false);
      expect(expr.evaluate({foo: 43})).to.be(true);
    });

    it('compares with <=', function() {
      var expr = new ol.expr.Comparison(
          ol.expr.ComparisonOp.LTE,
          new ol.expr.Identifier('foo'),
          new ol.expr.Literal(42));

      expect(expr.evaluate({foo: 42})).to.be(true);
      expect(expr.evaluate({foo: 41})).to.be(true);
      expect(expr.evaluate({foo: 43})).to.be(false);
    });
  });

  describe('#isValidOp()', function() {
    it('determines if a string is a valid operator', function() {
      expect(ol.expr.Comparison.isValidOp('<')).to.be(true);
      expect(ol.expr.Comparison.isValidOp('<')).to.be(true);
      expect(ol.expr.Comparison.isValidOp('<=')).to.be(true);
      expect(ol.expr.Comparison.isValidOp('<=')).to.be(true);
      expect(ol.expr.Comparison.isValidOp('==')).to.be(true);
      expect(ol.expr.Comparison.isValidOp('!=')).to.be(true);
      expect(ol.expr.Comparison.isValidOp('===')).to.be(true);
      expect(ol.expr.Comparison.isValidOp('!==')).to.be(true);

      expect(ol.expr.Comparison.isValidOp('')).to.be(false);
      expect(ol.expr.Comparison.isValidOp('+')).to.be(false);
      expect(ol.expr.Comparison.isValidOp('-')).to.be(false);
      expect(ol.expr.Comparison.isValidOp('&&')).to.be(false);
    });
  });

  var op = ol.expr.ComparisonOp.LTE;
  var left = new ol.expr.Identifier('foo');
  var right = new ol.expr.Literal(42);
  var expr = new ol.expr.Comparison(op, left, right);

  describe('#getOperator()', function() {
    it('gets the operator', function() {
      expect(expr.getOperator()).to.be(op);
    });
  });

  describe('#getLeft()', function() {
    it('gets the left expression', function() {
      expect(expr.getLeft()).to.be(left);
    });
  });

  describe('#getRight()', function() {
    it('gets the right expression', function() {
      expect(expr.getRight()).to.be(right);
    });
  });

});

describe('ol.expr.Identifier', function() {

  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expr.Identifier('foo');
      expect(expr).to.be.a(ol.expr.Expression);
      expect(expr).to.be.a(ol.expr.Identifier);
    });
  });

  describe('#evaluate()', function() {
    it('returns a number from the scope', function() {
      var expr = new ol.expr.Identifier('foo');
      expect(expr.evaluate({foo: 42})).to.be(42);
    });

    it('returns a string from the scope', function() {
      var expr = new ol.expr.Identifier('foo');
      expect(expr.evaluate({foo: 'chicken'})).to.be('chicken');
    });

    it('returns a boolean from the scope', function() {
      var expr = new ol.expr.Identifier('bar');
      expect(expr.evaluate({bar: false})).to.be(false);
      expect(expr.evaluate({bar: true})).to.be(true);
    });

    it('returns a null from the scope', function() {
      var expr = new ol.expr.Identifier('nada');
      expect(expr.evaluate({nada: null})).to.be(null);
    });

    it('works for unicode identifiers', function() {
      var expr = new ol.expr.Identifier('\u03c0');
      expect(expr.evaluate({'\u03c0': Math.PI})).to.be(Math.PI);
    });
  });

  describe('#getName()', function() {
    var expr = new ol.expr.Identifier('asdf');
    expect(expr.getName()).to.be('asdf');
  });

});

describe('ol.expr.Literal', function() {

  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expr.Literal(true);
      expect(expr).to.be.a(ol.expr.Expression);
      expect(expr).to.be.a(ol.expr.Literal);
    });
  });

  describe('#evaluate()', function() {
    it('works for numeric literal', function() {
      var expr = new ol.expr.Literal(42e-11);
      expect(expr.evaluate()).to.be(4.2e-10);
    });

    it('works for string literal', function() {
      var expr = new ol.expr.Literal('asdf');
      expect(expr.evaluate()).to.be('asdf');
    });

    it('works for boolean literal', function() {
      var expr = new ol.expr.Literal(true);
      expect(expr.evaluate()).to.be(true);
    });

    it('works for null literal', function() {
      var expr = new ol.expr.Literal(null);
      expect(expr.evaluate()).to.be(null);
    });
  });

  describe('#getValue()', function() {
    var expr = new ol.expr.Literal('asdf');
    expect(expr.getValue()).to.be('asdf');
  });

});


describe('ol.expr.Logical', function() {

  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expr.Logical(
          ol.expr.LogicalOp.OR,
          new ol.expr.Identifier('foo'),
          new ol.expr.Identifier('bar'));
      expect(expr).to.be.a(ol.expr.Expression);
      expect(expr).to.be.a(ol.expr.Logical);
    });
  });

  describe('#evaluate()', function() {
    it('applies || to resolved identifiers', function() {
      var expr = new ol.expr.Logical(
          ol.expr.LogicalOp.OR,
          new ol.expr.Identifier('foo'),
          new ol.expr.Identifier('bar'));

      expect(expr.evaluate({foo: true, bar: true})).to.be(true);
      expect(expr.evaluate({foo: true, bar: false})).to.be(true);
      expect(expr.evaluate({foo: false, bar: true})).to.be(true);
      expect(expr.evaluate({foo: false, bar: false})).to.be(false);
    });

    it('applies && to resolved identifiers', function() {
      var expr = new ol.expr.Logical(
          ol.expr.LogicalOp.AND,
          new ol.expr.Identifier('foo'),
          new ol.expr.Identifier('bar'));

      expect(expr.evaluate({foo: true, bar: true})).to.be(true);
      expect(expr.evaluate({foo: true, bar: false})).to.be(false);
      expect(expr.evaluate({foo: false, bar: true})).to.be(false);
      expect(expr.evaluate({foo: false, bar: false})).to.be(false);
    });
  });

  describe('#isValidOp()', function() {
    it('determines if a string is a valid operator', function() {
      expect(ol.expr.Logical.isValidOp('||')).to.be(true);
      expect(ol.expr.Logical.isValidOp('&&')).to.be(true);

      expect(ol.expr.Logical.isValidOp('')).to.be(false);
      expect(ol.expr.Logical.isValidOp('+')).to.be(false);
      expect(ol.expr.Logical.isValidOp('<')).to.be(false);
      expect(ol.expr.Logical.isValidOp('|')).to.be(false);
    });
  });

  var op = ol.expr.LogicalOp.AND;
  var left = new ol.expr.Identifier('foo');
  var right = new ol.expr.Literal(false);
  var expr = new ol.expr.Logical(op, left, right);

  describe('#getOperator()', function() {
    it('gets the operator', function() {
      expect(expr.getOperator()).to.be(op);
    });
  });

  describe('#getLeft()', function() {
    it('gets the left expression', function() {
      expect(expr.getLeft()).to.be(left);
    });
  });

  describe('#getRight()', function() {
    it('gets the right expression', function() {
      expect(expr.getRight()).to.be(right);
    });
  });

});

describe('ol.expr.Math', function() {

  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expr.Math(
          ol.expr.MathOp.ADD,
          new ol.expr.Literal(40),
          new ol.expr.Literal(2));
      expect(expr).to.be.a(ol.expr.Expression);
      expect(expr).to.be.a(ol.expr.Math);
    });
  });

  describe('#evaluate()', function() {
    it('does + with numeric literal', function() {
      var expr = new ol.expr.Math(
          ol.expr.MathOp.ADD,
          new ol.expr.Literal(40),
          new ol.expr.Literal(2));

      expect(expr.evaluate()).to.be(42);
    });

    it('does + with string literal (note: subject to change)', function() {
      var expr = new ol.expr.Math(
          ol.expr.MathOp.ADD,
          new ol.expr.Literal('foo'),
          new ol.expr.Literal('bar'));

      expect(expr.evaluate()).to.be('foobar');
    });

    it('does + with identifiers', function() {
      var expr = new ol.expr.Math(
          ol.expr.MathOp.ADD,
          new ol.expr.Identifier('foo'),
          new ol.expr.Identifier('bar'));

      expect(expr.evaluate({foo: 40, bar: 2})).to.be(42);
    });

    it('does - with identifiers', function() {
      var expr = new ol.expr.Math(
          ol.expr.MathOp.SUBTRACT,
          new ol.expr.Identifier('foo'),
          new ol.expr.Literal(2));

      expect(expr.evaluate({foo: 40})).to.be(38);
    });

    it('casts to number with - (note: this may throw later)', function() {
      var expr = new ol.expr.Math(
          ol.expr.MathOp.SUBTRACT,
          new ol.expr.Identifier('foo'),
          new ol.expr.Literal(2));

      expect(expr.evaluate({foo: '40'})).to.be(38);
    });

    it('does * with identifiers', function() {
      var expr = new ol.expr.Math(
          ol.expr.MathOp.MULTIPLY,
          new ol.expr.Literal(2),
          new ol.expr.Identifier('foo'));

      expect(expr.evaluate({foo: 21})).to.be(42);
    });

    it('casts to number with * (note: this may throw later)', function() {
      var expr = new ol.expr.Math(
          ol.expr.MathOp.MULTIPLY,
          new ol.expr.Identifier('foo'),
          new ol.expr.Literal(2));

      expect(expr.evaluate({foo: '21'})).to.be(42);
    });

    it('does % with identifiers', function() {
      var expr = new ol.expr.Math(
          ol.expr.MathOp.MOD,
          new ol.expr.Literal(97),
          new ol.expr.Identifier('foo'));

      expect(expr.evaluate({foo: 55})).to.be(42);
    });

    it('casts to number with % (note: this may throw later)', function() {
      var expr = new ol.expr.Math(
          ol.expr.MathOp.MOD,
          new ol.expr.Identifier('foo'),
          new ol.expr.Literal(100));

      expect(expr.evaluate({foo: '150'})).to.be(50);
    });
  });

  describe('#isValidOp()', function() {
    it('determines if a string is a valid operator', function() {
      expect(ol.expr.Math.isValidOp('+')).to.be(true);
      expect(ol.expr.Math.isValidOp('-')).to.be(true);
      expect(ol.expr.Math.isValidOp('*')).to.be(true);
      expect(ol.expr.Math.isValidOp('/')).to.be(true);
      expect(ol.expr.Math.isValidOp('%')).to.be(true);

      expect(ol.expr.Math.isValidOp('')).to.be(false);
      expect(ol.expr.Math.isValidOp('|')).to.be(false);
      expect(ol.expr.Math.isValidOp('&')).to.be(false);
      expect(ol.expr.Math.isValidOp('<')).to.be(false);
      expect(ol.expr.Math.isValidOp('||')).to.be(false);
      expect(ol.expr.Math.isValidOp('.')).to.be(false);
    });
  });

  var op = ol.expr.MathOp.MOD;
  var left = new ol.expr.Identifier('foo');
  var right = new ol.expr.Literal(20);
  var expr = new ol.expr.Math(op, left, right);

  describe('#getOperator()', function() {
    it('gets the operator', function() {
      expect(expr.getOperator()).to.be(op);
    });
  });

  describe('#getLeft()', function() {
    it('gets the left expression', function() {
      expect(expr.getLeft()).to.be(left);
    });
  });

  describe('#getRight()', function() {
    it('gets the right expression', function() {
      expect(expr.getRight()).to.be(right);
    });
  });

});

describe('ol.expr.Member', function() {
  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expr.Member(
          new ol.expr.Identifier('foo'),
          new ol.expr.Identifier('bar'));

      expect(expr).to.be.a(ol.expr.Expression);
      expect(expr).to.be.a(ol.expr.Member);
    });
  });

  describe('#evaluate()', function() {
    it('accesses an object property', function() {

      var expr = new ol.expr.Member(
          new ol.expr.Identifier('foo'),
          new ol.expr.Identifier('bar'));

      var scope = {foo: {bar: 42}};
      expect(expr.evaluate(scope)).to.be(42);
    });
  });

  var object = new ol.expr.Identifier('foo');
  var property = new ol.expr.Identifier('bar');
  var expr = new ol.expr.Member(object, property);

  describe('#getObject()', function() {
    expect(expr.getObject()).to.be(object);
  });

  describe('#getProperty()', function() {
    expect(expr.getProperty()).to.be(property);
  });

});


describe('ol.expr.Not', function() {

  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expr.Not(
          new ol.expr.Literal(true));
      expect(expr).to.be.a(ol.expr.Expression);
      expect(expr).to.be.a(ol.expr.Not);
    });
  });

  describe('#evaluate()', function() {
    it('returns the logical complement', function() {
      var expr = new ol.expr.Not(new ol.expr.Literal(true));
      expect(expr.evaluate()).to.be(false);

      expr = new ol.expr.Not(new ol.expr.Literal(false));
      expect(expr.evaluate()).to.be(true);
    });

    it('negates a truthy string', function() {
      var expr = new ol.expr.Not(new ol.expr.Literal('asdf'));
      expect(expr.evaluate()).to.be(false);
    });

    it('negates a falsy string', function() {
      var expr = new ol.expr.Not(new ol.expr.Literal(''));
      expect(expr.evaluate()).to.be(true);
    });

    it('negates a truthy number', function() {
      var expr = new ol.expr.Not(new ol.expr.Literal(42));
      expect(expr.evaluate()).to.be(false);
    });

    it('negates a falsy number', function() {
      var expr = new ol.expr.Not(new ol.expr.Literal(NaN));
      expect(expr.evaluate()).to.be(true);
    });
  });

  describe('#getArgument()', function() {
    var argument = new ol.expr.Literal(true);
    var expr = new ol.expr.Not(argument);
    expect(expr.getArgument()).to.be(argument);
  });

});


goog.require('ol.expr.Call');
goog.require('ol.expr.Comparison');
goog.require('ol.expr.ComparisonOp');
goog.require('ol.expr.Expression');
goog.require('ol.expr.Identifier');
goog.require('ol.expr.Literal');
goog.require('ol.expr.Logical');
goog.require('ol.expr.LogicalOp');
goog.require('ol.expr.Math');
goog.require('ol.expr.MathOp');
goog.require('ol.expr.Member');
goog.require('ol.expr.Not');
