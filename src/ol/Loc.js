goog.provide('ol.Loc');

goog.require('ol.Projection');



/**
 * @constructor
 * @param {number} x X.
 * @param {number} y Y.
 * @param {number=} opt_z Z.
 * @param {ol.Projection=} opt_projection Projection.
 */
ol.Loc = function(x, y, opt_z, opt_projection) {

  /**
   * @private
   * @type {number}
   */
  this.x_ = x;

  /**
   * @private
   * @type {number}
   */
  this.y_ = y;

  /**
   * @private
   * @type {number|undefined}
   */
  this.z_ = opt_z;

  /**
   * @private
   * @type {ol.Projection|undefined}
   */
  this.projection_ = opt_projection;

};


/**
 * @return {ol.Projection|undefined} Projection.
 */
ol.Loc.prototype.getProjection = function() {
  return this.projection_;
};


/**
 * @return {number} X.
 */
ol.Loc.prototype.getX = function() {
  return this.x_;
};


/**
 * @return {number} Y.
 */
ol.Loc.prototype.getY = function() {
  return this.y_;
};


/**
 * @return {number|undefined} Z.
 */
ol.Loc.prototype.getZ = function() {
  return this.z_;
};


/**
 * @param {ol.Projection|undefined} projection Projection.
 * @return {ol.Loc} This.
 */
ol.Loc.prototype.setProjection = function(projection) {
  this.projection_ = projection;
  return this;
};


/**
 * @param {number} x X.
 * @return {ol.Loc} This.
 */
ol.Loc.prototype.setX = function(x) {
  this.x_ = x;
  return this;
};


/**
 * @param {number} y Y.
 * @return {ol.Loc} This.
 */
ol.Loc.prototype.setY = function(y) {
  this.y_ = y;
  return this;
};


/**
 * @param {number|undefined} z Z.
 * @return {ol.Loc} This.
 */
ol.Loc.prototype.setZ = function(z) {
  this.z_ = z;
  return this;
};



