import {WORKER_OFFSCREEN_CANVAS} from './has.js';

/**
 * @module ol/dom
 */

//FIXME Move this function to the canvas module
/**
 * Create an html canvas element and returns its 2d context.
 * @param {number} [width] Canvas width.
 * @param {number} [height] Canvas height.
 * @param {Array<HTMLCanvasElement>} [canvasPool] Canvas pool to take existing canvas from.
 * @param {CanvasRenderingContext2DSettings} [settings] CanvasRenderingContext2DSettings
 * @return {CanvasRenderingContext2D} The context.
 */
export function createCanvasContext2D(width, height, canvasPool, settings) {
  /** @type {HTMLCanvasElement|OffscreenCanvas} */
  let canvas;
  if (canvasPool && canvasPool.length) {
    canvas = canvasPool.shift();
  } else if (WORKER_OFFSCREEN_CANVAS) {
    canvas = new OffscreenCanvas(width || 300, height || 300);
  } else {
    canvas = document.createElement('canvas');
  }
  if (width) {
    canvas.width = width;
  }
  if (height) {
    canvas.height = height;
  }
  //FIXME Allow OffscreenCanvasRenderingContext2D as return type
  return /** @type {CanvasRenderingContext2D} */ (
    canvas.getContext('2d', settings)
  );
}

/**
 * Releases canvas memory to avoid exceeding memory limits in Safari.
 * See https://pqina.nl/blog/total-canvas-memory-use-exceeds-the-maximum-limit/
 * @param {CanvasRenderingContext2D} context Context.
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
 * @param {Node} node The node to remove.
 * @return {Node|null} The node that was removed or null.
 */
export function removeNode(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null;
}

/**
 * @param {Node} node The node to remove the children from.
 */
export function removeChildren(node) {
  while (node.lastChild) {
    node.removeChild(node.lastChild);
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
