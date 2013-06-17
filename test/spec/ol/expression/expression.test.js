goog.provide('ol.test.expression');


describe('ol.expression.parse', function() {

  it('parses a subset of ECMAScript 5.1 expressions', function() {
    var expr = ol.expression.parse('foo');
    expect(expr).to.be.a(ol.expression.Expression);
  });

  describe('11.1 - primary expressions', function() {
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
      }).throwException(function(err) {
        expect(err).to.be.an(ol.expression.UnexpectedToken);
        var token = err.token;
        expect(token.value).to.be('f');
        expect(token.index).to.be(1);
      });
    });

    it('parses string literal expressions', function() {
      var expr = ol.expression.parse('"foo"');
      expect(expr).to.be.a(ol.expression.Literal);
      expect(expr.evaluate()).to.be('foo');
    });

    it('throws on unterminated string', function() {
      expect(function() {
        ol.expression.parse('"foo');
      }).throwException(function(err) {
        expect(err).to.be.an(ol.expression.UnexpectedToken);
        var token = err.token;
        expect(token.type).to.be(ol.expression.TokenType.EOF);
        expect(token.index).to.be(4);
      });
    });

    it('parses numeric literal expressions', function() {
      var expr = ol.expression.parse('.42e+2');
      expect(expr).to.be.a(ol.expression.Literal);
      expect(expr.evaluate()).to.be(42);
    });

    it('throws on invalid number', function() {
      expect(function() {
        ol.expression.parse('.42eX');
      }).throwException(function(err) {
        expect(err).to.be.an(ol.expression.UnexpectedToken);
        var token = err.token;
        expect(token.value).to.be('X');
        expect(token.index).to.be(4);
      });
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

  describe('11.2 - left-hand-side expressions', function() {
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
      }).throwException(function(err) {
        expect(err).to.be.an(ol.expression.UnexpectedToken);
        var token = err.token;
        expect(token.value).to.be('b');
        expect(token.index).to.be(5);
      });
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
      }).throwException(function(err) {
        expect(err).to.be.an(ol.expression.UnexpectedToken);
        var token = err.token;
        expect(token.value).to.be(')');
        expect(token.index).to.be(7);
      });
    });

  });

  describe('11.3 - postfix expressions', function() {
    // http://www.ecma-international.org/ecma-262/5.1/#sec-11.3
    it('not supported');
  });


  describe('11.4 - unary operators', function() {
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

  describe('11.5 - multiplicitave operators', function() {
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

  describe('11.6 - additive operators', function() {
    // http://www.ecma-international.org/ecma-262/5.1/#sec-11.6

    it('parses + operator', function() {
      var expr = ol.expression.parse('foo+bar');
      expect(expr).to.be.a(ol.expression.Math);
      expect(expr.evaluate({foo: 10, bar: 20})).to.be(30);
    });

    it('consumes whitespace as expected with +', function() {
      var expr = ol.expression.parse(' foo +10 ');
      expect(expr).to.be.a(ol.expression.Math);
      expect(expr.evaluate({foo: 15})).to.be(25);
    });

    it('parses - operator', function() {
      var expr = ol.expression.parse('foo-bar');
      expect(expr).to.be.a(ol.expression.Math);
      expect(expr.evaluate({foo: 10, bar: 20})).to.be(-10);
    });

    it('consumes whitespace as expected with -', function() {
      var expr = ol.expression.parse(' foo- 10 ');
      expect(expr).to.be.a(ol.expression.Math);
      expect(expr.evaluate({foo: 15})).to.be(5);
    });

  });

  describe('11.7 - bitwise shift operators', function() {
    // http://www.ecma-international.org/ecma-262/5.1/#sec-11.7
    it('not supported');
  });

  describe('11.8 - relational operators', function() {
    // http://www.ecma-international.org/ecma-262/5.1/#sec-11.8

    it('parses < operator', function() {
      var expr = ol.expression.parse('foo<bar');
      expect(expr).to.be.a(ol.expression.Comparison);
      expect(expr.evaluate({foo: 10, bar: 20})).to.be(true);
      expect(expr.evaluate({foo: 100, bar: 20})).to.be(false);
    });

    it('consumes whitespace as expected with <', function() {
      var expr = ol.expression.parse(' foo <10 ');
      expect(expr).to.be.a(ol.expression.Comparison);
      expect(expr.evaluate({foo: 15})).to.be(false);
      expect(expr.evaluate({foo: 5})).to.be(true);
    });

    it('parses > operator', function() {
      var expr = ol.expression.parse('foo>bar');
      expect(expr).to.be.a(ol.expression.Comparison);
      expect(expr.evaluate({foo: 10, bar: 20})).to.be(false);
      expect(expr.evaluate({foo: 100, bar: 20})).to.be(true);
    });

    it('consumes whitespace as expected with >', function() {
      var expr = ol.expression.parse(' foo> 10 ');
      expect(expr).to.be.a(ol.expression.Comparison);
      expect(expr.evaluate({foo: 15})).to.be(true);
      expect(expr.evaluate({foo: 5})).to.be(false);
    });

    it('parses <= operator', function() {
      var expr = ol.expression.parse('foo<=bar');
      expect(expr).to.be.a(ol.expression.Comparison);
      expect(expr.evaluate({foo: 10, bar: 20})).to.be(true);
      expect(expr.evaluate({foo: 100, bar: 20})).to.be(false);
      expect(expr.evaluate({foo: 20, bar: 20})).to.be(true);
    });

    it('consumes whitespace as expected with <=', function() {
      var expr = ol.expression.parse(' foo<= 10 ');
      expect(expr).to.be.a(ol.expression.Comparison);
      expect(expr.evaluate({foo: 15})).to.be(false);
      expect(expr.evaluate({foo: 5})).to.be(true);
      expect(expr.evaluate({foo: 10})).to.be(true);
    });

    it('throws for invalid spacing with <=', function() {
      expect(function() {
        ol.expression.parse(' foo< = 10 ');
      }).throwException(function(err) {
        expect(err).to.be.an(ol.expression.UnexpectedToken);
        var token = err.token;
        expect(token.value).to.be('=');
        expect(token.index).to.be(6);
      });
    });

    it('parses >= operator', function() {
      var expr = ol.expression.parse('foo>=bar');
      expect(expr).to.be.a(ol.expression.Comparison);
      expect(expr.evaluate({foo: 10, bar: 20})).to.be(false);
      expect(expr.evaluate({foo: 100, bar: 20})).to.be(true);
      expect(expr.evaluate({foo: 20, bar: 20})).to.be(true);
    });

    it('consumes whitespace as expected with >=', function() {
      var expr = ol.expression.parse(' foo >=10 ');
      expect(expr).to.be.a(ol.expression.Comparison);
      expect(expr.evaluate({foo: 15})).to.be(true);
      expect(expr.evaluate({foo: 5})).to.be(false);
      expect(expr.evaluate({foo: 10})).to.be(true);
    });

    it('throws for invalid spacing with >=', function() {
      expect(function() {
        ol.expression.parse(' 10 > =foo ');
      }).throwException(function(err) {
        expect(err).to.be.an(ol.expression.UnexpectedToken);
        var token = err.token;
        expect(token.value).to.be('=');
        expect(token.index).to.be(6);
      });
    });

  });

  describe('11.9 - equality operators', function() {
    // http://www.ecma-international.org/ecma-262/5.1/#sec-11.9

    it('parses == operator', function() {
      var expr = ol.expression.parse('foo==42');
      expect(expr).to.be.a(ol.expression.Comparison);
      expect(expr.evaluate({foo: 42})).to.be(true);
      expect(expr.evaluate({foo: 41})).to.be(false);
      expect(expr.evaluate({foo: '42'})).to.be(true);
    });

    it('consumes whitespace as expected with ==', function() {
      var expr = ol.expression.parse(' 42 ==foo ');
      expect(expr).to.be.a(ol.expression.Comparison);
      expect(expr.evaluate({foo: 42})).to.be(true);
      expect(expr.evaluate({foo: 41})).to.be(false);
      expect(expr.evaluate({foo: '42'})).to.be(true);
    });

    it('throws for invalid spacing with ==', function() {
      expect(function() {
        ol.expression.parse(' 10 = =foo ');
      }).throwException(function(err) {
        expect(err).to.be.an(ol.expression.UnexpectedToken);
        var token = err.token;
        expect(token.value).to.be('=');
        expect(token.index).to.be(4);
      });
    });

    it('parses != operator', function() {
      var expr = ol.expression.parse('foo!=42');
      expect(expr).to.be.a(ol.expression.Comparison);
      expect(expr.evaluate({foo: 42})).to.be(false);
      expect(expr.evaluate({foo: 41})).to.be(true);
      expect(expr.evaluate({foo: '42'})).to.be(false);
    });

    it('consumes whitespace as expected with !=', function() {
      var expr = ol.expression.parse(' 42 !=foo ');
      expect(expr).to.be.a(ol.expression.Comparison);
      expect(expr.evaluate({foo: 42})).to.be(false);
      expect(expr.evaluate({foo: 41})).to.be(true);
      expect(expr.evaluate({foo: '42'})).to.be(false);
    });

    it('throws for invalid spacing with !=', function() {
      expect(function() {
        ol.expression.parse(' 10! =foo ');
      }).throwException(function(err) {
        expect(err).to.be.an(ol.expression.UnexpectedToken);
        var token = err.token;
        expect(token.value).to.be('!');
        expect(token.index).to.be(3);
      });
    });

    it('parses === operator', function() {
      var expr = ol.expression.parse('42===foo');
      expect(expr).to.be.a(ol.expression.Comparison);
      expect(expr.evaluate({foo: 42})).to.be(true);
      expect(expr.evaluate({foo: 41})).to.be(false);
      expect(expr.evaluate({foo: '42'})).to.be(false);
    });

    it('consumes whitespace as expected with ===', function() {
      var expr = ol.expression.parse(' foo ===42 ');
      expect(expr).to.be.a(ol.expression.Comparison);
      expect(expr.evaluate({foo: 42})).to.be(true);
      expect(expr.evaluate({foo: 41})).to.be(false);
      expect(expr.evaluate({foo: '42'})).to.be(false);
    });

    it('throws for invalid spacing with ===', function() {
      expect(function() {
        ol.expression.parse(' 10 = == foo ');
      }).throwException(function(err) {
        expect(err).to.be.an(ol.expression.UnexpectedToken);
        var token = err.token;
        expect(token.value).to.be('=');
        expect(token.index).to.be(4);
      });
    });

    it('parses !== operator', function() {
      var expr = ol.expression.parse('foo!==42');
      expect(expr).to.be.a(ol.expression.Comparison);
      expect(expr.evaluate({foo: 42})).to.be(false);
      expect(expr.evaluate({foo: 41})).to.be(true);
      expect(expr.evaluate({foo: '42'})).to.be(true);
    });

    it('consumes whitespace as expected with !==', function() {
      var expr = ol.expression.parse(' 42 !== foo ');
      expect(expr).to.be.a(ol.expression.Comparison);
      expect(expr.evaluate({foo: 42})).to.be(false);
      expect(expr.evaluate({foo: 41})).to.be(true);
      expect(expr.evaluate({foo: '42'})).to.be(true);
    });

    it('throws for invalid spacing with !==', function() {
      expect(function() {
        ol.expression.parse(' 10 != = foo ');
      }).throwException(function(err) {
        expect(err).to.be.an(ol.expression.UnexpectedToken);
        var token = err.token;
        expect(token.value).to.be('=');
        expect(token.index).to.be(7);
      });
    });
  });

  describe('11.10 - binary bitwise operators', function() {
    // http://www.ecma-international.org/ecma-262/5.1/#sec-11.10
    it('not supported');
  });

  describe('11.11 - binary logical operators', function() {
    // http://www.ecma-international.org/ecma-262/5.1/#sec-11.11

    it('parses && operator', function() {
      var expr = ol.expression.parse('foo&&bar');
      expect(expr).to.be.a(ol.expression.Logical);
      expect(expr.evaluate({foo: true, bar: true})).to.be(true);
      expect(expr.evaluate({foo: true, bar: false})).to.be(false);
      expect(expr.evaluate({foo: false, bar: true})).to.be(false);
      expect(expr.evaluate({foo: false, bar: false})).to.be(false);
    });

    it('consumes space as expected with &&', function() {
      var expr = ol.expression.parse(' foo && bar ');
      expect(expr).to.be.a(ol.expression.Logical);
      expect(expr.evaluate({foo: true, bar: true})).to.be(true);
      expect(expr.evaluate({foo: true, bar: false})).to.be(false);
      expect(expr.evaluate({foo: false, bar: true})).to.be(false);
      expect(expr.evaluate({foo: false, bar: false})).to.be(false);
    });

    it('throws for invalid spacing with &&', function() {
      expect(function() {
        ol.expression.parse('true & & false');
      }).throwException(function(err) {
        expect(err).to.be.an(ol.expression.UnexpectedToken);
        var token = err.token;
        expect(token.value).to.be('&');
        expect(token.index).to.be(5);
      });
    });

    it('parses || operator', function() {
      var expr = ol.expression.parse('foo||bar');
      expect(expr).to.be.a(ol.expression.Logical);
      expect(expr.evaluate({foo: true, bar: true})).to.be(true);
      expect(expr.evaluate({foo: true, bar: false})).to.be(true);
      expect(expr.evaluate({foo: false, bar: true})).to.be(true);
      expect(expr.evaluate({foo: false, bar: false})).to.be(false);
    });

    it('consumes space as expected with ||', function() {
      var expr = ol.expression.parse(' foo || bar ');
      expect(expr).to.be.a(ol.expression.Logical);
      expect(expr.evaluate({foo: true, bar: true})).to.be(true);
      expect(expr.evaluate({foo: true, bar: false})).to.be(true);
      expect(expr.evaluate({foo: false, bar: true})).to.be(true);
      expect(expr.evaluate({foo: false, bar: false})).to.be(false);
    });

    it('throws for invalid spacing with ||', function() {
      expect(function() {
        ol.expression.parse('true | | false');
      }).throwException(function(err) {
        expect(err).to.be.an(ol.expression.UnexpectedToken);
        var token = err.token;
        expect(token.value).to.be('|');
        expect(token.index).to.be(5);
      });
    });

  });

  describe('11.12 - conditional operator', function() {
    // http://www.ecma-international.org/ecma-262/5.1/#sec-11.12
    it('not supported');
  });

  describe('11.13 - assignment operators', function() {
    // http://www.ecma-international.org/ecma-262/5.1/#sec-11.13
    it('not supported');
  });

  describe('11.14 - comma operator', function() {
    // http://www.ecma-international.org/ecma-262/5.1/#sec-11.14
    it('not supported');
  });

});

describe('ol.expression.lib', function() {

  var parse = ol.expression.parse;
  var evaluate = ol.expression.evaluateFeature;

  describe('extent()', function() {

    var nw = new ol.Feature({
      geom: new ol.geom.Polygon([[
        [-180, 90], [0, 90], [0, 0], [-180, 0], [-180, 90]
      ]])
    });

    var se = new ol.Feature({
      geom: new ol.geom.Polygon([[
        [180, -90], [0, -90], [0, 0], [180, 0], [180, -90]
      ]])
    });

    var north = parse('extent(-100, 100, 40, 60)');
    var south = parse('extent(-100, 100, -60, -40)');
    var east = parse('extent(80, 100, -50, 50)');
    var west = parse('extent(-100, -80, -50, 50)');

    it('evaluates to true for features within given extent', function() {

      expect(evaluate(north, nw), true);
      expect(evaluate(south, nw), false);
      expect(evaluate(east, nw), false);
      expect(evaluate(west, nw), true);

      expect(evaluate(north, se), false);
      expect(evaluate(south, se), true);
      expect(evaluate(east, se), true);
      expect(evaluate(west, se), false);

    });

  });

  describe('geometryType()', function() {

    var point = new ol.Feature({
      geom: new ol.geom.Point([0, 0])
    });

    var line = new ol.Feature({
      geom: new ol.geom.LineString([[180, -90], [-180, 90]])
    });

    var poly = new ol.Feature({
      geom: new ol.geom.Polygon([[
        [180, -90], [0, -90], [0, 0], [180, 0], [180, -90]
      ]])
    });

    var isPoint = parse('geometryType("point")');
    var isLine = parse('geometryType("linestring")');
    var isPoly = parse('geometryType("polygon")');
    var pointOrPoly = parse('geometryType("point") || geometryType("polygon")');

    it('distinguishes point features', function() {
      expect(evaluate(isPoint, point), true);
      expect(evaluate(isPoint, line), false);
      expect(evaluate(isPoint, poly), false);
    });

    it('distinguishes line features', function() {
      expect(evaluate(isLine, point), false);
      expect(evaluate(isLine, line), true);
      expect(evaluate(isLine, poly), false);
    });

    it('distinguishes polygon features', function() {
      expect(evaluate(isPoly, point), false);
      expect(evaluate(isPoly, line), false);
      expect(evaluate(isPoly, poly), true);
    });

    it('can be composed in a logical expression', function() {
      expect(evaluate(pointOrPoly, point), true);
      expect(evaluate(pointOrPoly, line), false);
      expect(evaluate(pointOrPoly, poly), true);
    });

  });

});


goog.require('ol.Feature');
goog.require('ol.expression');
goog.require('ol.expression.Call');
goog.require('ol.expression.Comparison');
goog.require('ol.expression.Expression');
goog.require('ol.expression.Identifier');
goog.require('ol.expression.Literal');
goog.require('ol.expression.Logical');
goog.require('ol.expression.Math');
goog.require('ol.expression.Member');
goog.require('ol.expression.Not');
goog.require('ol.expression.TokenType');
goog.require('ol.expression.UnexpectedToken');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
