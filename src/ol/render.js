/**
 * @module ol/render
 */
import {DEVICE_PIXEL_RATIO} from './has.js';
import _ol_transform_ from './transform.js';
import CanvasImmediateRenderer from './render/canvas/Immediate.js';


/**
 * Binds a Canvas Immediate API to a canvas context, to allow drawing geometries
 * to the context's canvas.
 *
 * The units for geometry coordinates are css pixels relative to the top left
 * corner of the canvas element.
 * ```js
 * var canvas = document.createElement('canvas');
 * var render = ol.render.toContext(canvas.getContext('2d'),
 *     { size: [100, 100] });
 * render.setFillStrokeStyle(new ol.style.Fill({ color: blue }));
 * render.drawPolygon(
 *     new ol.geom.Polygon([[[0, 0], [100, 100], [100, 0], [0, 0]]]));
 * ```
 *
 * @param {CanvasRenderingContext2D} context Canvas context.
 * @param {olx.render.ToContextOptions=} opt_options Options.
 * @return {ol.render.canvas.Immediate} Canvas Immediate.
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
  const transform = _ol_transform_.scale(_ol_transform_.create(), pixelRatio, pixelRatio);
  return new CanvasImmediateRenderer(context, pixelRatio, extent, transform, 0);
}
