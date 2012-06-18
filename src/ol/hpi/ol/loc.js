goog.provide('ol.loc');

goog.require('ol.Location');


/**
 * @typedef {ol.Location|Array.<number>|{{x:number, y:number, z:number=, projection: ol.Projection=}}} loc Location.
 */
ol.LocationLike;



/**
 * @export
 * @param {ol.LocationLike} loc Location.
 * @return {ol.Location} Location.
 */
ol.loc = function(loc) {

  if (loc instanceof ol.Location) {
    return loc;
  }

  var x = 0;
  var y = 0;
  var z;
  var projection;

  if (goog.isArray(loc)) {
    if (loc.length >= 1) {
      x = loc[0];
      if (loc.length >= 2) {
        y = loc[1];
        if (loc.length >= 3) {
          z = loc[2];
        }
      }
    }
  } else if (goog.isObject(loc)) {
    if (goog.isDef(loc.x)) {
      x = loc.x;
    }
    if (goog.isDef(loc.y)) {
      y = loc.y;
    }
    if (goog.isDef(loc.z)) {
      z = loc.z;
    }
    if (goog.isDef(loc.projection)) {
      projection = loc.projection;
    }
  } else {
    throw new Error('ol.loc');
  }

  return new ol.Location(x, y, z, projection);

};


/**
 * @export
 * @param {ol.Projection=} opt_arg Projection.
 * @return {ol.Location|ol.Projection} Result.
 */
ol.Location.prototype.projection = function(opt_arg) {
  if (arguments.length == 1) {
    return this.setProjection(opt_arg);
  } else {
    return this.getProjection();
  }
};


/**
 * @export
 * @param {number=} opt_arg X.
 * @return {ol.Location|number} Result.
 */
ol.Location.prototype.x = function(opt_arg) {
  if (arguments.length == 1) {
    return this.setX(opt_arg);
  } else {
    return this.getX();
  }
};


/**
 * @export
 * @param {number=} opt_arg Y.
 * @return {ol.Location|number} Result.
 */
ol.Location.prototype.y = function(opt_arg) {
  if (arguments.length == 1) {
    return this.setY(opt_arg);
  } else {
    return this.getY();
  }
};


/**
 * @export
 * @param {number=} opt_arg Z.
 * @return {ol.Location|number} Result.
 */
ol.Location.prototype.z = function(opt_arg) {
  if (arguments.length == 1) {
    return this.setZ(opt_arg);
  } else {
    return this.getZ();
  }
};
