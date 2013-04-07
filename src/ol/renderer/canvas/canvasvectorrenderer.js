goog.provide('ol.renderer.canvas.VectorRenderer');


goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.vec.Mat4');
goog.require('ol.Feature');
goog.require('ol.Pixel');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.style.IconLiteral');
goog.require('ol.style.LineLiteral');
goog.require('ol.style.PointLiteral');
goog.require('ol.style.PolygonLiteral');
goog.require('ol.style.ShapeLiteral');
goog.require('ol.style.ShapeType');
goog.require('ol.style.SymbolizerLiteral');



/**
 * @constructor
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {goog.vec.Mat4.Number} transform Transform.
 * @param {ol.Pixel=} opt_offset Pixel offset for top-left corner.  This is
 *     provided as an optional argument as a convenience in cases where the
 *     transform applies to a separate canvas.
 * @param {function()=} opt_iconLoadedCallback Callback for deferred rendering
 *     when images need to be loaded before rendering.
 */
ol.renderer.canvas.VectorRenderer =
    function(canvas, transform, opt_offset, opt_iconLoadedCallback) {

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

  /**
   * @type {function()|undefined}
   * @private
   */
  this.iconLoadedCallback_ = opt_iconLoadedCallback;

};


/**
 * @param {ol.geom.GeometryType} type Geometry type.
 * @param {Array.<ol.Feature>} features Array of features.
 * @param {ol.style.SymbolizerLiteral} symbolizer Symbolizer.
 * @return {boolean} true if deferred, false if rendered.
 */
ol.renderer.canvas.VectorRenderer.prototype.renderFeaturesByGeometryType =
    function(type, features, symbolizer) {
  var deferred = false;
  switch (type) {
    case ol.geom.GeometryType.POINT:
    case ol.geom.GeometryType.MULTIPOINT:
      goog.asserts.assert(symbolizer instanceof ol.style.PointLiteral,
          'Expected point symbolizer: ' + symbolizer);
      deferred = this.renderPointFeatures_(
          features, /** @type {ol.style.PointLiteral} */ (symbolizer));
      break;
    case ol.geom.GeometryType.LINESTRING:
    case ol.geom.GeometryType.MULTILINESTRING:
      goog.asserts.assert(symbolizer instanceof ol.style.LineLiteral,
          'Expected line symbolizer: ' + symbolizer);
      this.renderLineStringFeatures_(
          features, /** @type {ol.style.LineLiteral} */ (symbolizer));
      break;
    case ol.geom.GeometryType.POLYGON:
    case ol.geom.GeometryType.MULTIPOLYGON:
      goog.asserts.assert(symbolizer instanceof ol.style.PolygonLiteral,
          'Expected polygon symbolizer: ' + symbolizer);
      this.renderPolygonFeatures_(
          features, /** @type {ol.style.PolygonLiteral} */ (symbolizer));
      break;
    default:
      throw new Error('Rendering not implemented for geometry type: ' + type);
  }
  return deferred;
};


/**
 * @param {Array.<ol.Feature>} features Array of line features.
 * @param {ol.style.LineLiteral} symbolizer Line symbolizer.
 * @private
 */
ol.renderer.canvas.VectorRenderer.prototype.renderLineStringFeatures_ =
    function(features, symbolizer) {

  var context = this.context_,
      i, ii, geometry, components, j, jj, line, dim, k, kk, x, y;

  context.globalAlpha = symbolizer.opacity;
  context.strokeStyle = symbolizer.strokeColor;
  context.lineWidth = symbolizer.strokeWidth * this.inverseScale_;
  context.lineCap = 'round'; // TODO: accept this as a symbolizer property
  context.lineJoin = 'round'; // TODO: accept this as a symbolizer property
  context.beginPath();
  for (i = 0, ii = features.length; i < ii; ++i) {
    geometry = features[i].getGeometry();
    if (geometry instanceof ol.geom.LineString) {
      components = [geometry];
    } else {
      goog.asserts.assert(geometry instanceof ol.geom.MultiLineString,
          'Expected MultiLineString');
      components = geometry.components;
    }
    for (j = 0, jj = components.length; j < jj; ++j) {
      line = components[j];
      dim = line.dimension;
      for (k = 0, kk = line.getCount(); k < kk; ++k) {
        x = line.get(k, 0);
        y = line.get(k, 1);
        if (k === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
    }
  }

  context.stroke();
};


/**
 * @param {Array.<ol.Feature>} features Array of point features.
 * @param {ol.style.PointLiteral} symbolizer Point symbolizer.
 * @return {boolean} true if deferred, false if rendered.
 * @private
 */
ol.renderer.canvas.VectorRenderer.prototype.renderPointFeatures_ =
    function(features, symbolizer) {

  var context = this.context_,
      content, alpha, i, ii, geometry, components, j, jj, point, vec;

  if (symbolizer instanceof ol.style.ShapeLiteral) {
    content = ol.renderer.canvas.VectorRenderer.renderShape(symbolizer);
    alpha = 1;
  } else if (symbolizer instanceof ol.style.IconLiteral) {
    content = ol.renderer.canvas.VectorRenderer.renderIcon(
        symbolizer, this.iconLoadedCallback_);
    alpha = symbolizer.opacity;
  } else {
    throw new Error('Unsupported symbolizer: ' + symbolizer);
  }

  if (goog.isNull(content)) {
    return true;
  }

  var midWidth = content.width / 2;
  var midHeight = content.height / 2;
  context.save();
  context.setTransform(1, 0, 0, 1, -midWidth, -midHeight);
  context.globalAlpha = alpha;
  for (i = 0, ii = features.length; i < ii; ++i) {
    geometry = features[i].getGeometry();
    if (geometry instanceof ol.geom.Point) {
      components = [geometry];
    } else {
      goog.asserts.assert(geometry instanceof ol.geom.MultiPoint,
          'Expected MultiPoint');
      components = geometry.components;
    }
    for (j = 0, jj = components.length; j < jj; ++j) {
      point = components[j];
      vec = goog.vec.Mat4.multVec3(
          this.transform_, [point.get(0), point.get(1), 0], []);
      context.drawImage(content, vec[0], vec[1], content.width, content.height);
    }
  }
  context.restore();

  return false;
};


/**
 * @param {Array.<ol.Feature>} features Array of polygon features.
 * @param {ol.style.PolygonLiteral} symbolizer Polygon symbolizer.
 * @private
 */
ol.renderer.canvas.VectorRenderer.prototype.renderPolygonFeatures_ =
    function(features, symbolizer) {
  var context = this.context_,
      strokeColor = symbolizer.strokeColor,
      fillColor = symbolizer.fillColor,
      i, ii, geometry, components, j, jj, poly,
      rings, numRings, ring, dim, k, kk, x, y;

  context.globalAlpha = symbolizer.opacity;
  if (strokeColor) {
    context.strokeStyle = symbolizer.strokeColor;
    context.lineWidth = symbolizer.strokeWidth * this.inverseScale_;
    context.lineCap = 'round'; // TODO: accept this as a symbolizer property
    context.lineJoin = 'round'; // TODO: accept this as a symbolizer property
  }
  if (fillColor) {
    context.fillStyle = fillColor;
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
    geometry = features[i].getGeometry();
    if (geometry instanceof ol.geom.Polygon) {
      components = [geometry];
    } else {
      goog.asserts.assert(geometry instanceof ol.geom.MultiPolygon,
          'Expected MultiPolygon');
      components = geometry.components;
    }
    for (j = 0, jj = components.length; j < jj; ++j) {
      poly = components[j];
      dim = poly.dimension;
      rings = poly.rings;
      numRings = rings.length;
      if (numRings > 0) {
        // TODO: scenario 4
        ring = rings[0];
        for (k = 0, kk = ring.getCount(); k < kk; ++k) {
          x = ring.get(k, 0);
          y = ring.get(k, 1);
          if (k === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }
        if (fillColor && strokeColor) {
          // scenario 3 - fill and stroke each time
          context.fill();
          context.stroke();
          if (i < ii - 1 || j < jj - 1) {
            context.beginPath();
          }
        }
      }
    }
  }
  if (!(fillColor && strokeColor)) {
    if (fillColor) {
      // scenario 2 - fill all at once
      context.fill();
    } else {
      // scenario 1 - stroke all at once
      context.stroke();
    }
  }
};


/**
 * @param {ol.style.ShapeLiteral} circle Shape symbolizer.
 * @return {!HTMLCanvasElement} Canvas element.
 * @private
 */
ol.renderer.canvas.VectorRenderer.renderCircle_ = function(circle) {
  var strokeWidth = circle.strokeWidth || 0,
      size = circle.size + (2 * strokeWidth) + 1,
      mid = size / 2,
      canvas = /** @type {HTMLCanvasElement} */
          (goog.dom.createElement(goog.dom.TagName.CANVAS)),
      context = /** @type {CanvasRenderingContext2D} */
          (canvas.getContext('2d')),
      fillColor = circle.fillColor,
      strokeColor = circle.strokeColor,
      twoPi = Math.PI * 2;

  canvas.height = size;
  canvas.width = size;

  context.globalAlpha = circle.opacity;

  if (fillColor) {
    context.fillStyle = fillColor;
  }
  if (strokeColor) {
    context.lineWidth = strokeWidth;
    context.strokeStyle = strokeColor;
    context.lineCap = 'round'; // TODO: accept this as a symbolizer property
    context.lineJoin = 'round'; // TODO: accept this as a symbolizer property
  }

  context.beginPath();
  context.arc(mid, mid, circle.size / 2, 0, twoPi, true);

  if (fillColor) {
    context.fill();
  }
  if (strokeColor) {
    context.stroke();
  }
  return canvas;
};


/**
 * @param {ol.style.ShapeLiteral} shape Shape symbolizer.
 * @return {!HTMLCanvasElement} Canvas element.
 */
ol.renderer.canvas.VectorRenderer.renderShape = function(shape) {
  var canvas;
  if (shape.type === ol.style.ShapeType.CIRCLE) {
    canvas = ol.renderer.canvas.VectorRenderer.renderCircle_(shape);
  } else {
    throw new Error('Unsupported shape type: ' + shape);
  }
  return canvas;
};


/**
 * @param {ol.style.IconLiteral} icon Icon literal.
 * @param {function()=} opt_callback Callback which will be called when
 *     the icon is loaded and rendering will work without deferring.
 * @return {HTMLImageElement} image element of null if deferred.
 */
ol.renderer.canvas.VectorRenderer.renderIcon = function(icon, opt_callback) {
  var url = icon.url;
  var image = ol.renderer.canvas.VectorRenderer.icons_[url];
  var deferred = false;
  if (!goog.isDef(image)) {
    deferred = true;
    image = /** @type {HTMLImageElement} */
        (goog.dom.createElement(goog.dom.TagName.IMG));
    goog.events.listenOnce(image, goog.events.EventType.ERROR,
        goog.bind(ol.renderer.canvas.VectorRenderer.handleIconError_, null,
            opt_callback),
        false, ol.renderer.canvas.VectorRenderer.renderIcon);
    goog.events.listenOnce(image, goog.events.EventType.LOAD,
        goog.bind(ol.renderer.canvas.VectorRenderer.handleIconLoad_, null,
            opt_callback),
        false, ol.renderer.canvas.VectorRenderer.renderIcon);
    image.setAttribute('src', url);
  } else if (!goog.isNull(image)) {
    var width = icon.width,
        height = icon.height;
    if (goog.isDef(width) && goog.isDef(height)) {
      image.width = width;
      image.height = height;
    } else if (goog.isDef(width)) {
      image.height = width / image.width * image.height;
      image.width = width;
    } else if (goog.isDef(height)) {
      image.width = height / image.height * image.width;
      image.height = height;
    }
  }
  return deferred ? null : image;
};


/**
 * @type {Object.<string, HTMLImageElement>}
 * @private
 */
ol.renderer.canvas.VectorRenderer.icons_ = {};


/**
 * @param {function()=} opt_callback Callback.
 * @param {Event=} opt_event Event.
 * @private
 */
ol.renderer.canvas.VectorRenderer.handleIconError_ =
    function(opt_callback, opt_event) {
  if (goog.isDef(opt_event)) {
    var url = opt_event.target.getAttribute('src');
    ol.renderer.canvas.VectorRenderer.icons_[url] = null;
    ol.renderer.canvas.VectorRenderer.handleIconLoad_(opt_callback, opt_event);
  }
};


/**
 * @param {function()=} opt_callback Callback.
 * @param {Event=} opt_event Event.
 * @private
 */
ol.renderer.canvas.VectorRenderer.handleIconLoad_ =
    function(opt_callback, opt_event) {
  if (goog.isDef(opt_event)) {
    var url = opt_event.target.getAttribute('src');
    ol.renderer.canvas.VectorRenderer.icons_[url] =
        /** @type {HTMLImageElement} */ (opt_event.target);
  }
  if (goog.isDef(opt_callback)) {
    opt_callback();
  }
};
