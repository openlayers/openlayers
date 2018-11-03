/**
 * @module ol/render
 */
import {DEVICE_PIXEL_RATIO} from './has.js';
import {create as createTransform, scale as scaleTransform} from './transform.js';
import CanvasImmediateRenderer from './render/canvas/Immediate.js';


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
