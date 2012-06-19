goog.provide('ol.loc');

goog.require('ol.Loc');


/**
 * @typedef {ol.Loc|Array.<number>|Object} loc Location.
 */
ol.LocLike;



/**
 * @export
 * @param {ol.LocLike} loc Location.
 * @return {ol.Loc} Location.
 */
ol.loc = function(loc) {

  if (loc instanceof ol.Loc) {
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

  return new ol.Loc(x, y, z, projection);

};


/**
 * @export
 * @param {ol.Projection=} opt_arg Projection.
 * @return {ol.Loc|ol.Projection|undefined} Result.
 */
ol.Loc.prototype.projection = function(opt_arg) {
  if (arguments.length == 1 && goog.isDef(opt_arg)) {
    return this.setProjection(opt_arg);
  } else {
    return this.getProjection();
  }
};


/**
 * @export
 * @param {number=} opt_arg X.
 * @return {ol.Loc|number} Result.
 */
ol.Loc.prototype.x = function(opt_arg) {
  if (arguments.length == 1 && goog.isDef(opt_arg)) {
    return this.setX(opt_arg);
  } else {
    return this.getX();
  }
};


/**
 * @export
 * @param {number=} opt_arg Y.
 * @return {ol.Loc|number} Result.
 */
ol.Loc.prototype.y = function(opt_arg) {
  if (arguments.length == 1 && goog.isDef(opt_arg)) {
    return this.setY(opt_arg);
  } else {
    return this.getY();
  }
};


/**
 * @export
 * @param {number=} opt_arg Z.
 * @return {ol.Loc|number|undefined} Result.
 */
ol.Loc.prototype.z = function(opt_arg) {
  if (arguments.length == 1 && goog.isDef(opt_arg)) {
    return this.setZ(opt_arg);
  } else {
    return this.getZ();
  }
};
