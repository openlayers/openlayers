goog.provide('ol.render.webgl.Immediate');
goog.require('goog.array');
goog.require('goog.object');
goog.require('ol.extent');
goog.require('ol.render.IVectorContext');
goog.require('ol.render.webgl.ReplayGroup');



/**
 * @constructor
 * @implements {ol.render.IVectorContext}
 * @param {ol.webgl.Context} context Context.
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {ol.Size} size Size.
 * @param {ol.Extent} extent Extent.
 * @param {number} pixelRatio Pixel ratio.
 * @struct
 */
ol.render.webgl.Immediate = function(context,
    center, resolution, rotation, size, extent, pixelRatio) {

  /**
   * @private
   */
  this.context_ = context;

  /**
   * @private
   */
  this.center_ = center;

  /**
   * @private
   */
  this.extent_ = extent;

  /**
   * @private
   */
  this.pixelRatio_ = pixelRatio;

  /**
   * @private
   */
  this.size_ = size;

  /**
   * @private
   */
  this.rotation_ = rotation;

  /**
   * @private
   */
  this.resolution_ = resolution;

  /**
   * @private
   * @type {ol.style.Image}
   */
  this.imageStyle_ = null;

  /**
   * @private
   * @type {Object.<string,
   *        Array.<function(ol.render.webgl.Immediate)>>}
   */
  this.callbacksByZIndex_ = {};
};


/**
 * FIXME: empty description for jsdoc
 */
ol.render.webgl.Immediate.prototype.flush = function() {
  /** @type {Array.<number>} */
  var zs = goog.array.map(goog.object.getKeys(this.callbacksByZIndex_), Number);
  goog.array.sort(zs);
  var i, ii, callbacks, j, jj;
  for (i = 0, ii = zs.length; i < ii; ++i) {
    callbacks = this.callbacksByZIndex_[zs[i].toString()];
    for (j = 0, jj = callbacks.length; j < jj; ++j) {
      callbacks[j](this);
    }
  }
};


/**
 * @param {number} zIndex Z index.
 * @param {function(ol.render.webgl.Immediate)} callback Callback.
 * @api
 */
ol.render.webgl.Immediate.prototype.drawAsync = function(zIndex, callback) {
  var zIndexKey = zIndex.toString();
  var callbacks = this.callbacksByZIndex_[zIndexKey];
  if (goog.isDef(callbacks)) {
    callbacks.push(callback);
  } else {
    this.callbacksByZIndex_[zIndexKey] = [callback];
  }
};


/**
 * @inheritDoc
 * @api
 */
ol.render.webgl.Immediate.prototype.drawCircleGeometry =
    function(circleGeometry, data) {
};


/**
 * @inheritDoc
 * @api
 */
ol.render.webgl.Immediate.prototype.drawFeature = function(feature, style) {
  var geometry = style.getGeometryFunction()(feature);
  if (!goog.isDefAndNotNull(geometry) ||
      !ol.extent.intersects(this.extent_, geometry.getExtent())) {
    return;
  }
  var zIndex = style.getZIndex();
  if (!goog.isDef(zIndex)) {
    zIndex = 0;
  }
  this.drawAsync(zIndex, function(render) {
    render.setFillStrokeStyle(style.getFill(), style.getStroke());
    render.setImageStyle(style.getImage());
    render.setTextStyle(style.getText());
    var type = geometry.getType();
    var renderGeometry = ol.render.webgl.Immediate.GEOMETRY_RENDERERS_[type];
    // Do not assert since all kinds of geometries are not handled yet.
    // In spite, render what we support.
    if (renderGeometry) {
      renderGeometry.call(render, geometry, null);
    }
  });
};


/**
 * @inheritDoc
 * @api
 */
ol.render.webgl.Immediate.prototype.drawGeometryCollectionGeometry =
    function(geometryCollectionGeometry, data) {
  var geometries = geometryCollectionGeometry.getGeometriesArray();
  var renderers = ol.render.webgl.Immediate.GEOMETRY_RENDERERS_;
  var i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    var geometry = geometries[i];
    var geometryRenderer = renderers[geometry.getType()];
    // Do not assert since all kinds of geometries are not handled yet.
    // In order to support hierarchies, delegate instead what we can to
    // valid renderers.
    if (geometryRenderer) {
      geometryRenderer.call(this, geometry, data);
    }
  }
};


/**
 * @inheritDoc
 * @api
 */
ol.render.webgl.Immediate.prototype.drawPointGeometry =
    function(pointGeometry, data) {
  var context = this.context_;
  var replayGroup = new ol.render.webgl.ReplayGroup(1, this.extent_);
  var replay = replayGroup.getReplay(0, ol.render.ReplayType.IMAGE);
  replay.setImageStyle(this.imageStyle_);
  replay.drawPointGeometry(pointGeometry, data);
  replay.finish(context);
  // default colors
  var opacity = 1;
  var brightness = 0;
  var contrast = 1;
  var hue = 0;
  var saturation = 1;
  replay.replay(this.context_, this.center_, this.resolution_, this.rotation_,
      this.size_, this.extent_, this.pixelRatio_, opacity, brightness,
      contrast, hue, saturation, {});
  replay.getDeleteResourcesFunction(context)();
};


/**
 * @inheritDoc
 * @api
 */
ol.render.webgl.Immediate.prototype.drawLineStringGeometry =
    function(lineStringGeometry, data) {
};


/**
 * @inheritDoc
 * @api
 */
ol.render.webgl.Immediate.prototype.drawMultiLineStringGeometry =
    function(multiLineStringGeometry, data) {
};


/**
 * @inheritDoc
 * @api
 */
ol.render.webgl.Immediate.prototype.drawMultiPointGeometry =
    function(multiPointGeometry, data) {
  var context = this.context_;
  var replayGroup = new ol.render.webgl.ReplayGroup(1, this.extent_);
  var replay = replayGroup.getReplay(0, ol.render.ReplayType.IMAGE);
  replay.setImageStyle(this.imageStyle_);
  replay.drawMultiPointGeometry(multiPointGeometry, data);
  replay.finish(context);
  // default colors
  var opacity = 1;
  var brightness = 0;
  var contrast = 1;
  var hue = 0;
  var saturation = 1;
  replay.replay(this.context_, this.center_, this.resolution_, this.rotation_,
      this.size_, this.extent_, this.pixelRatio_, opacity, brightness,
      contrast, hue, saturation, {});
  replay.getDeleteResourcesFunction(context)();
};


/**
 * @inheritDoc
 * @api
 */
ol.render.webgl.Immediate.prototype.drawMultiPolygonGeometry =
    function(multiPolygonGeometry, data) {
};


/**
 * @inheritDoc
 * @api
 */
ol.render.webgl.Immediate.prototype.drawPolygonGeometry =
    function(polygonGeometry, data) {
};


/**
 * @inheritDoc
 * @api
 */
ol.render.webgl.Immediate.prototype.drawText =
    function(flatCoordinates, offset, end, stride, geometry, data) {
};


/**
 * @inheritDoc
 * @api
 */
ol.render.webgl.Immediate.prototype.setFillStrokeStyle =
    function(fillStyle, strokeStyle) {
};


/**
 * @inheritDoc
 * @api
 */
ol.render.webgl.Immediate.prototype.setImageStyle = function(imageStyle) {
  this.imageStyle_ = imageStyle;
};


/**
 * @inheritDoc
 * @api
 */
ol.render.webgl.Immediate.prototype.setTextStyle = function(textStyle) {
};


/**
 * @const
 * @private
 * @type {Object.<ol.geom.GeometryType,
 *                function(this: ol.render.webgl.Immediate, ol.geom.Geometry,
 *                         Object)>}
 */
ol.render.webgl.Immediate.GEOMETRY_RENDERERS_ = {
  'Point': ol.render.webgl.Immediate.prototype.drawPointGeometry,
  'MultiPoint': ol.render.webgl.Immediate.prototype.drawMultiPointGeometry,
  'GeometryCollection':
      ol.render.webgl.Immediate.prototype.drawGeometryCollectionGeometry
};
