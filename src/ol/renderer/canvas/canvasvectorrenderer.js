goog.provide('ol.renderer.canvas.Vector');


goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.vec.Mat4');
goog.require('ol.Feature');
goog.require('ol.geom.AbstractCollection');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.layer.VectorLayerRenderIntent');
goog.require('ol.style.IconLiteral');
goog.require('ol.style.LineLiteral');
goog.require('ol.style.Literal');
goog.require('ol.style.PointLiteral');
goog.require('ol.style.PolygonLiteral');
goog.require('ol.style.ShapeLiteral');
goog.require('ol.style.ShapeType');
goog.require('ol.style.TextLiteral');



/**
 * @constructor
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {goog.vec.Mat4.Number} transform Transform.
 * @param {function()=} opt_iconLoadedCallback Callback for deferred rendering
 *     when images need to be loaded before rendering.
 */
ol.renderer.canvas.Vector =
    function(canvas, transform, opt_iconLoadedCallback) {

  var context = /** @type {CanvasRenderingContext2D} */
      (canvas.getContext('2d'));
  /**
   * @type {goog.vec.Mat4.Number}
   * @private
   */
  this.transform_ = transform;

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

  /**
   * @type {Object.<number, Array.<number>>}
   * @private
   */
  this.symbolSizes_ = {};

  /**
   * @type {Object.<number, Array.<number>>}
   * @private
   */
  this.symbolOffsets_ = {};

  /**
   * @type {Array.<number>}
   * @private
   */
  this.maxSymbolSize_ = [0, 0];

};


/**
 * @return {Object.<number, Array.<number>>} Symbolizer sizes.
 */
ol.renderer.canvas.Vector.prototype.getSymbolSizes = function() {
  return this.symbolSizes_;
};


/**
 * @return {Object.<number, Array.<number>>} Symbolizer offsets.
 */
ol.renderer.canvas.Vector.prototype.getSymbolOffsets = function() {
  return this.symbolOffsets_;
};


/**
 * @return {Array.<number>} Maximum symbolizer size.
 */
ol.renderer.canvas.Vector.prototype.getMaxSymbolSize = function() {
  return this.maxSymbolSize_;
};


/**
 * @param {Array.<ol.Feature>} features Array of features.
 * @param {ol.style.Literal} symbolizer Symbolizer.
 * @param {Array} data Additional data.
 * @return {boolean} true if deferred, false if rendered.
 */
ol.renderer.canvas.Vector.prototype.renderFeatures =
    function(features, symbolizer, data) {
  var deferred = false;
  if (symbolizer instanceof ol.style.PointLiteral) {
    deferred = this.renderPointFeatures_(features, symbolizer);
  } else if (symbolizer instanceof ol.style.LineLiteral) {
    this.renderLineStringFeatures_(features, symbolizer);
  } else if (symbolizer instanceof ol.style.PolygonLiteral) {
    this.renderPolygonFeatures_(features, symbolizer);
  } else if (symbolizer instanceof ol.style.TextLiteral) {
    this.renderText_(features, symbolizer, data);
  }
  return deferred;
};


/**
 * @param {Array.<ol.Feature>} features Array of line features.
 * @param {ol.style.LineLiteral} symbolizer Line symbolizer.
 * @private
 */
ol.renderer.canvas.Vector.prototype.renderLineStringFeatures_ =
    function(features, symbolizer) {

  var context = this.context_,
      i, ii, feature, id, currentSize, geometry, components, j, jj,
      coordinates, coordinate, k, kk, strokeSize;

  var vec = [NaN, NaN, 0];
  var pixel = [NaN, NaN];
  var lastPixel = [NaN, NaN];

  context.globalAlpha = symbolizer.opacity;
  context.strokeStyle = symbolizer.color;
  context.lineWidth = symbolizer.width;
  context.lineCap = 'round'; // TODO: accept this as a symbolizer property
  context.lineJoin = 'round'; // TODO: accept this as a symbolizer property
  strokeSize = context.lineWidth * this.inverseScale_;
  context.beginPath();
  for (i = 0, ii = features.length; i < ii; ++i) {
    feature = features[i];
    if (feature.getRenderIntent() == ol.layer.VectorLayerRenderIntent.HIDDEN) {
      continue;
    }
    id = goog.getUid(feature);
    currentSize = goog.isDef(this.symbolSizes_[id]) ?
        this.symbolSizes_[id] : [0];
    currentSize[0] = Math.max(currentSize[0], strokeSize);
    this.symbolSizes_[id] = currentSize;
    this.maxSymbolSize_ = [Math.max(currentSize[0], this.maxSymbolSize_[0]),
          Math.max(currentSize[0], this.maxSymbolSize_[1])];
    geometry = feature.getGeometry();

    if (geometry instanceof ol.geom.GeometryCollection) {
      components = [];
      var tmpComponents = geometry.getComponents();
      for (j = 0, jj = tmpComponents.length; j < jj; j++) {
        if (tmpComponents[j] instanceof ol.geom.LineString) {
          components.push(tmpComponents[j]);
        }
      }
    } else if (geometry instanceof ol.geom.LineString) {
      components = [geometry];
    } else {
      goog.asserts.assert(geometry instanceof ol.geom.MultiLineString,
          'Expected MultiLineString');
      components = geometry.getComponents();
    }
    for (j = 0, jj = components.length; j < jj; ++j) {
      coordinates = components[j].getCoordinates();
      for (k = 0, kk = coordinates.length; k < kk; ++k) {
        coordinate = coordinates[k];
        vec[0] = coordinate[0];
        vec[1] = coordinate[1];
        goog.vec.Mat4.multVec3(this.transform_, vec, vec);
        if (k === 0) {
          lastPixel[0] = NaN;
          lastPixel[1] = NaN;
          context.moveTo(vec[0], vec[1]);
        } else {
          pixel[0] = Math.round(vec[0]);
          pixel[1] = Math.round(vec[1]);
          if (pixel[0] !== lastPixel[0] || pixel[1] !== lastPixel[1]) {
            context.lineTo(vec[0], vec[1]);
            lastPixel[0] = pixel[0];
            lastPixel[1] = pixel[1];
          }
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
ol.renderer.canvas.Vector.prototype.renderPointFeatures_ =
    function(features, symbolizer) {

  var context = this.context_,
      content, alpha, i, ii, feature, id, size, geometry, components, j, jj,
      point, vec;

  var xOffset = 0;
  var yOffset = 0;
  if (symbolizer instanceof ol.style.ShapeLiteral) {
    content = ol.renderer.canvas.Vector.renderShape(symbolizer);
    alpha = 1;
  } else if (symbolizer instanceof ol.style.IconLiteral) {
    content = ol.renderer.canvas.Vector.renderIcon(
        symbolizer, this.iconLoadedCallback_);
    alpha = symbolizer.opacity;
    xOffset = symbolizer.xOffset;
    yOffset = symbolizer.yOffset;
  } else {
    throw new Error('Unsupported symbolizer: ' + symbolizer);
  }

  if (goog.isNull(content)) {
    return true;
  }

  var midWidth = Math.floor(content.width / 2);
  var midHeight = Math.floor(content.height / 2);
  var contentWidth = content.width * this.inverseScale_;
  var contentHeight = content.height * this.inverseScale_;
  var contentXOffset = xOffset * this.inverseScale_;
  var contentYOffset = yOffset * this.inverseScale_;
  context.save();
  context.setTransform(1, 0, 0, 1, -midWidth, -midHeight);
  context.globalAlpha = alpha;
  for (i = 0, ii = features.length; i < ii; ++i) {
    feature = features[i];
    if (feature.getRenderIntent() == ol.layer.VectorLayerRenderIntent.HIDDEN) {
      continue;
    }
    id = goog.getUid(feature);
    size = this.symbolSizes_[id];
    this.symbolSizes_[id] = goog.isDef(size) ?
        [Math.max(size[0], contentWidth), Math.max(size[1], contentHeight)] :
        [contentWidth, contentHeight];
    this.symbolOffsets_[id] =
        [xOffset * this.inverseScale_, yOffset * this.inverseScale_];
    this.maxSymbolSize_ =
        [Math.max(this.maxSymbolSize_[0],
            this.symbolSizes_[id][0] + 2 * Math.abs(contentXOffset)),
          Math.max(this.maxSymbolSize_[1],
              this.symbolSizes_[id][1] + 2 * Math.abs(contentYOffset))];
    geometry = feature.getGeometry();

    if (geometry instanceof ol.geom.GeometryCollection) {
      components = [];
      var tmpComponents = geometry.getComponents();
      for (j = 0, jj = tmpComponents.length; j < jj; j++) {
        if (tmpComponents[j] instanceof ol.geom.Point) {
          components.push(tmpComponents[j]);
        }
      }
    } else if (geometry instanceof ol.geom.Point) {
      components = [geometry];
    } else {
      goog.asserts.assert(geometry instanceof ol.geom.MultiPoint,
          'Expected MultiPoint');
      components = geometry.getComponents();
    }
    for (j = 0, jj = components.length; j < jj; ++j) {
      point = components[j];
      vec = [point.get(0), point.get(1), 0];
      goog.vec.Mat4.multVec3(this.transform_, vec, vec);
      context.drawImage(content, Math.round(vec[0] + xOffset),
          Math.round(vec[1] + yOffset),
          content.width, content.height);
    }
  }
  context.restore();

  return false;
};


/**
 * @param {Array.<ol.Feature>} features Array of features.
 * @param {ol.style.TextLiteral} text Text symbolizer.
 * @param {Array} texts Label text for each feature.
 * @private
 */
ol.renderer.canvas.Vector.prototype.renderText_ =
    function(features, text, texts) {
  var context = this.context_,
      feature, vecs, vec;

  if (context.fillStyle !== text.color) {
    context.fillStyle = text.color;
  }

  // font shorthand values must be given in the correct order
  // see http://www.w3.org/TR/CSS21/fonts.html#font-shorthand
  context.font = text.fontWeight + ' ' +
      text.fontSize + 'px ' +
      text.fontFamily;

  context.globalAlpha = text.opacity;

  // TODO: make alignments configurable
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  var stroke = false;
  if (goog.isDef(text.strokeColor)) {
    stroke = true;
    goog.asserts.assertString(text.strokeColor);
    context.strokeStyle = text.strokeColor;
    goog.asserts.assertNumber(text.strokeWidth);
    context.lineWidth = text.strokeWidth;
  }

  for (var i = 0, ii = features.length; i < ii; ++i) {
    feature = features[i];
    if (feature.getRenderIntent() == ol.layer.VectorLayerRenderIntent.HIDDEN) {
      continue;
    }
    vecs = ol.renderer.canvas.Vector.getLabelVectors(
        feature.getGeometry());
    for (var j = 0, jj = vecs.length; j < jj; ++j) {
      vec = vecs[j];
      goog.vec.Mat4.multVec3(this.transform_, vec, vec);
      if (stroke) {
        if (text.strokeOpacity !== text.opacity) {
          goog.asserts.assertNumber(text.strokeOpacity);
          context.globalAlpha = text.strokeOpacity;
        }
        context.strokeText(texts[i], vec[0], vec[1]);
        if (text.strokeOpacity !== text.opacity) {
          context.globalAlpha = text.opacity;
        }
      }
      context.fillText(texts[i], vec[0], vec[1]);
    }
  }

};


/**
 * @param {Array.<ol.Feature>} features Array of polygon features.
 * @param {ol.style.PolygonLiteral} symbolizer Polygon symbolizer.
 * @private
 */
ol.renderer.canvas.Vector.prototype.renderPolygonFeatures_ =
    function(features, symbolizer) {
  var context = this.context_,
      strokeColor = symbolizer.strokeColor,
      strokeWidth = symbolizer.strokeWidth,
      strokeOpacity = symbolizer.strokeOpacity,
      fillColor = symbolizer.fillColor,
      fillOpacity = symbolizer.fillOpacity,
      globalAlpha,
      i, ii, geometry, components, j, jj, poly,
      rings, numRings, coordinates, coordinate, k, kk, feature;

  var vec = [NaN, NaN, 0];
  var pixel = [NaN, NaN];
  var lastPixel = [NaN, NaN];

  if (strokeColor) {
    context.strokeStyle = strokeColor;
    if (strokeWidth) {
      context.lineWidth = strokeWidth;
    }
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
    feature = features[i];
    if (feature.getRenderIntent() == ol.layer.VectorLayerRenderIntent.HIDDEN) {
      continue;
    }
    geometry = feature.getGeometry();

    if (geometry instanceof ol.geom.GeometryCollection) {
      components = [];
      var tmpComponents = geometry.getComponents();
      for (j = 0, jj = tmpComponents.length; j < jj; j++) {
        if (tmpComponents[j] instanceof ol.geom.Polygon) {
          components.push(tmpComponents[j]);
        }
      }
    } else if (geometry instanceof ol.geom.Polygon) {
      components = [geometry];
    } else {
      goog.asserts.assert(geometry instanceof ol.geom.MultiPolygon,
          'Expected MultiPolygon');
      components = geometry.getComponents();
    }
    for (j = 0, jj = components.length; j < jj; ++j) {
      poly = components[j];
      rings = poly.getRings();
      numRings = rings.length;
      if (numRings > 0) {
        // TODO: scenario 4
        coordinates = rings[0].getCoordinates();
        for (k = 0, kk = coordinates.length; k < kk; ++k) {
          coordinate = coordinates[k];
          vec[0] = coordinate[0];
          vec[1] = coordinate[1];
          goog.vec.Mat4.multVec3(this.transform_, vec, vec);
          if (k === 0) {
            lastPixel[0] = NaN;
            lastPixel[1] = NaN;
            context.moveTo(vec[0], vec[1]);
          } else {
            pixel[0] = Math.round(vec[0]);
            pixel[1] = Math.round(vec[1]);
            if (pixel[0] !== lastPixel[0] || pixel[1] !== lastPixel[1]) {
              context.lineTo(vec[0], vec[1]);
              lastPixel[0] = pixel[0];
              lastPixel[1] = pixel[1];
            }
          }
        }
        if (fillColor && strokeColor) {
          // scenario 3 - fill and stroke each time
          if (fillOpacity !== globalAlpha) {
            goog.asserts.assertNumber(fillOpacity);
            context.globalAlpha = fillOpacity;
            globalAlpha = fillOpacity;
          }
          context.fill();
          if (strokeOpacity !== globalAlpha) {
            goog.asserts.assertNumber(strokeOpacity);
            context.globalAlpha = strokeOpacity;
            globalAlpha = strokeOpacity;
          }
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
      if (fillOpacity !== globalAlpha) {
        goog.asserts.assertNumber(fillOpacity);
        context.globalAlpha = fillOpacity;
        globalAlpha = fillOpacity;
      }
      context.fill();
    } else {
      // scenario 1 - stroke all at once
      if (strokeOpacity !== globalAlpha) {
        goog.asserts.assertNumber(strokeOpacity);
        context.globalAlpha = strokeOpacity;
        globalAlpha = strokeOpacity;
      }
      context.stroke();
    }
  }
};


/**
 * @param {ol.style.ShapeLiteral} circle Shape symbolizer.
 * @return {!HTMLCanvasElement} Canvas element.
 * @private
 */
ol.renderer.canvas.Vector.renderCircle_ = function(circle) {
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
    goog.asserts.assertNumber(circle.fillOpacity);
    context.globalAlpha = circle.fillOpacity;
    context.fill();
  }
  if (strokeColor) {
    goog.asserts.assertNumber(circle.strokeOpacity);
    context.globalAlpha = circle.strokeOpacity;
    context.stroke();
  }
  return canvas;
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @return {Array.<goog.vec.Vec3.AnyType>} Renderable geometry vectors.
 */
ol.renderer.canvas.Vector.getLabelVectors = function(geometry) {
  if (geometry instanceof ol.geom.AbstractCollection) {
    var components = geometry.getComponents();
    var numComponents = components.length;
    var result = [];
    for (var i = 0; i < numComponents; ++i) {
      result.push.apply(result,
          ol.renderer.canvas.Vector.getLabelVectors(components[i]));
    }
    return result;
  }
  var type = geometry.getType();
  if (type == ol.geom.GeometryType.POINT) {
    return [[geometry.get(0), geometry.get(1), 0]];
  }
  if (type == ol.geom.GeometryType.POLYGON) {
    var coordinates = geometry.getInteriorPoint();
    return [[coordinates[0], coordinates[1], 0]];
  }
  throw new Error('Label rendering not implemented for geometry type: ' +
      type);
};


/**
 * @param {ol.style.ShapeLiteral} shape Shape symbolizer.
 * @return {!HTMLCanvasElement} Canvas element.
 */
ol.renderer.canvas.Vector.renderShape = function(shape) {
  var canvas;
  if (shape.type === ol.style.ShapeType.CIRCLE) {
    canvas = ol.renderer.canvas.Vector.renderCircle_(shape);
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
ol.renderer.canvas.Vector.renderIcon = function(icon, opt_callback) {
  var url = icon.url;
  var image = ol.renderer.canvas.Vector.icons_[url];
  var deferred = false;
  if (!goog.isDef(image)) {
    deferred = true;
    image = /** @type {HTMLImageElement} */
        (goog.dom.createElement(goog.dom.TagName.IMG));
    goog.events.listenOnce(image, goog.events.EventType.ERROR,
        goog.bind(ol.renderer.canvas.Vector.handleIconError_, null,
            opt_callback),
        false, ol.renderer.canvas.Vector.renderIcon);
    goog.events.listenOnce(image, goog.events.EventType.LOAD,
        goog.bind(ol.renderer.canvas.Vector.handleIconLoad_, null,
            opt_callback),
        false, ol.renderer.canvas.Vector.renderIcon);
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
ol.renderer.canvas.Vector.icons_ = {};


/**
 * @param {function()=} opt_callback Callback.
 * @param {Event=} opt_event Event.
 * @private
 */
ol.renderer.canvas.Vector.handleIconError_ =
    function(opt_callback, opt_event) {
  if (goog.isDef(opt_event)) {
    var url = opt_event.target.getAttribute('src');
    ol.renderer.canvas.Vector.icons_[url] = null;
    ol.renderer.canvas.Vector.handleIconLoad_(opt_callback, opt_event);
  }
};


/**
 * @param {function()=} opt_callback Callback.
 * @param {Event=} opt_event Event.
 * @private
 */
ol.renderer.canvas.Vector.handleIconLoad_ =
    function(opt_callback, opt_event) {
  if (goog.isDef(opt_event)) {
    var url = opt_event.target.getAttribute('src');
    ol.renderer.canvas.Vector.icons_[url] =
        /** @type {HTMLImageElement} */ (opt_event.target);
  }
  if (goog.isDef(opt_callback)) {
    opt_callback();
  }
};
