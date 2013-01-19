goog.provide('ol.renderer.canvas');
goog.provide('ol.renderer.canvas.Renderer');

goog.require('goog.asserts');
goog.require('goog.vec.Mat4');
goog.require('ol.Coordinate');
goog.require('ol.Pixel');
goog.require('ol.canvas');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.style.LiteralLine');
goog.require('ol.style.LiteralPoint');
goog.require('ol.style.LiteralShape');
goog.require('ol.style.ShapeType');


/**
 * @return {boolean} Is supported.
 */
ol.renderer.canvas.isSupported = ol.canvas.isSupported;



/**
 * @constructor
 * @param {!HTMLCanvasElement} canvas Target canvas.
 * @param {!goog.vec.Mat4.Number} transform Transform.
 * @param {ol.Pixel=} opt_offset Pixel offset for top-left corner.  This is
 *    provided as an optional argument as a convenience in cases where the
 *    transform applies to a separate canvas.
 */
ol.renderer.canvas.Renderer = function(canvas, transform, opt_offset) {

  var context = /** @type {CanvasRenderingContext2D} */
      (canvas.getContext('2d')),
      dx = goog.isDef(opt_offset) ? opt_offset.x : 0,
      dy = goog.isDef(opt_offset) ? opt_offset.y : 0;

  context.setTransform(
      goog.vec.Mat4.getElement(transform, 0, 0),
      goog.vec.Mat4.getElement(transform, 1, 0),
      goog.vec.Mat4.getElement(transform, 0, 1),
      goog.vec.Mat4.getElement(transform, 1, 1),
      goog.vec.Mat4.getElement(transform, 0, 3) + dx,
      goog.vec.Mat4.getElement(transform, 1, 3) + dy);

  /**
   * @type {CanvasRenderingContext2D}
   * @private
   */
  this.context_ = context;

};


/**
 * @param {Array.<ol.geom.LineString>} lines Line array.
 * @param {ol.style.LiteralLine} symbolizer Line symbolizer.
 */
ol.renderer.canvas.Renderer.prototype.renderLineStrings =
    function(lines, symbolizer) {

  var context = this.context_,
      i, ii, line, coords, dim, j, jj, x, y;

  context.globalAlpha = symbolizer.opacity;
  context.strokeStyle = symbolizer.strokeStyle;
  context.lineWidth = symbolizer.strokeWidth;
  context.beginPath();

  for (i = 0, ii = lines.length; i < ii; ++i) {
    line = lines[i];
    dim = line.dimension;
    coords = line.coordinates;
    for (j = 0, jj = coords.length; j < jj; j += dim) {
      x = coords[j];
      y = coords[j + 1];
      if (j === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
  }

  context.stroke();
};


/**
 * @param {Array.<ol.geom.Point>} points Point array.
 * @param {ol.style.LiteralPoint} symbolizer Point symbolizer.
 */
ol.renderer.canvas.Renderer.prototype.renderPoints =
    function(points, symbolizer) {

  var context = this.context_,
      canvas, i, ii, coords;

  if (symbolizer instanceof ol.style.LiteralShape) {
    canvas = ol.renderer.canvas.Renderer.renderShape(symbolizer);
  } else {
    throw new Error('Unsupported symbolizer: ' + symbolizer);
  }

  var mid = canvas.width / 2;
  context.save();
  context.translate(-mid, -mid);
  context.globalAlpha = 1;
  for (i = 0, ii = points.length; i < ii; ++i) {
    coords = points[i].coordinates;
    context.drawImage(canvas, coords[0], coords[1]);
  }
  context.restore();
};


/**
 * @param {ol.style.LiteralShape} circle Shape symbolizer.
 * @return {!HTMLCanvasElement} Canvas element.
 * @private
 */
ol.renderer.canvas.Renderer.renderCircle_ = function(circle) {
  var size = circle.size + (2 * circle.strokeWidth) + 1,
      mid = size / 2,
      canvas = /** @type {HTMLCanvasElement} */
          (goog.dom.createElement(goog.dom.TagName.CANVAS)),
      context = /** @type {CanvasRenderingContext2D} */
          (canvas.getContext('2d')),
      fillStyle = circle.fillStyle,
      strokeStyle = circle.strokeStyle,
      twoPi = Math.PI * 2;

  canvas.height = size;
  canvas.width = size;

  context.globalAlpha = circle.opacity;

  if (fillStyle) {
    context.fillStyle = circle.fillStyle;
  }
  if (strokeStyle) {
    context.lineWidth = circle.strokeWidth;
    context.strokeStyle = circle.strokeStyle;
  }

  context.beginPath();
  context.arc(mid, mid, circle.size / 2, 0, twoPi, true);

  if (fillStyle) {
    context.fill();
  }
  if (strokeStyle) {
    context.stroke();
  }
  return canvas;
};


/**
 * @param {ol.style.LiteralShape} shape Shape symbolizer.
 * @return {!HTMLCanvasElement} Canvas element.
 */
ol.renderer.canvas.Renderer.renderShape = function(shape) {
  var canvas;
  if (shape.type === ol.style.ShapeType.CIRCLE) {
    canvas = ol.renderer.canvas.Renderer.renderCircle_(shape);
  } else {
    throw new Error('Unsupported shape type: ' + shape);
  }
  return canvas;
};

