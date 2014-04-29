// FIXME getView3D has not return type

goog.provide('ol.View2D');
goog.provide('ol.View2DProperty');

goog.require('goog.asserts');
goog.require('ol.CenterConstraint');
goog.require('ol.Constraints');
goog.require('ol.IView2D');
goog.require('ol.IView3D');
goog.require('ol.ResolutionConstraint');
goog.require('ol.RotationConstraint');
goog.require('ol.RotationConstraintType');
goog.require('ol.Size');
goog.require('ol.View');
goog.require('ol.coordinate');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.proj.METERS_PER_UNIT');
goog.require('ol.proj.Projection');
goog.require('ol.proj.Units');


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
 * @class
 * An ol.View2D object represents a simple 2D view of the map.
 *
 * This is the object to act upon to change the center, resolution,
 * and rotation of the map.
 *
 * ### The view states
 *
 * An `ol.View2D` is determined by three states: `center`, `resolution`,
 * and `rotation`. To each state corresponds a getter and a setter. E.g.
 * `getCenter` and `setCenter` for the `center` state.
 *
 * An `ol.View2D` has a `projection`. The projection determines the
 * coordinate system of the center, and its units determine the units of the
 * resolution (projection units per pixel). The default projection is
 * Spherical Mercator (EPSG:3857).
 *
 * ### The constraints
 *
 * `setCenter`, `setResolution` and `setRotation` can be used to change the
 * states of the view. Any value can be passed to the setters. And the value
 * that is passed to a setter will effectively be the value set in the view,
 * and returned by the corresponding getter.
 *
 * But an `ol.View2D` object also has a *resolution constraint* and a
 * *rotation constraint*. There's currently no *center constraint*, but
 * this may change in the future.
 *
 * As said above no constraints are applied when the setters are used to set
 * new states for the view. Applying constraints is done explicitly through
 * the use of the `constrain*` functions (`constrainResolution` and
 * `constrainRotation`).
 *
 * The main users of the constraints are the interactions and the
 * controls. For example, double-clicking on the map changes the view to
 * the "next" resolution. And releasing the fingers after pinch-zooming
 * snaps to the closest resolution (with an animation).
 *
 * So the *resolution constraint* snaps to specific resolutions. It is
 * determined by the following options: `resolutions`, `maxResolution`,
 * `maxZoom`, and `zoomFactor`. If `resolutions` is set, the other three
 * options are ignored. See {@link ol.View2DOptions} for more information.
 *
 * The *rotation constaint* is currently not configurable. It snaps the
 * rotation value to zero when approaching the horizontal.
 *
 * @constructor
 * @implements {ol.IView2D}
 * @implements {ol.IView3D}
 * @extends {ol.View}
 * @param {olx.View2DOptions=} opt_options View2D options.
 * @todo observable center {ol.Coordinate} the center of the view
 * @todo observable projection {ol.proj.Projection} the projection of the view
 * @todo observable resolution {number} the resolution of the view
 * @todo observable rotation {number} the rotation of the view
 * @todo api
 */
ol.View2D = function(opt_options) {
  goog.base(this);
  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @type {Object.<string, *>}
   */
  var values = {};
  values[ol.View2DProperty.CENTER] = goog.isDef(options.center) ?
      options.center : null;
  values[ol.View2DProperty.PROJECTION] = ol.proj.createProjection(
      options.projection, 'EPSG:3857');

  var resolutionConstraintInfo = ol.View2D.createResolutionConstraint_(
      options);

  /**
   * @private
   * @type {number}
   */
  this.maxResolution_ = resolutionConstraintInfo.maxResolution;

  /**
   * @private
   * @type {number}
   */
  this.minResolution_ = resolutionConstraintInfo.minResolution;

  var centerConstraint = ol.View2D.createCenterConstraint_(options);
  var resolutionConstraint = resolutionConstraintInfo.constraint;
  var rotationConstraint = ol.View2D.createRotationConstraint_(options);

  /**
   * @private
   * @type {ol.Constraints}
   */
  this.constraints_ = new ol.Constraints(
      centerConstraint, resolutionConstraint, rotationConstraint);

  if (goog.isDef(options.resolution)) {
    values[ol.View2DProperty.RESOLUTION] = options.resolution;
  } else if (goog.isDef(options.zoom)) {
    values[ol.View2DProperty.RESOLUTION] = this.constrainResolution(
        this.maxResolution_, options.zoom);
  }
  values[ol.View2DProperty.ROTATION] =
      goog.isDef(options.rotation) ? options.rotation : 0;
  this.setValues(values);
};
goog.inherits(ol.View2D, ol.View);


/**
 * @param {number} rotation Target rotation.
 * @param {ol.Coordinate} anchor Rotation anchor.
 * @return {ol.Coordinate|undefined} Center for rotation and anchor.
 */
ol.View2D.prototype.calculateCenterRotate = function(rotation, anchor) {
  var center;
  var currentCenter = this.getCenter();
  if (goog.isDef(currentCenter)) {
    center = [currentCenter[0] - anchor[0], currentCenter[1] - anchor[1]];
    ol.coordinate.rotate(center, rotation - this.getRotation());
    ol.coordinate.add(center, anchor);
  }
  return center;
};


/**
 * @param {number} resolution Target resolution.
 * @param {ol.Coordinate} anchor Zoom anchor.
 * @return {ol.Coordinate|undefined} Center for resolution and anchor.
 */
ol.View2D.prototype.calculateCenterZoom = function(resolution, anchor) {
  var center;
  var currentCenter = this.getCenter();
  var currentResolution = this.getResolution();
  if (goog.isDef(currentCenter) && goog.isDef(currentResolution)) {
    var x = anchor[0] -
        resolution * (anchor[0] - currentCenter[0]) / currentResolution;
    var y = anchor[1] -
        resolution * (anchor[1] - currentCenter[1]) / currentResolution;
    center = [x, y];
  }
  return center;
};


/**
 * @param {ol.Coordinate|undefined} center Center.
 * @return {ol.Coordinate|undefined} Constrained center.
 */
ol.View2D.prototype.constrainCenter = function(center) {
  return this.constraints_.center(center);
};


/**
 * Get the constrained the resolution of this view.
 * @param {number|undefined} resolution Resolution.
 * @param {number=} opt_delta Delta. Default is `0`.
 * @param {number=} opt_direction Direction. Default is `0`.
 * @return {number|undefined} Constrained resolution.
 * @todo api
 */
ol.View2D.prototype.constrainResolution = function(
    resolution, opt_delta, opt_direction) {
  var delta = opt_delta || 0;
  var direction = opt_direction || 0;
  return this.constraints_.resolution(resolution, delta, direction);
};


/**
 * Get the constrained rotation of this view.
 * @param {number|undefined} rotation Rotation.
 * @param {number=} opt_delta Delta. Default is `0`.
 * @return {number|undefined} Constrained rotation.
 * @todo api
 */
ol.View2D.prototype.constrainRotation = function(rotation, opt_delta) {
  var delta = opt_delta || 0;
  return this.constraints_.rotation(rotation, delta);
};


/**
 * @inheritDoc
 * @todo api
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
 * Calculate the extent for the given size in pixels, based on the current
 * resolution and the current center.
 * @param {ol.Size} size Box pixel size.
 * @return {ol.Extent} Extent.
 * @todo api
 */
ol.View2D.prototype.calculateExtent = function(size) {
  goog.asserts.assert(this.isDef());
  var center = this.getCenter();
  var resolution = this.getResolution();
  var minX = center[0] - resolution * size[0] / 2;
  var maxX = center[0] + resolution * size[0] / 2;
  var minY = center[1] - resolution * size[1] / 2;
  var maxY = center[1] + resolution * size[1] / 2;
  return [minX, minY, maxX, maxY];
};


/**
 * @inheritDoc
 * @todo api
 */
ol.View2D.prototype.getProjection = function() {
  return /** @type {ol.proj.Projection|undefined} */ (
      this.get(ol.View2DProperty.PROJECTION));
};
goog.exportProperty(
    ol.View2D.prototype,
    'getProjection',
    ol.View2D.prototype.getProjection);


/**
 * @inheritDoc
 * @todo api
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
  var xResolution = ol.extent.getWidth(extent) / size[0];
  var yResolution = ol.extent.getHeight(extent) / size[1];
  return Math.max(xResolution, yResolution);
};


/**
 * Return a function that returns a value between 0 and 1 for a
 * resolution. Exponential scaling is assumed.
 * @param {number=} opt_power Power.
 * @return {function(number): number} Resolution for value function.
 */
ol.View2D.prototype.getResolutionForValueFunction = function(opt_power) {
  var power = opt_power || 2;
  var maxResolution = this.maxResolution_;
  var minResolution = this.minResolution_;
  var max = Math.log(maxResolution / minResolution) / Math.log(power);
  return (
      /**
       * @param {number} value Value.
       * @return {number} Resolution.
       */
      function(value) {
        var resolution = maxResolution / Math.pow(power, value * max);
        goog.asserts.assert(resolution >= minResolution &&
            resolution <= maxResolution);
        return resolution;
      });
};


/**
 * @inheritDoc
 * @todo api
 */
ol.View2D.prototype.getRotation = function() {
  return /** @type {number|undefined} */ (this.get(ol.View2DProperty.ROTATION));
};
goog.exportProperty(
    ol.View2D.prototype,
    'getRotation',
    ol.View2D.prototype.getRotation);


/**
 * Return a function that returns a resolution for a value between
 * 0 and 1. Exponential scaling is assumed.
 * @param {number=} opt_power Power.
 * @return {function(number): number} Value for resolution function.
 */
ol.View2D.prototype.getValueForResolutionFunction = function(opt_power) {
  var power = opt_power || 2;
  var maxResolution = this.maxResolution_;
  var minResolution = this.minResolution_;
  var max = Math.log(maxResolution / minResolution) / Math.log(power);
  return (
      /**
       * @param {number} resolution Resolution.
       * @return {number} Value.
       */
      function(resolution) {
        var value =
            (Math.log(maxResolution / resolution) / Math.log(power)) / max;
        goog.asserts.assert(value >= 0 && value <= 1);
        return value;
      });
};


/**
 * @inheritDoc
 * @todo api
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
  var projection = this.getProjection();
  var resolution = /** @type {number} */ (this.getResolution());
  var rotation = this.getRotation();
  return /** @type {oli.View2DState} */ ({
    center: center.slice(),
    projection: goog.isDef(projection) ? projection : null,
    resolution: resolution,
    rotation: goog.isDef(rotation) ? rotation : 0
  });
};


/**
 * FIXME return type
 */
ol.View2D.prototype.getView3D = function() {
};


/**
 * Get the current zoom level. Return undefined if the current
 * resolution is undefined or not a "constrained resolution".
 * @return {number|undefined} Zoom.
 * @todo api
 */
ol.View2D.prototype.getZoom = function() {
  var zoom;
  var resolution = this.getResolution();

  if (goog.isDef(resolution)) {
    var res, z = 0;
    do {
      res = this.constrainResolution(this.maxResolution_, z);
      if (res == resolution) {
        zoom = z;
        break;
      }
      ++z;
    } while (res > this.minResolution_);
  }

  return zoom;
};


/**
 * Fit the given extent based on the given map size.
 * @param {ol.Extent} extent Extent.
 * @param {ol.Size} size Box pixel size.
 * @todo api
 */
ol.View2D.prototype.fitExtent = function(extent, size) {
  if (!ol.extent.isEmpty(extent)) {
    this.setCenter(ol.extent.getCenter(extent));
    var resolution = this.getResolutionForExtent(extent, size);
    var constrainedResolution = this.constrainResolution(resolution, 0, 0);
    if (constrainedResolution < resolution) {
      constrainedResolution =
          this.constrainResolution(constrainedResolution, -1, 0);
    }
    this.setResolution(constrainedResolution);
  }
};


/**
 * Fit the given geometry based on the given map size and border.
 * Take care on the map angle.
 * @param {ol.geom.SimpleGeometry} geometry Geometry.
 * @param {ol.Size} size Box pixel size.
 * @param {olx.View2D.fitGeometryOptions=} opt_options Options.
 * @todo api
 */
ol.View2D.prototype.fitGeometry = function(geometry, size, opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};

  var padding = goog.isDef(options.padding) ? options.padding : [0, 0, 0, 0];
  var constrainResolution = goog.isDef(options.constrainResolution) ?
      options.constrainResolution : true;
  var nearest = goog.isDef(options.nearest) ? options.nearest : false;
  var minResolution = goog.isDef(options.minResolution) ?
      options.minResolution : 0;
  var coords = geometry.getFlatCoordinates();

  // calculate rotated extent
  var rotation = this.getRotation();
  goog.asserts.assert(goog.isDef(rotation));
  var cosAngle = Math.cos(-rotation);
  var sinAngle = Math.sin(-rotation);
  var minRotX = +Infinity;
  var minRotY = +Infinity;
  var maxRotX = -Infinity;
  var maxRotY = -Infinity;
  var stride = geometry.getStride();
  for (var i = 0, ii = coords.length; i < ii; i += stride) {
    var rotX = coords[i] * cosAngle - coords[i + 1] * sinAngle;
    var rotY = coords[i] * sinAngle + coords[i + 1] * cosAngle;
    minRotX = Math.min(minRotX, rotX);
    minRotY = Math.min(minRotY, rotY);
    maxRotX = Math.max(maxRotX, rotX);
    maxRotY = Math.max(maxRotY, rotY);
  }

  // calculate resolution
  var resolution = this.getResolutionForExtent(
      [minRotX, minRotY, maxRotX, maxRotY],
      [size[0] - padding[1] - padding[3], size[1] - padding[0] - padding[2]]);
  resolution = isNaN(resolution) ? minResolution :
      Math.max(resolution, minResolution);
  if (constrainResolution) {
    var constrainedResolution = this.constrainResolution(resolution, 0, 0);
    if (!nearest && constrainedResolution < resolution) {
      constrainedResolution = this.constrainResolution(
          constrainedResolution, -1, 0);
    }
    resolution = constrainedResolution;
  }
  this.setResolution(resolution);

  // calculate center
  sinAngle = -sinAngle; // go back to original rotation
  var centerRotX = (minRotX + maxRotX) / 2;
  var centerRotY = (minRotY + maxRotY) / 2;
  centerRotX += (padding[1] - padding[3]) / 2 * resolution;
  centerRotY += (padding[0] - padding[2]) / 2 * resolution;
  var centerX = centerRotX * cosAngle - centerRotY * sinAngle;
  var centerY = centerRotY * cosAngle + centerRotX * sinAngle;

  this.setCenter([centerX, centerY]);
};


/**
 * Center on coordinate and view position.
 * Take care on the map angle.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {ol.Size} size Box pixel size.
 * @param {ol.Pixel} position Position on the view to center on.
 * @todo api
 */
ol.View2D.prototype.centerOn = function(coordinate, size, position) {
  // calculate rotated position
  var rotation = this.getRotation();
  var cosAngle = Math.cos(-rotation);
  var sinAngle = Math.sin(-rotation);
  var rotX = coordinate[0] * cosAngle - coordinate[1] * sinAngle;
  var rotY = coordinate[1] * cosAngle + coordinate[0] * sinAngle;
  var resolution = this.getResolution();
  rotX += (size[0] / 2 - position[0]) * resolution;
  rotY += (position[1] - size[1] / 2) * resolution;

  // go back to original angle
  sinAngle = -sinAngle; // go back to original rotation
  var centerX = rotX * cosAngle - rotY * sinAngle;
  var centerY = rotY * cosAngle + rotX * sinAngle;

  this.setCenter([centerX, centerY]);
};


/**
 * @return {boolean} Is defined.
 */
ol.View2D.prototype.isDef = function() {
  return goog.isDefAndNotNull(this.getCenter()) &&
      goog.isDef(this.getResolution());
};


/**
 * Rotate the view around a given coordinate.
 * @param {number} rotation New rotation value for the view.
 * @param {ol.Coordinate=} opt_anchor The rotation center.
 * @todo api
 */
ol.View2D.prototype.rotate = function(rotation, opt_anchor) {
  if (goog.isDef(opt_anchor)) {
    var center = this.calculateCenterRotate(rotation, opt_anchor);
    this.setCenter(center);
  }
  this.setRotation(rotation);
};


/**
 * Set the center of the current view.
 * @param {ol.Coordinate|undefined} center Center.
 * @todo api
 */
ol.View2D.prototype.setCenter = function(center) {
  this.set(ol.View2DProperty.CENTER, center);
};
goog.exportProperty(
    ol.View2D.prototype,
    'setCenter',
    ol.View2D.prototype.setCenter);


/**
 * Set the projection of this view.
 * Warning! This code is not yet implemented. Function should not be used.
 * @param {ol.proj.Projection|undefined} projection Projection.
 * @todo api
 */
ol.View2D.prototype.setProjection = function(projection) {
  this.set(ol.View2DProperty.PROJECTION, projection);
};
goog.exportProperty(
    ol.View2D.prototype,
    'setProjection',
    ol.View2D.prototype.setProjection);


/**
 * Set the resolution for this view.
 * @param {number|undefined} resolution Resolution.
 * @todo api
 */
ol.View2D.prototype.setResolution = function(resolution) {
  this.set(ol.View2DProperty.RESOLUTION, resolution);
};
goog.exportProperty(
    ol.View2D.prototype,
    'setResolution',
    ol.View2D.prototype.setResolution);


/**
 * Set the rotation for this view.
 * @param {number|undefined} rotation Rotation.
 * @todo api
 */
ol.View2D.prototype.setRotation = function(rotation) {
  this.set(ol.View2DProperty.ROTATION, rotation);
};
goog.exportProperty(
    ol.View2D.prototype,
    'setRotation',
    ol.View2D.prototype.setRotation);


/**
 * Zoom to a specific zoom level.
 * @param {number} zoom Zoom level.
 * @todo api
 */
ol.View2D.prototype.setZoom = function(zoom) {
  var resolution = this.constrainResolution(this.maxResolution_, zoom, 0);
  this.setResolution(resolution);
};


/**
 * @param {olx.View2DOptions} options View2D options.
 * @private
 * @return {ol.CenterConstraintType}
 */
ol.View2D.createCenterConstraint_ = function(options) {
  if (goog.isDef(options.extent)) {
    return ol.CenterConstraint.createExtent(options.extent);
  } else {
    return ol.CenterConstraint.none;
  }
};


/**
 * @private
 * @param {olx.View2DOptions} options View2D options.
 * @return {{constraint: ol.ResolutionConstraintType, maxResolution: number,
 *     minResolution: number}}
 */
ol.View2D.createResolutionConstraint_ = function(options) {
  var resolutionConstraint;
  var maxResolution;
  var minResolution;
  if (goog.isDef(options.resolutions)) {
    var resolutions = options.resolutions;
    maxResolution = resolutions[0];
    minResolution = resolutions[resolutions.length - 1];
    resolutionConstraint = ol.ResolutionConstraint.createSnapToResolutions(
        resolutions);
  } else {
    maxResolution = options.maxResolution;
    if (!goog.isDef(maxResolution)) {
      var projection = options.projection;
      var projectionExtent = ol.proj.createProjection(projection, 'EPSG:3857')
          .getExtent();
      var size = goog.isNull(projectionExtent) ?
          // use an extent that can fit the whole world if need be
          360 * ol.proj.METERS_PER_UNIT[ol.proj.Units.DEGREES] /
              ol.proj.METERS_PER_UNIT[projection.getUnits()] :
          Math.max(projectionExtent[2] - projectionExtent[0],
              projectionExtent[3] - projectionExtent[1]);
      maxResolution = size / ol.DEFAULT_TILE_SIZE;
    }
    var maxZoom = options.maxZoom;
    if (!goog.isDef(maxZoom)) {
      maxZoom = 28;
    }
    var zoomFactor = options.zoomFactor;
    if (!goog.isDef(zoomFactor)) {
      zoomFactor = 2;
    }
    minResolution = maxResolution / Math.pow(zoomFactor, maxZoom);
    resolutionConstraint = ol.ResolutionConstraint.createSnapToPower(
        zoomFactor, maxResolution, maxZoom);
  }
  return {constraint: resolutionConstraint, maxResolution: maxResolution,
    minResolution: minResolution};
};


/**
 * @private
 * @param {olx.View2DOptions} options View2D options.
 * @return {ol.RotationConstraintType} Rotation constraint.
 */
ol.View2D.createRotationConstraint_ = function(options) {
  var enableRotation = goog.isDef(options.enableRotation) ?
      options.enableRotation : true;
  if (enableRotation) {
    var constrainRotation = options.constrainRotation;
    if (!goog.isDef(constrainRotation) || constrainRotation === true) {
      return ol.RotationConstraint.createSnapToZero();
    } else if (constrainRotation === false) {
      return ol.RotationConstraint.none;
    } else if (goog.isNumber(constrainRotation)) {
      return ol.RotationConstraint.createSnapToN(constrainRotation);
    } else {
      goog.asserts.fail();
      return ol.RotationConstraint.none;
    }
  } else {
    return ol.RotationConstraint.disable;
  }
};
