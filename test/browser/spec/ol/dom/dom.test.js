import {
  createCanvasContext2D,
  outerHeight,
  outerWidth,
  replaceChildren,
} from '../../../../../src/ol/dom.js';

describe('ol.dom', function () {
  describe('ol.dom.createCanvasContext2D', function () {
    // default values from
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas
    const defaultWidth = 300;
    const defaultHeight = 150;

    it('returns a CanvasRenderingContext2D', function () {
      const ctx = createCanvasContext2D();
      expect(ctx).to.be.a(CanvasRenderingContext2D);
      expect(ctx.canvas).to.be.a(HTMLCanvasElement);
      expect(ctx.canvas.width).to.be(defaultWidth);
      expect(ctx.canvas.height).to.be(defaultHeight);
    });

    it('has the desired width', function () {
      const ctx = createCanvasContext2D(42);
      expect(ctx).to.be.a(CanvasRenderingContext2D);
      expect(ctx.canvas).to.be.a(HTMLCanvasElement);
      expect(ctx.canvas.width).to.be(42);
      expect(ctx.canvas.height).to.be(defaultHeight);
    });

    it('has the desired height', function () {
      const ctx = createCanvasContext2D(undefined, 42);
      expect(ctx).to.be.a(CanvasRenderingContext2D);
      expect(ctx.canvas).to.be.a(HTMLCanvasElement);
      expect(ctx.canvas.width).to.be(defaultWidth);
      expect(ctx.canvas.height).to.be(42);
    });

    it('has the desired height and width', function () {
      const ctx = createCanvasContext2D(42, 42);
      expect(ctx).to.be.a(CanvasRenderingContext2D);
      expect(ctx.canvas).to.be.a(HTMLCanvasElement);
      expect(ctx.canvas.width).to.be(42);
      expect(ctx.canvas.height).to.be(42);
    });
  });

  describe('ol.dom.outerWidth', function () {
    let element = null;
    beforeEach(function () {
      element = document.createElement('div');
      element.style.padding = 0;
      element.style.margin = 0;
      element.style.border = 'none';
      element.style.width = '10px';
      element.style.height = '10px';
      document.body.appendChild(element);
    });
    afterEach(function () {
      element.parentNode.removeChild(element);
      element = null;
    });

    describe('without padding, margin or border', function () {
      it('calculates correctly', function () {
        const calcWidth = outerWidth(element);
        expect(calcWidth).to.be(10);
      });
    });

    describe('with padding', function () {
      it('calculates correctly (both sides)', function () {
        element.style.padding = '5px';
        const calcWidth = outerWidth(element);
        expect(calcWidth).to.be(20);
      });

      it('calculates correctly (one side)', function () {
        element.style.paddingLeft = '5px';
        const calcWidth = outerWidth(element);
        expect(calcWidth).to.be(15);
      });
    });

    describe('with margin', function () {
      it('calculates correctly (both sides)', function () {
        element.style.margin = '5px';
        const calcWidth = outerWidth(element);
        expect(calcWidth).to.be(20);
      });

      it('calculates correctly (one side)', function () {
        element.style.marginLeft = '5px';
        const calcWidth = outerWidth(element);
        expect(calcWidth).to.be(15);
      });
    });

    describe('with border', function () {
      it('calculates correctly (both sides)', function () {
        element.style.border = '5px solid chocolate';
        const calcWidth = outerWidth(element);
        expect(calcWidth).to.be(20);
      });

      it('calculates correctly (one side)', function () {
        element.style.border = '5px solid chocolate';
        element.style.borderRightWidth = '0';
        const calcWidth = outerWidth(element);
        expect(calcWidth).to.be(15);
      });
    });

    describe('with padding and margin', function () {
      it('calculates correctly (both sides)', function () {
        element.style.padding = '5px';
        element.style.margin = '5px';
        const calcWidth = outerWidth(element);
        expect(calcWidth).to.be(30);
      });

      it('calculates correctly (one side)', function () {
        element.style.paddingLeft = '5px';
        element.style.marginLeft = '5px';
        const calcWidth = outerWidth(element);
        expect(calcWidth).to.be(20);
      });
    });

    describe('with padding and border', function () {
      it('calculates correctly (both sides)', function () {
        element.style.padding = '5px';
        element.style.border = '5px solid chocolate';
        const calcWidth = outerWidth(element);
        expect(calcWidth).to.be(30);
      });

      it('calculates correctly (one side)', function () {
        element.style.paddingLeft = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderRightWidth = '0';
        const calcWidth = outerWidth(element);
        expect(calcWidth).to.be(20);
      });
    });

    describe('with margin and border', function () {
      it('calculates correctly (both sides)', function () {
        element.style.margin = '5px';
        element.style.border = '5px solid chocolate';
        const calcWidth = outerWidth(element);
        expect(calcWidth).to.be(30);
      });

      it('calculates correctly (one side)', function () {
        element.style.marginLeft = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderRightWidth = '0';
        const calcWidth = outerWidth(element);
        expect(calcWidth).to.be(20);
      });
    });

    describe('with padding, margin and border', function () {
      it('calculates correctly (both sides)', function () {
        element.style.margin = '5px';
        element.style.padding = '5px';
        element.style.border = '5px solid chocolate';
        const calcWidth = outerWidth(element);
        expect(calcWidth).to.be(40);
      });

      it('calculates correctly (one side)', function () {
        element.style.marginLeft = '5px';
        element.style.paddingLeft = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderRightWidth = '0';
        const calcWidth = outerWidth(element);
        expect(calcWidth).to.be(25);
      });
    });
  });

  describe('ol.dom.outerHeight', function () {
    let element = null;
    beforeEach(function () {
      element = document.createElement('div');
      element.style.padding = 0;
      element.style.margin = 0;
      element.style.border = 'none';
      element.style.width = '10px';
      element.style.height = '10px';
      document.body.appendChild(element);
    });
    afterEach(function () {
      element.parentNode.removeChild(element);
      element = null;
    });

    describe('without padding, margin or border', function () {
      it('calculates correctly', function () {
        const calcHeight = outerHeight(element);
        expect(calcHeight).to.be(10);
      });
    });

    describe('with padding', function () {
      it('calculates correctly (both sides)', function () {
        element.style.padding = '5px';
        const calcHeight = outerHeight(element);
        expect(calcHeight).to.be(20);
      });

      it('calculates correctly (one side)', function () {
        element.style.paddingTop = '5px';
        const calcHeight = outerHeight(element);
        expect(calcHeight).to.be(15);
      });
    });

    describe('with margin', function () {
      it('calculates correctly (both sides)', function () {
        element.style.margin = '5px';
        const calcHeight = outerHeight(element);
        expect(calcHeight).to.be(20);
      });

      it('calculates correctly (one side)', function () {
        element.style.marginTop = '5px';
        const calcHeight = outerHeight(element);
        expect(calcHeight).to.be(15);
      });
    });

    describe('with border', function () {
      it('calculates correctly (both sides)', function () {
        element.style.border = '5px solid chocolate';
        const calcHeight = outerHeight(element);
        expect(calcHeight).to.be(20);
      });

      it('calculates correctly (one side)', function () {
        element.style.border = '5px solid chocolate';
        element.style.borderBottomWidth = '0';
        const calcHeight = outerHeight(element);
        expect(calcHeight).to.be(15);
      });
    });

    describe('with padding and margin', function () {
      it('calculates correctly (both sides)', function () {
        element.style.padding = '5px';
        element.style.margin = '5px';
        const calcHeight = outerHeight(element);
        expect(calcHeight).to.be(30);
      });

      it('calculates correctly (one side)', function () {
        element.style.paddingTop = '5px';
        element.style.marginTop = '5px';
        const calcHeight = outerHeight(element);
        expect(calcHeight).to.be(20);
      });
    });

    describe('with padding and border', function () {
      it('calculates correctly (both sides)', function () {
        element.style.padding = '5px';
        element.style.border = '5px solid chocolate';
        const calcHeight = outerHeight(element);
        expect(calcHeight).to.be(30);
      });

      it('calculates correctly (one side)', function () {
        element.style.paddingTop = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderBottomWidth = '0';
        const calcHeight = outerHeight(element);
        expect(calcHeight).to.be(20);
      });
    });

    describe('with margin and border', function () {
      it('calculates correctly (both sides)', function () {
        element.style.margin = '5px';
        element.style.border = '5px solid chocolate';
        const calcHeight = outerHeight(element);
        expect(calcHeight).to.be(30);
      });

      it('calculates correctly (one side)', function () {
        element.style.marginTop = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderBottomWidth = '0';
        const calcHeight = outerHeight(element);
        expect(calcHeight).to.be(20);
      });
    });

    describe('with padding, margin and border', function () {
      it('calculates correctly (both sides)', function () {
        element.style.margin = '5px';
        element.style.padding = '5px';
        element.style.border = '5px solid chocolate';
        const calcHeight = outerHeight(element);
        expect(calcHeight).to.be(40);
      });

      it('calculates correctly (one side)', function () {
        element.style.marginTop = '5px';
        element.style.paddingTop = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderBottomWidth = '0';
        const calcHeight = outerHeight(element);
        expect(calcHeight).to.be(25);
      });
    });
  });

  describe('replaceChildren()', function () {
    function assertChildrenMatch(parent, children) {
      const actual = parent.childNodes;
      expect(actual).to.have.length(children.length);
      for (let i = 0; i < children.length; i++) {
        expect(actual[i]).to.be(children[i]);
      }
    }

    it('adds new children to an empty parent', function () {
      const parent = document.createElement('div');
      const children = [
        document.createElement('a'),
        document.createElement('b'),
        document.createElement('c'),
      ];

      replaceChildren(parent, children);
      assertChildrenMatch(parent, children);
    });

    it('removes children', function () {
      const parent = document.createElement('div');
      const existingChildren = [
        document.createElement('a'),
        document.createElement('b'),
        document.createElement('c'),
      ];
      existingChildren.forEach(function (child) {
        parent.appendChild(child);
      });

      replaceChildren(parent, []);
      expect(parent.childNodes).to.have.length(0);
    });

    it('swaps children', function () {
      const parent = document.createElement('div');
      const existingChildren = [
        document.createElement('a'),
        document.createElement('b'),
        document.createElement('c'),
      ];
      existingChildren.forEach(function (child) {
        parent.appendChild(child);
      });

      const newChildren = [
        document.createElement('d'),
        document.createElement('e'),
        document.createElement('f'),
      ];

      replaceChildren(parent, newChildren);
      assertChildrenMatch(parent, newChildren);
    });

    it('appends children', function () {
      const parent = document.createElement('div');
      const existingChildren = [
        document.createElement('a'),
        document.createElement('b'),
        document.createElement('c'),
      ];
      existingChildren.forEach(function (child) {
        parent.appendChild(child);
      });

      const newChildren = [
        document.createElement('d'),
        document.createElement('e'),
        document.createElement('f'),
      ];

      const allChildren = existingChildren.concat(newChildren);

      replaceChildren(parent, allChildren);
      assertChildrenMatch(parent, allChildren);
    });

    it('prunes children', function () {
      const parent = document.createElement('div');
      const existingChildren = [
        document.createElement('a'),
        document.createElement('b'),
        document.createElement('c'),
        document.createElement('d'),
        document.createElement('e'),
      ];
      existingChildren.forEach(function (child) {
        parent.appendChild(child);
      });

      const desiredChildren = [existingChildren[1], existingChildren[3]];

      replaceChildren(parent, desiredChildren);
      assertChildrenMatch(parent, desiredChildren);
    });

    it('reorders children', function () {
      const parent = document.createElement('div');
      const existingChildren = [
        document.createElement('a'),
        document.createElement('b'),
        document.createElement('c'),
        document.createElement('d'),
        document.createElement('e'),
      ];
      existingChildren.forEach(function (child) {
        parent.appendChild(child);
      });

      const desiredChildren = [
        existingChildren[1],
        existingChildren[3],
        existingChildren[0],
        existingChildren[4],
        existingChildren[2],
      ];

      replaceChildren(parent, desiredChildren);
      assertChildrenMatch(parent, desiredChildren);
    });

    it('reorders, prunes, and appends children', function () {
      const parent = document.createElement('div');
      const existingChildren = [
        document.createElement('a'),
        document.createElement('b'),
        document.createElement('c'),
        document.createElement('d'),
        document.createElement('e'),
      ];
      existingChildren.forEach(function (child) {
        parent.appendChild(child);
      });

      const desiredChildren = [
        document.createElement('f'),
        existingChildren[3],
        document.createElement('g'),
        existingChildren[0],
        existingChildren[2],
      ];

      const clone = desiredChildren.slice();

      replaceChildren(parent, desiredChildren);
      assertChildrenMatch(parent, desiredChildren);

      // confirm we haven't modified the input
      expect(desiredChildren).to.eql(clone);
    });
  });
});
