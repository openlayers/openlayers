import { WORKER_OFFSCREEN_CANVAS } from './has.js';

/**
 * @module ol/dom
 */

//FIXME Move this function to the canvas module
/**
 * Create an html canvas element and returns its 2d context.
 * @param {number} [opt_width] Canvas width.
 * @param {number} [opt_height] Canvas height.
 * @param {Array<HTMLCanvasElement>} [opt_canvasPool] Canvas pool to take existing canvas from.
 * @param {CanvasRenderingContext2DSettings} [opt_Context2DSettings] CanvasRenderingContext2DSettings
 * @return {CanvasRenderingContext2D} The context.
 */

let allCanvasRef = []; //keeps all references to the created canvas inside the createCanvasContext2D function

/**
 * Make a calculation of the memory used by all the canvas we currently in 'allCanvasRef' array and return the total Mb (approx)
 * A single canvas requires  canvas.width * canvas.height * 4(red, green, blue, alpha) bytes. 
 * @return {number} Total memory canvas in MB (the sum of size of all canvas on allCanvasRef)
 */
export function getCanvasMemorySize() {
  let canvas, totalSizeMb = 0;
  for (let i in allCanvasRef) {
    canvas = allCanvasRef[i];
    totalSizeMb += (canvas.width * canvas.height * 4) / Math.pow(10, 6);
  }
  return Math.round(totalSizeMb);
}

/** 
* Release all canvas memory
*/
export function releaseAllCanvasMemory() {
  for (let i in allCanvasRef) {
    releaseCanvas(allCanvasRef[i]);
  }
}

/** 
* Release a single canvas.
*/
export function releaseCanvas(canvas) {
  canvas.width = 1;
  canvas.height = 1;
  canvas.getContext('2d').clearRect(0, 0, 1, 1);
}

export function createCanvasContext2D(
  opt_width,
  opt_height,
  opt_canvasPool,
  opt_Context2DSettings
) {
  /** @type {HTMLCanvasElement|OffscreenCanvas} */
  let canvas;
  if (opt_canvasPool && opt_canvasPool.length) {
    canvas = opt_canvasPool.shift();
  } else if (WORKER_OFFSCREEN_CANVAS) {
    canvas = new OffscreenCanvas(opt_width || 300, opt_height || 300);
  } else {
    canvas = document.createElement('canvas');
    allCanvasRef.push(canvas);
  }
  if (opt_width) {
    canvas.width = opt_width;
  }
  if (opt_height) {
    canvas.height = opt_height;
  }
  //FIXME Allow OffscreenCanvasRenderingContext2D as return type
  return /** @type {CanvasRenderingContext2D} */ (
    canvas.getContext('2d', opt_Context2DSettings)
  );
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
 * @return {Node} The node that was removed or null.
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
