import {WORKER_OFFSCREEN_CANVAS} from './has.js';

/**
 * @module ol/dom
 */

//FIXME Move this function to the canvas module
/**
 * Create an html canvas element and returns its 2d context.
 * @param {number} [width] Canvas width.
 * @param {number} [height] Canvas height.
 * @param {Array<HTMLCanvasElement|OffscreenCanvas>} [canvasPool] Canvas pool to take existing canvas from.
 * @param {CanvasRenderingContext2DSettings} [settings] CanvasRenderingContext2DSettings
 * @return {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} The context.
 */
export function createCanvasContext2D(width, height, canvasPool, settings) {
  /** @type {HTMLCanvasElement|OffscreenCanvas} */
  let canvas;
  if (canvasPool && canvasPool.length) {
    canvas = /** @type {HTMLCanvasElement} */ (canvasPool.shift());
  } else if (WORKER_OFFSCREEN_CANVAS) {
    canvas = new (class extends OffscreenCanvas {
      style = {};
    })(width ?? 300, height ?? 150);
  } else {
    canvas = document.createElement('canvas');
  }
  if (width) {
    canvas.width = width;
  }
  if (height) {
    canvas.height = height;
  }
  return /** @type {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} */ (
    canvas.getContext('2d', settings)
  );
}

/**
 * @type {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D}
 */
let sharedCanvasContext;

/**
 * @return {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} Shared canvas context.
 */
export function getSharedCanvasContext2D() {
  if (!sharedCanvasContext) {
    sharedCanvasContext = createCanvasContext2D(1, 1);
  }
  return sharedCanvasContext;
}

/**
 * Releases canvas memory to avoid exceeding memory limits in Safari.
 * See https://pqina.nl/blog/total-canvas-memory-use-exceeds-the-maximum-limit/
 * @param {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} context Context.
 */
export function releaseCanvas(context) {
  const canvas = context.canvas;
  canvas.width = 1;
  canvas.height = 1;
  context.clearRect(0, 0, 1, 1);
}

/**
 * Get the current computed width for the given element including margin,
 * padding and border.
 * Equivalent to jQuery's `$(el).outerWidth(true)`.
 * @param {!HTMLElement} element Element.
 * @return {number} The width.
 */
export function outerWidth(element) {
  let width = element.offsetWidth;
  const style = getComputedStyle(element);
  width += parseInt(style.marginLeft, 10) + parseInt(style.marginRight, 10);

  return width;
}

/**
 * Get the current computed height for the given element including margin,
 * padding and border.
 * Equivalent to jQuery's `$(el).outerHeight(true)`.
 * @param {!HTMLElement} element Element.
 * @return {number} The height.
 */
export function outerHeight(element) {
  let height = element.offsetHeight;
  const style = getComputedStyle(element);
  height += parseInt(style.marginTop, 10) + parseInt(style.marginBottom, 10);

  return height;
}

/**
 * @param {Node} newNode Node to replace old node
 * @param {Node} oldNode The node to be replaced
 */
export function replaceNode(newNode, oldNode) {
  const parent = oldNode.parentNode;
  if (parent) {
    parent.replaceChild(newNode, oldNode);
  }
}

/**
 * @param {Node} node The node to remove the children from.
 */
export function removeChildren(node) {
  while (node.lastChild) {
    node.lastChild.remove();
  }
}

/**
 * Transform the children of a parent node so they match the
 * provided list of children.  This function aims to efficiently
 * remove, add, and reorder child nodes while maintaining a simple
 * implementation (it is not guaranteed to minimize DOM operations).
 * @param {Node} node The parent node whose children need reworking.
 * @param {Array<Node>} children The desired children.
 */
export function replaceChildren(node, children) {
  const oldChildren = node.childNodes;

  for (let i = 0; true; ++i) {
    const oldChild = oldChildren[i];
    const newChild = children[i];

    // check if our work is done
    if (!oldChild && !newChild) {
      break;
    }

    // check if children match
    if (oldChild === newChild) {
      continue;
    }

    // check if a new child needs to be added
    if (!oldChild) {
      node.appendChild(newChild);
      continue;
    }

    // check if an old child needs to be removed
    if (!newChild) {
      node.removeChild(oldChild);
      --i;
      continue;
    }

    // reorder
    node.insertBefore(newChild, oldChild);
  }
}

/**
 * Creates a minimal structure that mocks a DIV to be used by the composite and
 * layer renderer in a worker environment
 * @return {HTMLDivElement} mocked DIV
 */
export function createMockDiv() {
  const mockedDiv = new Proxy(
    {
      /**
       * @type {Array<HTMLElement>}
       */
      childNodes: [],
      /**
       * @param {HTMLElement} node html node.
       * @return {HTMLElement} html node.
       */
      appendChild: function (node) {
        this.childNodes.push(node);
        return node;
      },
      /**
       * dummy function, as this structure is not supposed to have a parent.
       */
      remove: function () {},
      /**
       * @param {HTMLElement} node html node.
       * @return {HTMLElement} html node.
       */
      removeChild: function (node) {
        const index = this.childNodes.indexOf(node);
        if (index === -1) {
          throw new Error('Node to remove was not found');
        }
        this.childNodes.splice(index, 1);
        return node;
      },
      /**
       * @param {HTMLElement} newNode new html node.
       * @param {HTMLElement} referenceNode reference html node.
       * @return {HTMLElement} new html node.
       */
      insertBefore: function (newNode, referenceNode) {
        const index = this.childNodes.indexOf(referenceNode);
        if (index === -1) {
          throw new Error('Reference node not found');
        }
        this.childNodes.splice(index, 0, newNode);
        return newNode;
      },
      style: {},
    },
    {
      get(target, prop, receiver) {
        if (prop === 'firstElementChild') {
          return target.childNodes.length > 0 ? target.childNodes[0] : null;
        }
        return Reflect.get(target, prop, receiver);
      },
    },
  );
  return /** @type {HTMLDivElement} */ (/** @type {*} */ (mockedDiv));
}

/***
 * @param {*} obj The object to check.
 * @return {obj is (HTMLCanvasElement | OffscreenCanvas)} The object is a canvas.
 */
export function isCanvas(obj) {
  return (
    (typeof HTMLCanvasElement !== 'undefined' &&
      obj instanceof HTMLCanvasElement) ||
    (typeof OffscreenCanvas !== 'undefined' && obj instanceof OffscreenCanvas)
  );
}
