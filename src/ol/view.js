goog.provide('ol.View');
goog.provide('ol.ViewHint');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('ol');
goog.require('ol.CenterConstraint');
goog.require('ol.Constraints');
goog.require('ol.Object');
goog.require('ol.ResolutionConstraint');
goog.require('ol.RotationConstraint');
goog.require('ol.RotationConstraintType');
goog.require('ol.Size');
goog.require('ol.coordinate');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.proj.METERS_PER_UNIT');
goog.require('ol.proj.Projection');
goog.require('ol.proj.Units');


/**
 * @enum {string}
 */
ol.ViewProperty = {
  CENTER: 'center',
  RESOLUTION: 'resolution',
  ROTATION: 'rotation'
};


/**
 * @enum {number}
 */
ol.ViewHint = {
  ANIMATING: 0,
  INTERACTING: 1
};



/**
 * @classdesc
 * An ol.View object represents a simple 2D view of the map.
 *
 * This is the object to act upon to change the center, resolution,
 * and rotation of the map.
 *
 * ### The view states
 *
 * An `ol.View` is determined by three states: `center`, `resolution`,
 * and `rotation`. Each state has a corresponding getter and setter, e.g.
 * `getCenter` and `setCenter` for the `center` state.
 *
 * An `ol.View` has a `projection`. The projection determines the
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
 * But an `ol.View` object also has a *resolution constraint*, a
 * *rotation constraint* and a *center constraint*.
 *
 * As said above, no constraints are applied when the setters are used to set
 * new states for the view. Applying constraints is done explicitly through
 * the use of the `constrain*` functions (`constrainResolution` and
 * `constrainRotation` and `constrainCenter`).
 *
 * The main users of the constraints are the interactions and the
 * controls. For example, double-clicking on the map changes the view to
 * the "next" resolution. And releasing the fingers after pinch-zooming
 * snaps to the closest resolution (with an animation).
 *
 * The *resolution constraint* snaps to specific resolutions. It is
 * determined by the following options: `resolutions`, `maxResolution`,
 * `maxZoom`, and `zoomFactor`. If `resolutions` is set, the other three
 * options are ignored. See documentation for each option for more
 * information.
 *
 * The *rotation constraint* snaps to specific angles. It is determined
 * by the following options: `enableRotation` and `constrainRotation`.
 * By default the rotation value is snapped to zero when approaching the
 * horizontal.
 *
 * The *center constraint* is determined by the `extent` option. By
 * default the center is not constrained at all.
 *
 * @constructor
 * @extends {ol.Object}
 * @param {olx.ViewOptions=} opt_options View options.
 * @api stable
 */
ol.View = function(opt_options) {
  goog.base(this);
  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {Array.<number>}
   */
  this.hints_ = [0, 0];

  /**
   * @type {Object.<string, *>}
   */
  var properties = {};
  properties[ol.ViewProperty.CENTER] = goog.isDef(options.center) ?
      options.center : null;

  /**
   * @private
   * @type {ol.proj.Projection}
   */
  this.projection_ = ol.proj.createProjection(options.projection, 'EPSG:3857');

  var resolutionConstraintInfo = ol.View.createResolutionConstraint_(
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

  /**
   * @private
   * @type {number}
   */
  this.minZoom_ = resolutionConstraintInfo.minZoom;

  var centerConstraint = ol.View.createCenterConstraint_(options);
  var resolutionConstraint = resolutionConstraintInfo.constraint;
  var rotationConstraint = ol.View.createRotationConstraint_(options);

  /**
   * @private
   * @type {ol.Constraints}
   */
  this.constraints_ = new ol.Constraints(
      centerConstraint, resolutionConstraint, rotationConstraint);

  if (goog.isDef(options.resolution)) {
    properties[ol.ViewProperty.RESOLUTION] = options.resolution;
  } else if (goog.isDef(options.zoom)) {
    properties[ol.ViewProperty.RESOLUTION] = this.constrainResolution(
        this.maxResolution_, options.zoom - this.minZoom_);
  }
  properties[ol.ViewProperty.ROTATION] =
      goog.isDef(options.rotation) ? options.rotation : 0;
  this.setProperties(properties);
};
goog.inherits(ol.View, ol.Object);


/**
 * @param {number} rotation Target rotation.
 * @param {ol.Coordinate} anchor Rotation anchor.
 * @return {ol.Coordinate|undefined} Center for rotation and anchor.
 */
ol.View.prototype.calculateCenterRotate = function(rotation, anchor) {
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
ol.View.prototype.calculateCenterZoom = function(resolution, anchor) {
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
 * Get the constrained center of this view.
 * @param {ol.Coordinate|undefined} center Center.
 * @return {ol.Coordinate|undefined} Constrained center.
 * @api
 */
ol.View.prototype.constrainCenter = function(center) {
  return this.constraints_.center(center);
};


/**
 * Get the constrained resolution of this view.
 * @param {number|undefined} resolution Resolution.
 * @param {number=} opt_delta Delta. Default is `0`.
 * @param {number=} opt_direction Direction. Default is `0`.
 * @return {number|undefined} Constrained resolution.
 * @api
 */
ol.View.prototype.constrainResolution = function(
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
 * @api
 */
ol.View.prototype.constrainRotation = function(rotation, opt_delta) {
  var delta = opt_delta || 0;
  return this.constraints_.rotation(rotation, delta);
};


/**
 * @return {ol.Coordinate|undefined} The center of the view.
 * @observable
 * @api stable
 */
ol.View.prototype.getCenter = function() {
  return /** @type {ol.Coordinate|undefined} */ (
      this.get(ol.ViewProperty.CENTER));
};
goog.exportProperty(
    ol.View.prototype,
    'getCenter',
    ol.View.prototype.getCenter);


/**
 * @return {Array.<number>} Hint.
 */
ol.View.prototype.getHints = function() {
  return this.hints_.slice();
};


/**
 * Calculate the extent for the current view state and the passed `size`.
 * `size` is the size in pixels of the box into which the calculated extent
 * should fit. In most cases you want to get the extent of the entire map,
 * that is `map.getSize()`.
 * @param {ol.Size} size Box pixel size.
 * @return {ol.Extent} Extent.
 * @api
 */
ol.View.prototype.calculateExtent = function(size) {
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
 * @return {ol.proj.Projection} The projection of the view.
 * @api stable
 */
ol.View.prototype.getProjection = function() {
  return this.projection_;
};


/**
 * @return {number|undefined} The resolution of the view.
 * @observable
 * @api stable
 */
ol.View.prototype.getResolution = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.ViewProperty.RESOLUTION));
};
goog.exportProperty(
    ol.View.prototype,
    'getResolution',
    ol.View.prototype.getResolution);


/**
 * Get the resolution for a provided extent (in map units) and size (in pixels).
 * @param {ol.Extent} extent Extent.
 * @param {ol.Size} size Box pixel size.
 * @return {number} The resolution at which the provided extent will render at
 *     the given size.
 * @api
 */
ol.View.prototype.getResolutionForExtent = function(extent, size) {
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
ol.View.prototype.getResolutionForValueFunction = function(opt_power) {
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
 * @return {number|undefined} The rotation of the view.
 * @observable
 * @api stable
 */
ol.View.prototype.getRotation = function() {
  return /** @type {number|undefined} */ (this.get(ol.ViewProperty.ROTATION));
};
goog.exportProperty(
    ol.View.prototype,
    'getRotation',
    ol.View.prototype.getRotation);


/**
 * Return a function that returns a resolution for a value between
 * 0 and 1. Exponential scaling is assumed.
 * @param {number=} opt_power Power.
 * @return {function(number): number} Value for resolution function.
 */
ol.View.prototype.getValueForResolutionFunction = function(opt_power) {
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
 * @return {olx.ViewState} View state.
 */
ol.View.prototype.getState = function() {
  goog.asserts.assert(this.isDef());
  var center = /** @type {ol.Coordinate} */ (this.getCenter());
  var projection = this.getProjection();
  var resolution = /** @type {number} */ (this.getResolution());
  var rotation = this.getRotation();
  return /** @type {olx.ViewState} */ ({
    center: center.slice(),
    projection: goog.isDef(projection) ? projection : null,
    resolution: resolution,
    rotation: goog.isDef(rotation) ? rotation : 0
  });
};


/**
 * Get the current zoom level. Return undefined if the current
 * resolution is undefined or not a "constrained resolution".
 * @return {number|undefined} Zoom.
 * @api stable
 */
ol.View.prototype.getZoom = function() {
  var offset;
  var resolution = this.getResolution();

  if (goog.isDef(resolution)) {
    var res, z = 0;
    do {
      res = this.constrainResolution(this.maxResolution_, z);
      if (res == resolution) {
        offset = z;
        break;
      }
      ++z;
    } while (res > this.minResolution_);
  }

  return goog.isDef(offset) ? this.minZoom_ + offset : offset;
};


/**
 * Fit the map view to the passed `extent` and `size`. `size` is the size in
 * pixels of the box to fit the extent into. In most cases you will want to
 * use the map size, that is `map.getSize()`.
 * @param {ol.Extent} extent Extent.
 * @param {ol.Size} size Box pixel size.
 * @api
 */
ol.View.prototype.fitExtent = function(extent, size) {
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
 * @param {olx.view.FitGeometryOptions=} opt_options Options.
 * @api
 */
ol.View.prototype.fitGeometry = function(geometry, size, opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};

  var padding = goog.isDef(options.padding) ? options.padding : [0, 0, 0, 0];
  var constrainResolution = goog.isDef(options.constrainResolution) ?
      options.constrainResolution : true;
  var nearest = goog.isDef(options.nearest) ? options.nearest : false;
  var minResolution;
  if (goog.isDef(options.minResolution)) {
    minResolution = options.minResolution;
  } else if (goog.isDef(options.maxZoom)) {
    minResolution = this.constrainResolution(
        this.maxResolution_, options.maxZoom - this.minZoom_, 0);
  } else {
    minResolution = 0;
  }
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
 * @api
 */
ol.View.prototype.centerOn = function(coordinate, size, position) {
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
ol.View.prototype.isDef = function() {
  return goog.isDefAndNotNull(this.getCenter()) &&
      goog.isDef(this.getResolution());
};


/**
 * Rotate the view around a given coordinate.
 * @param {number} rotation New rotation value for the view.
 * @param {ol.Coordinate=} opt_anchor The rotation center.
 * @api stable
 */
ol.View.prototype.rotate = function(rotation, opt_anchor) {
  if (goog.isDef(opt_anchor)) {
    var center = this.calculateCenterRotate(rotation, opt_anchor);
    this.setCenter(center);
  }
  this.setRotation(rotation);
};


/**
 * Set the center of the current view.
 * @param {ol.Coordinate|undefined} center The center of the view.
 * @observable
 * @api stable
 */
ol.View.prototype.setCenter = function(center) {
  this.set(ol.ViewProperty.CENTER, center);
};
goog.exportProperty(
    ol.View.prototype,
    'setCenter',
    ol.View.prototype.setCenter);


/**
 * @param {ol.ViewHint} hint Hint.
 * @param {number} delta Delta.
 * @return {number} New value.
 */
ol.View.prototype.setHint = function(hint, delta) {
  goog.asserts.assert(0 <= hint && hint < this.hints_.length);
  this.hints_[hint] += delta;
  goog.asserts.assert(this.hints_[hint] >= 0);
  return this.hints_[hint];
};


/**
 * Set the resolution for this view.
 * @param {number|undefined} resolution The resolution of the view.
 * @observable
 * @api stable
 */
ol.View.prototype.setResolution = function(resolution) {
  this.set(ol.ViewProperty.RESOLUTION, resolution);
};
goog.exportProperty(
    ol.View.prototype,
    'setResolution',
    ol.View.prototype.setResolution);


/**
 * Set the rotation for this view.
 * @param {number|undefined} rotation The rotation of the view.
 * @observable
 * @api stable
 */
ol.View.prototype.setRotation = function(rotation) {
  this.set(ol.ViewProperty.ROTATION, rotation);
};
goog.exportProperty(
    ol.View.prototype,
    'setRotation',
    ol.View.prototype.setRotation);


/**
 * Zoom to a specific zoom level.
 * @param {number} zoom Zoom level.
 * @api stable
 */
ol.View.prototype.setZoom = function(zoom) {
  var resolution = this.constrainResolution(
      this.maxResolution_, zoom - this.minZoom_, 0);
  this.setResolution(resolution);
};


/**
 * @param {olx.ViewOptions} options View options.
 * @private
 * @return {ol.CenterConstraintType}
 */
ol.View.createCenterConstraint_ = function(options) {
  if (goog.isDef(options.extent)) {
    return ol.CenterConstraint.createExtent(options.extent);
  } else {
    return ol.CenterConstraint.none;
  }
};


/**
 * @private
 * @param {olx.ViewOptions} options View options.
 * @return {{constraint: ol.ResolutionConstraintType, maxResolution: number,
 *     minResolution: number}}
 */
ol.View.createResolutionConstraint_ = function(options) {
  var resolutionConstraint;
  var maxResolution;
  var minResolution;

  // TODO: move these to be ol constants
  // see https://github.com/openlayers/ol3/issues/2076
  var defaultMaxZoom = 28;
  var defaultZoomFactor = 2;

  var minZoom = goog.isDef(options.minZoom) ?
      options.minZoom : ol.DEFAULT_MIN_ZOOM;

  var maxZoom = goog.isDef(options.maxZoom) ?
      options.maxZoom : defaultMaxZoom;

  var zoomFactor = goog.isDef(options.zoomFactor) ?
      options.zoomFactor : defaultZoomFactor;

  if (goog.isDef(options.resolutions)) {
    var resolutions = options.resolutions;
    maxResolution = resolutions[0];
    minResolution = resolutions[resolutions.length - 1];
    resolutionConstraint = ol.ResolutionConstraint.createSnapToResolutions(
        resolutions);
  } else {
    // calculate the default min and max resolution
    var projection = ol.proj.createProjection(options.projection, 'EPSG:3857');
    var extent = projection.getExtent();
    var size = goog.isNull(extent) ?
        // use an extent that can fit the whole world if need be
        360 * ol.proj.METERS_PER_UNIT[ol.proj.Units.DEGREES] /
            ol.proj.METERS_PER_UNIT[projection.getUnits()] :
        Math.max(ol.extent.getWidth(extent), ol.extent.getHeight(extent));

    var defaultMaxResolution = size / ol.DEFAULT_TILE_SIZE / Math.pow(
        defaultZoomFactor, ol.DEFAULT_MIN_ZOOM);

    var defaultMinResolution = defaultMaxResolution / Math.pow(
        defaultZoomFactor, defaultMaxZoom - ol.DEFAULT_MIN_ZOOM);

    // user provided maxResolution takes precedence
    maxResolution = options.maxResolution;
    if (goog.isDef(maxResolution)) {
      minZoom = 0;
    } else {
      maxResolution = defaultMaxResolution / Math.pow(zoomFactor, minZoom);
    }

    // user provided minResolution takes precedence
    minResolution = options.minResolution;
    if (!goog.isDef(minResolution)) {
      if (goog.isDef(options.maxZoom)) {
        if (goog.isDef(options.maxResolution)) {
          minResolution = maxResolution / Math.pow(zoomFactor, maxZoom);
        } else {
          minResolution = defaultMaxResolution / Math.pow(zoomFactor, maxZoom);
        }
      } else {
        minResolution = defaultMinResolution;
      }
    }

    // given discrete zoom levels, minResolution may be different than provided
    maxZoom = minZoom + Math.floor(
        Math.log(maxResolution / minResolution) / Math.log(zoomFactor));
    minResolution = maxResolution / Math.pow(zoomFactor, maxZoom - minZoom);

    resolutionConstraint = ol.ResolutionConstraint.createSnapToPower(
        zoomFactor, maxResolution, maxZoom - minZoom);
  }
  return {constraint: resolutionConstraint, maxResolution: maxResolution,
    minResolution: minResolution, minZoom: minZoom};
};


/**
 * @private
 * @param {olx.ViewOptions} options View options.
 * @return {ol.RotationConstraintType} Rotation constraint.
 */
ol.View.createRotationConstraint_ = function(options) {
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
