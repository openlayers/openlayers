
goog.provide('ol.Kinetic');

goog.require('goog.array');
goog.require('ol.Pixel');


/**
 * @typedef {{x: number,
 *            y: number,
 *            t: number}}
 */
ol.KineticPoint;



/**
 * @constructor
 * @param {number} decay Rate of decay (must be negative).
 * @param {number} v_min Minimum velocity (pixels/millisecond).
 * @param {number} delay Delay to consider to calculate the kinetic
 *     initial values (milliseconds).
 */
ol.Kinetic = function(decay, v_min, delay) {

  /**
   * @private
   * @type {number}
   */
  this.decay_ = decay;

  /**
   * @private
   * @type {number}
   */
  this.v_min_ = v_min;

  /**
   * @private
   * @type {number}
   */
  this.delay_ = delay;

  /**
   * @private
   * @type {Array.<ol.KineticPoint>}
   */
  this.points_ = [];

  /**
   * @private
   * @type {number}
   */
  this.angle_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.v_0_ = 0;
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 */
ol.Kinetic.prototype.begin = function(browserEvent) {
  this.points_.length = 0;
  this.angle_ = 0;
  this.v_0_ = 0;
  this.update(browserEvent);
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 */
ol.Kinetic.prototype.update = function(browserEvent) {
  this.points_.push({
    x: browserEvent.clientX,
    y: browserEvent.clientY,
    t: goog.now()
  });
};


/**
 * @return {boolean} Whether we should do kinetic animation.
 */
ol.Kinetic.prototype.end = function() {
  var now = goog.now();
  var index = Math.abs(goog.array.binarySelect(this.points_, function(elt) {
    return elt.t < now - this.delay_;
  }, this));
  if (index < this.points_.length - 1) {
    var first = this.points_[index];
    var last = this.points_[this.points_.length - 1];
    var dx = last.x - first.x;
    var dy = last.y - first.y;
    this.angle_ = Math.atan2(dy, dx);
    this.v_0_ = Math.sqrt(dx * dx + dy * dy) / (last.t - first.t);
    return this.v_0_ > this.v_min_;
  }
  return false;
};


/**
 * @return {function(number): number} Easing function for kinetic animation.
 */
ol.Kinetic.prototype.getEasingFn = function() {
  var decay = this.decay_;
  var v_0 = this.v_0_;
  var v_min = this.v_min_;
  var duration = this.getDuration();
  return function(t) {
    return v_0 * (Math.exp((decay * t) * duration) - 1) / (v_min - v_0);
  };
};


/**
 * @return {number} Duration of animation (milliseconds).
 */
ol.Kinetic.prototype.getDuration = function() {
  return Math.log(this.v_min_ / this.v_0_) / this.decay_;
};


/**
 * @return {number} Total distance travelled (pixels).
 */
ol.Kinetic.prototype.getDistance = function() {
  return (this.v_min_ - this.v_0_) / this.decay_;
};


/**
 * @return {number} Angle of the kinetic panning animation (radians).
 */
ol.Kinetic.prototype.getAngle = function() {
  return this.angle_;
};
