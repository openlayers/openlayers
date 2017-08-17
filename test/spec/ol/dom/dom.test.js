

goog.require('ol.dom');

describe('ol.dom', function() {

  describe('ol.dom.createCanvasContext2D', function() {
    // default values from
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas
    var defaultWidth = 300;
    var defaultHeight = 150;

    it('returns a CanvasRenderingContext2D', function() {
      var ctx = ol.dom.createCanvasContext2D();
      expect(ctx).to.be.a(CanvasRenderingContext2D);
      expect(ctx.canvas).to.be.a(HTMLCanvasElement);
      expect(ctx.canvas.width).to.be(defaultWidth);
      expect(ctx.canvas.height).to.be(defaultHeight);
    });

    it('has the desired width', function() {
      var ctx = ol.dom.createCanvasContext2D(42);
      expect(ctx).to.be.a(CanvasRenderingContext2D);
      expect(ctx.canvas).to.be.a(HTMLCanvasElement);
      expect(ctx.canvas.width).to.be(42);
      expect(ctx.canvas.height).to.be(defaultHeight);
    });

    it('has the desired height', function() {
      var ctx = ol.dom.createCanvasContext2D(undefined, 42);
      expect(ctx).to.be.a(CanvasRenderingContext2D);
      expect(ctx.canvas).to.be.a(HTMLCanvasElement);
      expect(ctx.canvas.width).to.be(defaultWidth);
      expect(ctx.canvas.height).to.be(42);
    });

    it('has the desired height and width', function() {
      var ctx = ol.dom.createCanvasContext2D(42, 42);
      expect(ctx).to.be.a(CanvasRenderingContext2D);
      expect(ctx.canvas).to.be.a(HTMLCanvasElement);
      expect(ctx.canvas.width).to.be(42);
      expect(ctx.canvas.height).to.be(42);
    });

  });

  describe('ol.dom.outerWidth', function() {
    var element = null;
    beforeEach(function() {
      element = document.createElement('div');
      element.style.padding = 0;
      element.style.margin = 0;
      element.style.border = 'none';
      element.style.width = '10px';
      element.style.height = '10px';
      document.body.appendChild(element);
    });
    afterEach(function() {
      element.parentNode.removeChild(element);
      element = null;
    });

    describe('without padding, margin or border', function() {

      it('calculates correctly', function() {
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(10);
      });

    });

    describe('with padding', function() {
      it('calculates correctly (both sides)', function() {
        element.style.padding = '5px';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(20);
      });

      it('calculates correctly (one side)', function() {
        element.style.paddingLeft = '5px';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(15);
      });
    });

    describe('with margin', function() {

      it('calculates correctly (both sides)', function() {
        element.style.margin = '5px';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(20);
      });

      it('calculates correctly (one side)', function() {
        element.style.marginLeft = '5px';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(15);
      });

    });

    describe('with border', function() {

      it('calculates correctly (both sides)', function() {
        element.style.border = '5px solid chocolate';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(20);
      });

      it('calculates correctly (one side)', function() {
        element.style.border = '5px solid chocolate';
        element.style.borderRightWidth = '0';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(15);
      });

    });

    describe('with padding and margin', function() {

      it('calculates correctly (both sides)', function() {
        element.style.padding = '5px';
        element.style.margin = '5px';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(30);
      });

      it('calculates correctly (one side)', function() {
        element.style.paddingLeft = '5px';
        element.style.marginLeft = '5px';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(20);
      });

    });

    describe('with padding and border', function() {

      it('calculates correctly (both sides)', function() {
        element.style.padding = '5px';
        element.style.border = '5px solid chocolate';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(30);
      });

      it('calculates correctly (one side)', function() {
        element.style.paddingLeft = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderRightWidth = '0';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(20);
      });

    });

    describe('with margin and border', function() {

      it('calculates correctly (both sides)', function() {
        element.style.margin = '5px';
        element.style.border = '5px solid chocolate';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(30);
      });

      it('calculates correctly (one side)', function() {
        element.style.marginLeft = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderRightWidth = '0';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(20);
      });

    });

    describe('with padding, margin and border', function() {

      it('calculates correctly (both sides)', function() {
        element.style.margin = '5px';
        element.style.padding = '5px';
        element.style.border = '5px solid chocolate';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(40);
      });

      it('calculates correctly (one side)', function() {
        element.style.marginLeft = '5px';
        element.style.paddingLeft = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderRightWidth = '0';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(25);
      });

    });

  });

  describe('ol.dom.outerHeight', function() {
    var element = null;
    beforeEach(function() {
      element = document.createElement('div');
      element.style.padding = 0;
      element.style.margin = 0;
      element.style.border = 'none';
      element.style.width = '10px';
      element.style.height = '10px';
      document.body.appendChild(element);
    });
    afterEach(function() {
      element.parentNode.removeChild(element);
      element = null;
    });

    describe('without padding, margin or border', function() {

      it('calculates correctly', function() {
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(10);
      });

    });

    describe('with padding', function() {
      it('calculates correctly (both sides)', function() {
        element.style.padding = '5px';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(20);
      });

      it('calculates correctly (one side)', function() {
        element.style.paddingTop = '5px';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(15);
      });
    });

    describe('with margin', function() {

      it('calculates correctly (both sides)', function() {
        element.style.margin = '5px';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(20);
      });

      it('calculates correctly (one side)', function() {
        element.style.marginTop = '5px';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(15);
      });

    });

    describe('with border', function() {

      it('calculates correctly (both sides)', function() {
        element.style.border = '5px solid chocolate';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(20);
      });

      it('calculates correctly (one side)', function() {
        element.style.border = '5px solid chocolate';
        element.style.borderBottomWidth = '0';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(15);
      });

    });

    describe('with padding and margin', function() {

      it('calculates correctly (both sides)', function() {
        element.style.padding = '5px';
        element.style.margin = '5px';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(30);
      });

      it('calculates correctly (one side)', function() {
        element.style.paddingTop = '5px';
        element.style.marginTop = '5px';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(20);
      });

    });

    describe('with padding and border', function() {

      it('calculates correctly (both sides)', function() {
        element.style.padding = '5px';
        element.style.border = '5px solid chocolate';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(30);
      });

      it('calculates correctly (one side)', function() {
        element.style.paddingTop = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderBottomWidth = '0';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(20);
      });

    });

    describe('with margin and border', function() {

      it('calculates correctly (both sides)', function() {
        element.style.margin = '5px';
        element.style.border = '5px solid chocolate';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(30);
      });

      it('calculates correctly (one side)', function() {
        element.style.marginTop = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderBottomWidth = '0';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(20);
      });

    });

    describe('with padding, margin and border', function() {

      it('calculates correctly (both sides)', function() {
        element.style.margin = '5px';
        element.style.padding = '5px';
        element.style.border = '5px solid chocolate';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(40);
      });

      it('calculates correctly (one side)', function() {
        element.style.marginTop = '5px';
        element.style.paddingTop = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderBottomWidth = '0';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(25);
      });

    });

  });

});
