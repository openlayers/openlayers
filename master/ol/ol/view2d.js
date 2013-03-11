// FIXME getView3D has not return type
// FIXME remove getExtent?

goog.provide('ol.View2D');
goog.provide('ol.View2DProperty');

goog.require('ol.Constraints');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.IView2D');
goog.require('ol.IView3D');
goog.require('ol.Projection');
goog.require('ol.ResolutionConstraint');
goog.require('ol.RotationConstraint');
goog.require('ol.Size');
goog.require('ol.View');
goog.require('ol.animation');
goog.require('ol.easing');
goog.require('ol.projection');


/**
 * @enum {string}
 */
ol.View2DProperty = {
  CENTER: 'center',
  PROJECTION: 'projection',
  RESOLUTION: 'resolution',
  ROTATION: 'rotation'
};



/**
 * @constructor
 * @implements {ol.IView2D}
 * @implements {ol.IView3D}
 * @extends {ol.View}
 * @param {ol.View2DOptions=} opt_view2DOptions View2D options.
 */
ol.View2D = function(opt_view2DOptions) {
  goog.base(this);
  var view2DOptions = opt_view2DOptions || {};

  /**
   * @type {Object.<string, *>}
   */
  var values = {};
  values[ol.View2DProperty.CENTER] = goog.isDef(view2DOptions.center) ?
      view2DOptions.center : null;
  values[ol.View2DProperty.PROJECTION] = ol.projection.createProjection(
      view2DOptions.projection, 'EPSG:3857');
  if (goog.isDef(view2DOptions.resolution)) {
    values[ol.View2DProperty.RESOLUTION] = view2DOptions.resolution;
  } else if (goog.isDef(view2DOptions.zoom)) {
    var projectionExtent = values[ol.View2DProperty.PROJECTION].getExtent();
    var size = Math.max(
        projectionExtent.maxX - projectionExtent.minX,
        projectionExtent.maxY - projectionExtent.minY);
    values[ol.View2DProperty.RESOLUTION] =
        size / (ol.DEFAULT_TILE_SIZE * Math.pow(2, view2DOptions.zoom));
  }
  values[ol.View2DProperty.ROTATION] = view2DOptions.rotation;
  this.setValues(values);

  /**
   * @private
   * @type {ol.Constraints}
   */
  this.constraints_ = ol.View2D.createConstraints_(view2DOptions);

};
goog.inherits(ol.View2D, ol.View);


/**
 * @inheritDoc
 */
ol.View2D.prototype.getCenter = function() {
  return /** @type {ol.Coordinate|undefined} */ (
      this.get(ol.View2DProperty.CENTER));
};
goog.exportProperty(
    ol.View2D.prototype,
    'getCenter',
    ol.View2D.prototype.getCenter);


/**
 * @param {ol.Size} size Box pixel size.
 * @return {ol.Extent} Extent.
 */
ol.View2D.prototype.getExtent = function(size) {
  goog.asserts.assert(this.isDef());
  var center = this.getCenter();
  var resolution = this.getResolution();
  var minX = center.x - resolution * size.width / 2;
  var minY = center.y - resolution * size.height / 2;
  var maxX = center.x + resolution * size.width / 2;
  var maxY = center.y + resolution * size.height / 2;
  return new ol.Extent(minX, minY, maxX, maxY);
};


/**
 * @inheritDoc
 */
ol.View2D.prototype.getProjection = function() {
  return /** @type {ol.Projection|undefined} */ (
      this.get(ol.View2DProperty.PROJECTION));
};
goog.exportProperty(
    ol.View2D.prototype,
    'getProjection',
    ol.View2D.prototype.getProjection);


/**
 * @inheritDoc
 */
ol.View2D.prototype.getResolution = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.View2DProperty.RESOLUTION));
};
goog.exportProperty(
    ol.View2D.prototype,
    'getResolution',
    ol.View2D.prototype.getResolution);


/**
 * @param {ol.Extent} extent Extent.
 * @param {ol.Size} size Box pixel size.
 * @return {number} Resolution.
 */
ol.View2D.prototype.getResolutionForExtent = function(extent, size) {
  var xResolution = (extent.maxX - extent.minX) / size.width;
  var yResolution = (extent.maxY - extent.minY) / size.height;
  return Math.max(xResolution, yResolution);
};


/**
 * @return {number} Map rotation.
 */
ol.View2D.prototype.getRotation = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.View2DProperty.ROTATION)) || 0;
};
goog.exportProperty(
    ol.View2D.prototype,
    'getRotation',
    ol.View2D.prototype.getRotation);


/**
 * @inheritDoc
 */
ol.View2D.prototype.getView2D = function() {
  return this;
};


/**
 * @inheritDoc
 */
ol.View2D.prototype.getView2DState = function() {
  goog.asserts.assert(this.isDef());
  var center = /** @type {ol.Coordinate} */ (this.getCenter());
  var projection = /** @type {ol.Projection} */ (this.getProjection());
  var resolution = /** @type {number} */ (this.getResolution());
  var rotation = /** @type {number} */ (this.getRotation());
  return {
    center: new ol.Coordinate(center.x, center.y),
    projection: projection,
    resolution: resolution,
    rotation: rotation
  };
};


/**
 * FIXME return type
 */
ol.View2D.prototype.getView3D = function() {
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {ol.Size} size Box pixel size.
 */
ol.View2D.prototype.fitExtent = function(extent, size) {
  this.setCenter(extent.getCenter());
  var resolution = this.getResolutionForExtent(extent, size);
  resolution = this.constraints_.resolution(resolution, 0);
  this.setResolution(resolution);
};


/**
 * @return {boolean} Is defined.
 */
ol.View2D.prototype.isDef = function() {
  return goog.isDefAndNotNull(this.getCenter()) &&
      goog.isDef(this.getResolution());
};


/**
 * @param {ol.Coordinate|undefined} center Center.
 */
ol.View2D.prototype.setCenter = function(center) {
  this.set(ol.View2DProperty.CENTER, center);
};
goog.exportProperty(
    ol.View2D.prototype,
    'setCenter',
    ol.View2D.prototype.setCenter);


/**
 * @param {ol.Projection|undefined} projection Projection.
 */
ol.View2D.prototype.setProjection = function(projection) {
  this.set(ol.View2DProperty.PROJECTION, projection);
};
goog.exportProperty(
    ol.View2D.prototype,
    'setProjection',
    ol.View2D.prototype.setProjection);


/**
 * @param {number|undefined} resolution Resolution.
 */
ol.View2D.prototype.setResolution = function(resolution) {
  this.set(ol.View2DProperty.RESOLUTION, resolution);
};
goog.exportProperty(
    ol.View2D.prototype,
    'setResolution',
    ol.View2D.prototype.setResolution);


/**
 * @param {number|undefined} rotation Rotation.
 */
ol.View2D.prototype.setRotation = function(rotation) {
  this.set(ol.View2DProperty.ROTATION, rotation);
};
goog.exportProperty(
    ol.View2D.prototype,
    'setRotation',
    ol.View2D.prototype.setRotation);


/**
 * @param {ol.Map} map Map.
 * @param {ol.Coordinate} delta Delta.
 * @param {number=} opt_duration Duration.
 */
ol.View2D.prototype.pan = function(map, delta, opt_duration) {
  var currentCenter = this.getCenter();
  if (goog.isDef(currentCenter)) {
    if (goog.isDef(opt_duration)) {
      map.requestRenderFrame();
      map.addPreRenderFunction(ol.animation.pan({
        source: currentCenter,
        duration: opt_duration,
        easing: ol.easing.linear
      }));
    }
    this.setCenter(new ol.Coordinate(
        currentCenter.x + delta.x, currentCenter.y + delta.y));
  }
};


/**
 * @param {ol.Map} map Map.
 * @param {number|undefined} rotation Rotation.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
ol.View2D.prototype.rotate =
    function(map, rotation, opt_anchor, opt_duration) {
  rotation = this.constraints_.rotation(rotation, 0);
  this.rotateWithoutConstraints(map, rotation, opt_anchor, opt_duration);
};


/**
 * @param {ol.Map} map Map.
 * @param {number|undefined} rotation Rotation.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
ol.View2D.prototype.rotateWithoutConstraints =
    function(map, rotation, opt_anchor, opt_duration) {
  if (goog.isDefAndNotNull(rotation)) {
    var currentRotation = this.getRotation();
    var currentCenter = this.getCenter();
    if (goog.isDef(currentRotation) && goog.isDef(currentCenter) &&
        goog.isDef(opt_duration)) {
      map.requestRenderFrame();
      map.addPreRenderFunction(ol.animation.rotate({
        rotation: currentRotation,
        duration: opt_duration,
        easing: ol.easing.easeOut
      }));
      if (goog.isDef(opt_anchor)) {
        map.addPreRenderFunction(ol.animation.pan({
          source: currentCenter,
          duration: opt_duration,
          easing: ol.easing.easeOut
        }));
      }
    }
    if (goog.isDefAndNotNull(opt_anchor)) {
      var anchor = opt_anchor;
      var oldCenter = /** @type {!ol.Coordinate} */ (this.getCenter());
      var center = new ol.Coordinate(
          oldCenter.x - anchor.x,
          oldCenter.y - anchor.y);
      center.rotate(rotation - this.getRotation());
      center.x += anchor.x;
      center.y += anchor.y;
      map.withFrozenRendering(function() {
        this.setCenter(center);
        this.setRotation(rotation);
      }, this);
    } else {
      this.setRotation(rotation);
    }
  }
};


/**
 * @param {ol.Map} map Map.
 * @param {number|undefined} resolution Resolution to go to.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
ol.View2D.prototype.zoom =
    function(map, resolution, opt_anchor, opt_duration) {
  resolution = this.constraints_.resolution(resolution, 0);
  this.zoomWithoutConstraints(map, resolution, opt_anchor, opt_duration);
};


/**
 * @param {ol.Map} map Map.
 * @param {number} delta Delta from previous zoom level.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
ol.View2D.prototype.zoomByDelta =
    function(map, delta, opt_anchor, opt_duration) {
  var currentResolution = this.getResolution();
  var resolution = this.constraints_.resolution(currentResolution, delta);
  this.zoomWithoutConstraints(map, resolution, opt_anchor, opt_duration);
};


/**
 * @param {ol.Map} map Map.
 * @param {number|undefined} resolution Resolution to go to.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
ol.View2D.prototype.zoomWithoutConstraints =
    function(map, resolution, opt_anchor, opt_duration) {
  if (goog.isDefAndNotNull(resolution)) {
    var currentResolution = this.getResolution();
    var currentCenter = this.getCenter();
    if (goog.isDef(currentResolution) && goog.isDef(currentCenter) &&
        goog.isDef(opt_duration)) {
      map.requestRenderFrame();
      map.addPreRenderFunction(ol.animation.zoom({
        resolution: currentResolution,
        duration: opt_duration,
        easing: ol.easing.easeOut
      }));
      if (goog.isDef(opt_anchor)) {
        map.addPreRenderFunction(ol.animation.pan({
          source: currentCenter,
          duration: opt_duration,
          easing: ol.easing.easeOut
        }));
      }
    }
    if (goog.isDefAndNotNull(opt_anchor)) {
      var anchor = opt_anchor;
      var oldCenter = /** @type {!ol.Coordinate} */ (this.getCenter());
      var oldResolution = this.getResolution();
      var x = anchor.x - resolution * (anchor.x - oldCenter.x) / oldResolution;
      var y = anchor.y - resolution * (anchor.y - oldCenter.y) / oldResolution;
      var center = new ol.Coordinate(x, y);
      map.withFrozenRendering(function() {
        this.setCenter(center);
        this.setResolution(resolution);
      }, this);
    } else {
      this.setResolution(resolution);
    }
  }
};


/**
 * @private
 * @param {ol.View2DOptions} view2DOptions View2D options.
 * @return {ol.Constraints} Constraints.
 */
ol.View2D.createConstraints_ = function(view2DOptions) {
  var resolutionConstraint;
  if (goog.isDef(view2DOptions.resolutions)) {
    resolutionConstraint = ol.ResolutionConstraint.createSnapToResolutions(
        view2DOptions.resolutions);
  } else {
    var maxResolution, numZoomLevels, zoomFactor;
    if (goog.isDef(view2DOptions.maxResolution) &&
        goog.isDef(view2DOptions.numZoomLevels) &&
        goog.isDef(view2DOptions.zoomFactor)) {
      maxResolution = view2DOptions.maxResolution;
      numZoomLevels = view2DOptions.numZoomLevels;
      zoomFactor = view2DOptions.zoomFactor;
    } else {
      var projectionExtent = ol.projection.createProjection(
          view2DOptions.projection, 'EPSG:3857').getExtent();
      maxResolution = Math.max(
          projectionExtent.maxX - projectionExtent.minX,
          projectionExtent.maxY - projectionExtent.minY) / ol.DEFAULT_TILE_SIZE;
      numZoomLevels = 29;
      zoomFactor = 2;
    }
    resolutionConstraint = ol.ResolutionConstraint.createSnapToPower(
        zoomFactor, maxResolution, numZoomLevels - 1);
  }
  // FIXME rotation constraint is not configurable at the moment
  var rotationConstraint = ol.RotationConstraint.createSnapToZero();
  return new ol.Constraints(resolutionConstraint, rotationConstraint);
};
