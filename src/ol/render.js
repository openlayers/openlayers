/**
 * @module ol/render
 */
import {DEVICE_PIXEL_RATIO} from './has.js';
import {
  apply as applyTransform,
  create as createTransform,
  multiply as multiplyTransform,
  scale as scaleTransform
} from './transform.js';
import CanvasImmediateRenderer from './render/canvas/Immediate.js';
import {getSquaredTolerance} from './renderer/vector.js';
import {getUserProjection, getTransformFromProjections} from './proj.js';


/**
 * @typedef {Object} State
 * @property {CanvasRenderingContext2D} context Canvas context that the layer is being rendered to.
 * @property {import("./Feature.js").FeatureLike} feature
 * @property {import("./geom/SimpleGeometry.js").default} geometry
 * @property {number} pixelRatio Pixel ratio used by the layer renderer.
 * @property {number} resolution Resolution that the render batch was created and optimized for.
 * This is not the view's resolution that is being rendered.
 * @property {number} rotation Rotation of the rendered layer in radians.
 */


/**
 * A function to be used when sorting features before rendering.
 * It takes two instances of {@link module:ol/Feature} or
 * {@link module:ol/render/Feature} and returns a `{number}`.
 *
 * @typedef {function(import("./Feature.js").FeatureLike, import("./Feature.js").FeatureLike):number} OrderFunction
 */


/**
 * @typedef {Object} ToContextOptions
 * @property {import("./size.js").Size} [size] Desired size of the canvas in css
 * pixels. When provided, both canvas and css size will be set according to the
 * `pixelRatio`. If not provided, the current canvas and css sizes will not be
 * altered.
 * @property {number} [pixelRatio=window.devicePixelRatio] Pixel ratio (canvas
 * pixel to css pixel ratio) for the canvas.
 */


/**
 * Binds a Canvas Immediate API to a canvas context, to allow drawing geometries
 * to the context's canvas.
 *
 * The units for geometry coordinates are css pixels relative to the top left
 * corner of the canvas element.
 * ```js
 * import {toContext} from 'ol/render';
 * import Fill from 'ol/style/Fill';
 * import Polygon from 'ol/geom/Polygon';
 *
 * var canvas = document.createElement('canvas');
 * var render = toContext(canvas.getContext('2d'),
 *     { size: [100, 100] });
 * render.setFillStrokeStyle(new Fill({ color: blue }));
 * render.drawPolygon(
 *     new Polygon([[[0, 0], [100, 100], [100, 0], [0, 0]]]));
 * ```
 *
 * @param {CanvasRenderingContext2D} context Canvas context.
 * @param {ToContextOptions=} opt_options Options.
 * @return {CanvasImmediateRenderer} Canvas Immediate.
 * @api
 */
export function toContext(context, opt_options) {
  const canvas = context.canvas;
  const options = opt_options ? opt_options : {};
  const pixelRatio = options.pixelRatio || DEVICE_PIXEL_RATIO;
  const size = options.size;
  if (size) {
    canvas.width = size[0] * pixelRatio;
    canvas.height = size[1] * pixelRatio;
    canvas.style.width = size[0] + 'px';
    canvas.style.height = size[1] + 'px';
  }
  const extent = [0, 0, canvas.width, canvas.height];
  const transform = scaleTransform(createTransform(), pixelRatio, pixelRatio);
  return new CanvasImmediateRenderer(context, pixelRatio, extent, transform, 0);
}

/**
 * Gets a vector context for drawing to the event's canvas.
 * @param {import("./render/Event.js").default} event Render event.
 * @returns {CanvasImmediateRenderer} Vector context.
 * @api
 */
export function getVectorContext(event) {
  const frameState = event.frameState;
  const transform = multiplyTransform(event.inversePixelTransform.slice(), frameState.coordinateToPixelTransform);
  const squaredTolerance = getSquaredTolerance(frameState.viewState.resolution, frameState.pixelRatio);
  let userTransform;
  const userProjection = getUserProjection();
  if (userProjection) {
    userTransform = getTransformFromProjections(userProjection, frameState.viewState.projection);
  }
  return new CanvasImmediateRenderer(
    event.context, frameState.pixelRatio, frameState.extent, transform,
    frameState.viewState.rotation, squaredTolerance, userTransform);
}

/**
 * Gets the pixel of the event's canvas context from the map viewport's CSS pixel.
 * @param {import("./render/Event.js").default} event Render event.
 * @param {import("./pixel.js").Pixel} pixel CSS pixel relative to the top-left
 * corner of the map viewport.
 * @returns {import("./pixel.js").Pixel} Pixel on the event's canvas context.
 * @api
 */
export function getRenderPixel(event, pixel) {
  const result = pixel.slice(0);
  applyTransform(event.inversePixelTransform.slice(), result);
  return result;
}

/**
 * @param {import("./PluggableMap.js").FrameState} frameState Frame state.
 * @param {?} declutterTree Declutter tree.
 * @returns {?} Declutter tree.
 */
export function renderDeclutterItems(frameState, declutterTree) {
  if (declutterTree) {
    declutterTree.clear();
  }
  const items = frameState.declutterItems;
  for (let z = items.length - 1; z >= 0; --z) {
    const item = items[z];
    const zIndexItems = item.items;
    for (let i = 0, ii = zIndexItems.length; i < ii; i += 3) {
      declutterTree = zIndexItems[i].renderDeclutter(zIndexItems[i + 1], zIndexItems[i + 2], item.opacity, declutterTree);
    }
  }
  items.length = 0;
  return declutterTree;
}
