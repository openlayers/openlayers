goog.provide('ol.Ellipsoid');



/**
 * @constructor
 * @param {number} a Major radius.
 * @param {number} flattening Flattening.
 */
ol.Ellipsoid = function(a, flattening) {

  /**
   * @const
   * @type {number}
   */
  this.a = a;

  /**
   * @const
   * @type {number}
   */
  this.flattening = flattening;

  /**
   * @const
   * @type {number}
   */
  this.b = this.a * (1 - this.flattening);

  /**
   * @const
   * @type {number}
   */
  this.eSquared = 2 * flattening - flattening * flattening;

  /**
   * @const
   * @type {number}
   */
  this.e = Math.sqrt(this.eSquared);

};
