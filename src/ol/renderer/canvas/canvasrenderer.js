goog.provide('ol.renderer.canvas');
goog.provide('ol.renderer.canvas.Renderer');
goog.provide('ol.renderer.canvas.isSupported');

goog.require('goog.asserts');
goog.require('goog.vec.Mat4');
goog.require('ol.Feature');
goog.require('ol.Pixel');
goog.require('ol.canvas');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryType');
goog.require('ol.style.LiteralLine');
goog.require('ol.style.LiteralPoint');
goog.require('ol.style.LiteralPolygon');
goog.require('ol.style.LiteralShape');
goog.require('ol.style.LiteralSymbolizer');
goog.require('ol.style.ShapeType');


/**
 * @return {boolean} Is supported.
 */
ol.renderer.canvas.isSupported = ol.canvas.isSupported;



/**
 * @constructor
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {goog.vec.Mat4.Number} transform Transform.
 * @param {ol.Pixel=} opt_offset Pixel offset for top-left corner.  This is
 *    provided as an optional argument as a convenience in cases where the
 *    transform applies to a separate canvas.
 */
ol.renderer.canvas.Renderer = function(canvas, transform, opt_offset) {

  var context = /** @type {CanvasRenderingContext2D} */
      (canvas.getContext('2d')),
      dx = goog.isDef(opt_offset) ? opt_offset.x : 0,
      dy = goog.isDef(opt_offset) ? opt_offset.y : 0;

  /**
   * @type {goog.vec.Mat4.Number}
   * @private
   */
  this.transform_ = transform;
  context.setTransform(
      goog.vec.Mat4.getElement(transform, 0, 0),
      goog.vec.Mat4.getElement(transform, 1, 0),
      goog.vec.Mat4.getElement(transform, 0, 1),
      goog.vec.Mat4.getElement(transform, 1, 1),
      goog.vec.Mat4.getElement(transform, 0, 3) + dx,
      goog.vec.Mat4.getElement(transform, 1, 3) + dy);

  var vec = [1, 0, 0];
  goog.vec.Mat4.multVec3NoTranslate(transform, vec, vec);

  /**
   * @type {number}
   * @private
   */
  this.inverseScale_ = 1 / Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);

  /**
   * @type {CanvasRenderingContext2D}
   * @private
   */
  this.context_ = context;

};


/**
 * @param {ol.geom.GeometryType} type Geometry type.
 * @param {Array.<ol.Feature>} features Array of features.
 * @param {ol.style.LiteralSymbolizer} symbolizer Symbolizer.
 */
ol.renderer.canvas.Renderer.prototype.renderFeaturesByGeometryType =
    function(type, features, symbolizer) {
  switch (type) {
    case ol.geom.GeometryType.POINT:
      goog.asserts.assert(symbolizer instanceof ol.style.LiteralPoint);
      this.renderPointFeatures_(
          features, /** @type {ol.style.LiteralPoint} */ (symbolizer));
      break;
    case ol.geom.GeometryType.LINESTRING:
      goog.asserts.assert(symbolizer instanceof ol.style.LiteralLine);
      this.renderLineStringFeatures_(
          features, /** @type {ol.style.LiteralLine} */ (symbolizer));
      break;
    case ol.geom.GeometryType.POLYGON:
      goog.asserts.assert(symbolizer instanceof ol.style.LiteralPolygon);
      this.renderPolygonFeatures_(
          features, /** @type {ol.style.LiteralPolygon} */ (symbolizer));
      break;
    default:
      throw new Error('Rendering not implemented for geometry type: ' + type);
  }
};


/**
 * @param {Array.<ol.Feature>} features Array of line features.
 * @param {ol.style.LiteralLine} symbolizer Line symbolizer.
 * @private
 */
ol.renderer.canvas.Renderer.prototype.renderLineStringFeatures_ =
    function(features, symbolizer) {

  var context = this.context_,
      i, ii, line, coords, dim, j, jj, x, y;

  context.globalAlpha = symbolizer.opacity;
  context.strokeStyle = symbolizer.strokeStyle;
  context.lineWidth = symbolizer.strokeWidth * this.inverseScale_;
  context.beginPath();

  for (i = 0, ii = features.length; i < ii; ++i) {
    line = features[i].getGeometry();
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
 * @param {Array.<ol.Feature>} features Array of point features.
 * @param {ol.style.LiteralPoint} symbolizer Point symbolizer.
 * @private
 */
ol.renderer.canvas.Renderer.prototype.renderPointFeatures_ =
    function(features, symbolizer) {

  var context = this.context_,
      canvas, i, ii, coords, vec;

  if (symbolizer instanceof ol.style.LiteralShape) {
    canvas = ol.renderer.canvas.Renderer.renderShape(symbolizer);
  } else {
    throw new Error('Unsupported symbolizer: ' + symbolizer);
  }

  var mid = canvas.width / 2;
  context.save();
  context.setTransform(1, 0, 0, 1, -mid, -mid);
  context.globalAlpha = 1;
  for (i = 0, ii = features.length; i < ii; ++i) {
    coords = features[i].getGeometry().coordinates;
    vec = goog.vec.Mat4.multVec3(
        this.transform_, [coords[0], coords[1], 0], []);
    context.drawImage(canvas, vec[0], vec[1]);
  }
  context.restore();
};


/**
 * @param {Array.<ol.Feature>} features Array of polygon features.
 * @param {ol.style.LiteralPolygon} symbolizer Polygon symbolizer.
 * @private
 */
ol.renderer.canvas.Renderer.prototype.renderPolygonFeatures_ =
    function(features, symbolizer) {

  var context = this.context_,
      strokeStyle = symbolizer.strokeStyle,
      fillStyle = symbolizer.fillStyle,
      i, ii, poly, rings, numRings, coords, dim, j, jj, x, y;

  context.globalAlpha = symbolizer.opacity;
  if (strokeStyle) {
    context.strokeStyle = symbolizer.strokeStyle;
    context.lineWidth = symbolizer.strokeWidth * this.inverseScale_;
  }
  if (fillStyle) {
    context.fillStyle = fillStyle;
  }

  /**
   * Four scenarios covered here:
   * 1) stroke only, no holes - only need to have a single path
   * 2) fill only, no holes - only need to have a single path
   * 3) fill and stroke, no holes
   * 4) holes - render polygon to sketch canvas first
   */
  context.beginPath();
  for (i = 0, ii = features.length; i < ii; ++i) {
    poly = features[i].getGeometry();
    dim = poly.dimension;
    rings = poly.rings;
    numRings = rings.length;
    if (numRings > 1) {
      // scenario 4
      // TODO: use sketch canvas to render outer and punch holes for inner rings
      throw new Error('Rendering holes not implemented');
    } else {
      coords = rings[0].coordinates;
      for (j = 0, jj = coords.length; j < jj; j += dim) {
        x = coords[j];
        y = coords[j + 1];
        if (j === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      if (fillStyle && strokeStyle) {
        // scenario 3 - fill and stroke each time
        context.fill();
        context.stroke();
        if (i < ii - 1) {
          context.beginPath();
        }
      }
    }
  }
  if (!(fillStyle && strokeStyle)) {
    if (fillStyle) {
      // scenario 2 - fill all at once
      context.fill();
    } else {
      // scenario 1 - stroke all at once
      context.stroke();
    }
  }
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

