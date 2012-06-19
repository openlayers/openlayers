goog.provide('ol.Location');

goog.require('ol.Projection');



/**
 * @constructor
 * @param {number} x X.
 * @param {number} y Y.
 * @param {number} z Z.
 * @param {ol.Projection|undefined} projection Projection.
 */
ol.Location = function(x, y, z, projection) {

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
   * @type {number}
   */
  this.z_ = z;

  /**
   * @private
   * @type {ol.Projection|undefined}
   */
  this.projection_ = projection;

};


/**
 * @return {ol.Projection|undefined} Projection.
 */
ol.Location.prototype.getProjection = function() {
  return this.projection_;
};


/**
 * @return {number} X.
 */
ol.Location.prototype.getX = function() {
  return this.x_;
};


/**
 * @return {number} Y.
 */
ol.Location.prototype.getY = function() {
  return this.y_;
};


/**
 * @return {number} Z.
 */
ol.Location.prototype.getZ = function() {
  return this.z_;
};


/**
 * @param {ol.Projection|undefined} projection Projection.
 * @return {ol.Location} This.
 */
ol.Location.prototype.setProjection = function(projection) {
  this.projection_ = projection;
  return this;
};


/**
 * @param {number} x X.
 * @return {ol.Location} This.
 */
ol.Location.prototype.setX = function(x) {
  this.x_ = x;
  return this;
};


/**
 * @param {number} y Y.
 * @return {ol.Location} This.
 */
ol.Location.prototype.setY = function(y) {
  this.y_ = y;
  return this;
};


/**
 * @param {number} z Z.
 * @return {ol.Location} This.
 */
ol.Location.prototype.setZ = function(z) {
  this.z_ = z;
  return this;
};



