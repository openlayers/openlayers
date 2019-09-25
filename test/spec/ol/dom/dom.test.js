import {createCanvasContext2D, outerWidth, outerHeight, replaceChildren} from '../../../../src/ol/dom.js';

describe('ol.dom', () => {

  describe('ol.dom.createCanvasContext2D', () => {
    // default values from
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas
    const defaultWidth = 300;
    const defaultHeight = 150;

    test('returns a CanvasRenderingContext2D', () => {
      const ctx = createCanvasContext2D();
      expect(ctx).toBeInstanceOf(CanvasRenderingContext2D);
      expect(ctx.canvas).toBeInstanceOf(HTMLCanvasElement);
      expect(ctx.canvas.width).toBe(defaultWidth);
      expect(ctx.canvas.height).toBe(defaultHeight);
    });

    test('has the desired width', () => {
      const ctx = createCanvasContext2D(42);
      expect(ctx).toBeInstanceOf(CanvasRenderingContext2D);
      expect(ctx.canvas).toBeInstanceOf(HTMLCanvasElement);
      expect(ctx.canvas.width).toBe(42);
      expect(ctx.canvas.height).toBe(defaultHeight);
    });

    test('has the desired height', () => {
      const ctx = createCanvasContext2D(undefined, 42);
      expect(ctx).toBeInstanceOf(CanvasRenderingContext2D);
      expect(ctx.canvas).toBeInstanceOf(HTMLCanvasElement);
      expect(ctx.canvas.width).toBe(defaultWidth);
      expect(ctx.canvas.height).toBe(42);
    });

    test('has the desired height and width', () => {
      const ctx = createCanvasContext2D(42, 42);
      expect(ctx).toBeInstanceOf(CanvasRenderingContext2D);
      expect(ctx.canvas).toBeInstanceOf(HTMLCanvasElement);
      expect(ctx.canvas.width).toBe(42);
      expect(ctx.canvas.height).toBe(42);
    });

  });

  describe('ol.dom.outerWidth', () => {
    let element = null;
    beforeEach(() => {
      element = document.createElement('div');
      element.style.padding = 0;
      element.style.margin = 0;
      element.style.border = 'none';
      element.style.width = '10px';
      element.style.height = '10px';
      document.body.appendChild(element);
    });
    afterEach(() => {
      element.parentNode.removeChild(element);
      element = null;
    });

    describe('without padding, margin or border', () => {

      test('calculates correctly', () => {
        const calcWidth = outerWidth(element);
        expect(calcWidth).toBe(10);
      });

    });

    describe('with padding', () => {
      test('calculates correctly (both sides)', () => {
        element.style.padding = '5px';
        const calcWidth = outerWidth(element);
        expect(calcWidth).toBe(20);
      });

      test('calculates correctly (one side)', () => {
        element.style.paddingLeft = '5px';
        const calcWidth = outerWidth(element);
        expect(calcWidth).toBe(15);
      });
    });

    describe('with margin', () => {

      test('calculates correctly (both sides)', () => {
        element.style.margin = '5px';
        const calcWidth = outerWidth(element);
        expect(calcWidth).toBe(20);
      });

      test('calculates correctly (one side)', () => {
        element.style.marginLeft = '5px';
        const calcWidth = outerWidth(element);
        expect(calcWidth).toBe(15);
      });

    });

    describe('with border', () => {

      test('calculates correctly (both sides)', () => {
        element.style.border = '5px solid chocolate';
        const calcWidth = outerWidth(element);
        expect(calcWidth).toBe(20);
      });

      test('calculates correctly (one side)', () => {
        element.style.border = '5px solid chocolate';
        element.style.borderRightWidth = '0';
        const calcWidth = outerWidth(element);
        expect(calcWidth).toBe(15);
      });

    });

    describe('with padding and margin', () => {

      test('calculates correctly (both sides)', () => {
        element.style.padding = '5px';
        element.style.margin = '5px';
        const calcWidth = outerWidth(element);
        expect(calcWidth).toBe(30);
      });

      test('calculates correctly (one side)', () => {
        element.style.paddingLeft = '5px';
        element.style.marginLeft = '5px';
        const calcWidth = outerWidth(element);
        expect(calcWidth).toBe(20);
      });

    });

    describe('with padding and border', () => {

      test('calculates correctly (both sides)', () => {
        element.style.padding = '5px';
        element.style.border = '5px solid chocolate';
        const calcWidth = outerWidth(element);
        expect(calcWidth).toBe(30);
      });

      test('calculates correctly (one side)', () => {
        element.style.paddingLeft = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderRightWidth = '0';
        const calcWidth = outerWidth(element);
        expect(calcWidth).toBe(20);
      });

    });

    describe('with margin and border', () => {

      test('calculates correctly (both sides)', () => {
        element.style.margin = '5px';
        element.style.border = '5px solid chocolate';
        const calcWidth = outerWidth(element);
        expect(calcWidth).toBe(30);
      });

      test('calculates correctly (one side)', () => {
        element.style.marginLeft = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderRightWidth = '0';
        const calcWidth = outerWidth(element);
        expect(calcWidth).toBe(20);
      });

    });

    describe('with padding, margin and border', () => {

      test('calculates correctly (both sides)', () => {
        element.style.margin = '5px';
        element.style.padding = '5px';
        element.style.border = '5px solid chocolate';
        const calcWidth = outerWidth(element);
        expect(calcWidth).toBe(40);
      });

      test('calculates correctly (one side)', () => {
        element.style.marginLeft = '5px';
        element.style.paddingLeft = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderRightWidth = '0';
        const calcWidth = outerWidth(element);
        expect(calcWidth).toBe(25);
      });

    });

  });

  describe('ol.dom.outerHeight', () => {
    let element = null;
    beforeEach(() => {
      element = document.createElement('div');
      element.style.padding = 0;
      element.style.margin = 0;
      element.style.border = 'none';
      element.style.width = '10px';
      element.style.height = '10px';
      document.body.appendChild(element);
    });
    afterEach(() => {
      element.parentNode.removeChild(element);
      element = null;
    });

    describe('without padding, margin or border', () => {

      test('calculates correctly', () => {
        const calcHeight = outerHeight(element);
        expect(calcHeight).toBe(10);
      });

    });

    describe('with padding', () => {
      test('calculates correctly (both sides)', () => {
        element.style.padding = '5px';
        const calcHeight = outerHeight(element);
        expect(calcHeight).toBe(20);
      });

      test('calculates correctly (one side)', () => {
        element.style.paddingTop = '5px';
        const calcHeight = outerHeight(element);
        expect(calcHeight).toBe(15);
      });
    });

    describe('with margin', () => {

      test('calculates correctly (both sides)', () => {
        element.style.margin = '5px';
        const calcHeight = outerHeight(element);
        expect(calcHeight).toBe(20);
      });

      test('calculates correctly (one side)', () => {
        element.style.marginTop = '5px';
        const calcHeight = outerHeight(element);
        expect(calcHeight).toBe(15);
      });

    });

    describe('with border', () => {

      test('calculates correctly (both sides)', () => {
        element.style.border = '5px solid chocolate';
        const calcHeight = outerHeight(element);
        expect(calcHeight).toBe(20);
      });

      test('calculates correctly (one side)', () => {
        element.style.border = '5px solid chocolate';
        element.style.borderBottomWidth = '0';
        const calcHeight = outerHeight(element);
        expect(calcHeight).toBe(15);
      });

    });

    describe('with padding and margin', () => {

      test('calculates correctly (both sides)', () => {
        element.style.padding = '5px';
        element.style.margin = '5px';
        const calcHeight = outerHeight(element);
        expect(calcHeight).toBe(30);
      });

      test('calculates correctly (one side)', () => {
        element.style.paddingTop = '5px';
        element.style.marginTop = '5px';
        const calcHeight = outerHeight(element);
        expect(calcHeight).toBe(20);
      });

    });

    describe('with padding and border', () => {

      test('calculates correctly (both sides)', () => {
        element.style.padding = '5px';
        element.style.border = '5px solid chocolate';
        const calcHeight = outerHeight(element);
        expect(calcHeight).toBe(30);
      });

      test('calculates correctly (one side)', () => {
        element.style.paddingTop = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderBottomWidth = '0';
        const calcHeight = outerHeight(element);
        expect(calcHeight).toBe(20);
      });

    });

    describe('with margin and border', () => {

      test('calculates correctly (both sides)', () => {
        element.style.margin = '5px';
        element.style.border = '5px solid chocolate';
        const calcHeight = outerHeight(element);
        expect(calcHeight).toBe(30);
      });

      test('calculates correctly (one side)', () => {
        element.style.marginTop = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderBottomWidth = '0';
        const calcHeight = outerHeight(element);
        expect(calcHeight).toBe(20);
      });

    });

    describe('with padding, margin and border', () => {

      test('calculates correctly (both sides)', () => {
        element.style.margin = '5px';
        element.style.padding = '5px';
        element.style.border = '5px solid chocolate';
        const calcHeight = outerHeight(element);
        expect(calcHeight).toBe(40);
      });

      test('calculates correctly (one side)', () => {
        element.style.marginTop = '5px';
        element.style.paddingTop = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderBottomWidth = '0';
        const calcHeight = outerHeight(element);
        expect(calcHeight).toBe(25);
      });

    });

  });

  describe('replaceChildren()', () => {

    function assertChildrenMatch(parent, children) {
      const actual = parent.childNodes;
      expect(actual).toHaveLength(children.length);
      for (let i = 0; i < children.length; i++) {
        expect(actual[i]).toBe(children[i]);
      }
    }

    test('adds new children to an empty parent', () => {
      const parent = document.createElement('div');
      const children = [
        document.createElement('a'),
        document.createElement('b'),
        document.createElement('c')
      ];

      replaceChildren(parent, children);
      assertChildrenMatch(parent, children);
    });

    test('removes children', () => {
      const parent = document.createElement('div');
      const existingChildren = [
        document.createElement('a'),
        document.createElement('b'),
        document.createElement('c')
      ];
      existingChildren.forEach(function(child) {
        parent.appendChild(child);
      });

      replaceChildren(parent, []);
      expect(parent.childNodes).toHaveLength(0);
    });

    test('swaps children', () => {
      const parent = document.createElement('div');
      const existingChildren = [
        document.createElement('a'),
        document.createElement('b'),
        document.createElement('c')
      ];
      existingChildren.forEach(function(child) {
        parent.appendChild(child);
      });

      const newChildren = [
        document.createElement('d'),
        document.createElement('e'),
        document.createElement('f')
      ];

      replaceChildren(parent, newChildren);
      assertChildrenMatch(parent, newChildren);
    });

    test('appends children', () => {
      const parent = document.createElement('div');
      const existingChildren = [
        document.createElement('a'),
        document.createElement('b'),
        document.createElement('c')
      ];
      existingChildren.forEach(function(child) {
        parent.appendChild(child);
      });

      const newChildren = [
        document.createElement('d'),
        document.createElement('e'),
        document.createElement('f')
      ];

      const allChildren = existingChildren.concat(newChildren);

      replaceChildren(parent, allChildren);
      assertChildrenMatch(parent, allChildren);
    });

    test('prunes children', () => {
      const parent = document.createElement('div');
      const existingChildren = [
        document.createElement('a'),
        document.createElement('b'),
        document.createElement('c'),
        document.createElement('d'),
        document.createElement('e')
      ];
      existingChildren.forEach(function(child) {
        parent.appendChild(child);
      });

      const desiredChildren = [
        existingChildren[1],
        existingChildren[3]
      ];

      replaceChildren(parent, desiredChildren);
      assertChildrenMatch(parent, desiredChildren);
    });

    test('reorders children', () => {
      const parent = document.createElement('div');
      const existingChildren = [
        document.createElement('a'),
        document.createElement('b'),
        document.createElement('c'),
        document.createElement('d'),
        document.createElement('e')
      ];
      existingChildren.forEach(function(child) {
        parent.appendChild(child);
      });

      const desiredChildren = [
        existingChildren[1],
        existingChildren[3],
        existingChildren[0],
        existingChildren[4],
        existingChildren[2]
      ];

      replaceChildren(parent, desiredChildren);
      assertChildrenMatch(parent, desiredChildren);
    });

    test('reorders, prunes, and appends children', () => {
      const parent = document.createElement('div');
      const existingChildren = [
        document.createElement('a'),
        document.createElement('b'),
        document.createElement('c'),
        document.createElement('d'),
        document.createElement('e')
      ];
      existingChildren.forEach(function(child) {
        parent.appendChild(child);
      });

      const desiredChildren = [
        document.createElement('f'),
        existingChildren[3],
        document.createElement('g'),
        existingChildren[0],
        existingChildren[2]
      ];

      const clone = desiredChildren.slice();

      replaceChildren(parent, desiredChildren);
      assertChildrenMatch(parent, desiredChildren);

      expect(desiredChildren).toEqual(clone);
    });

  });

});
