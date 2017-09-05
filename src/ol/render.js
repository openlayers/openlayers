import _ol_has_ from './has';
import _ol_transform_ from './transform';
import _ol_render_canvas_Immediate_ from './render/canvas/immediate';
var _ol_render_ = {};


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
_ol_render_.toContext = function(context, opt_options) {
  var canvas = context.canvas;
  var options = opt_options ? opt_options : {};
  var pixelRatio = options.pixelRatio || _ol_has_.DEVICE_PIXEL_RATIO;
  var size = options.size;
  if (size) {
    canvas.width = size[0] * pixelRatio;
    canvas.height = size[1] * pixelRatio;
    canvas.style.width = size[0] + 'px';
    canvas.style.height = size[1] + 'px';
  }
  var extent = [0, 0, canvas.width, canvas.height];
  var transform = _ol_transform_.scale(_ol_transform_.create(), pixelRatio, pixelRatio);
  return new _ol_render_canvas_Immediate_(context, pixelRatio, extent, transform,
      0);
};
export default _ol_render_;
