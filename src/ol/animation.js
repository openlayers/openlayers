// FIXME works for View2D only

goog.provide('ol.animation');

goog.require('goog.fx.easing');
goog.require('ol.PreRenderFunction');
goog.require('ol.View2D');
goog.require('ol.easing');


/**
 * @param {number} resolution Resolution.
 * @param {number=} opt_duration Duration.
 * @param {number=} opt_start Start.
 * @param {function(number): number=} opt_easingFunction Easing function.
 * @return {ol.PreRenderFunction} Pre-render function.
 */
ol.animation.createBounce =
    function(resolution, opt_duration, opt_start, opt_easingFunction) {
  var start = goog.isDef(opt_start) ? opt_start : Date.now();
  var duration = goog.isDef(opt_duration) ? opt_duration : 1000;
  var easingFunction = goog.isDef(opt_easingFunction) ?
      opt_easingFunction : ol.easing.upAndDown;
  return function(map, frameState) {
    if (frameState.time < start) {
      frameState.animate = true;
      frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
      return true;
    } else if (frameState.time < start + duration) {
      var delta = easingFunction((frameState.time - start) / duration);
      var deltaResolution = resolution - frameState.view2DState.resolution;
      frameState.animate = true;
      frameState.view2DState.resolution += delta * deltaResolution;
      frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
      return true;
    } else {
      return false;
    }
  };
};


/**
 * @param {ol.Coordinate} source Source.
 * @param {number=} opt_duration Duration.
 * @param {number=} opt_start Start.
 * @param {function(number): number=} opt_easingFunction Easing function.
 * @return {ol.PreRenderFunction} Pre-render function.
 */
ol.animation.createPanFrom =
    function(source, opt_duration, opt_start, opt_easingFunction) {
  var start = goog.isDef(opt_start) ? opt_start : Date.now();
  var sourceX = source.x;
  var sourceY = source.y;
  var duration = goog.isDef(opt_duration) ? opt_duration : 1000;
  var easingFunction = goog.isDef(opt_easingFunction) ?
      opt_easingFunction : goog.fx.easing.inAndOut;
  return function(map, frameState) {
    if (frameState.time < start) {
      frameState.animate = true;
      frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
      return true;
    } else if (frameState.time < start + duration) {
      var delta = 1 - easingFunction((frameState.time - start) / duration);
      var deltaX = sourceX - frameState.view2DState.center.x;
      var deltaY = sourceY - frameState.view2DState.center.y;
      frameState.animate = true;
      frameState.view2DState.center.x += delta * deltaX;
      frameState.view2DState.center.y += delta * deltaY;
      frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
      return true;
    } else {
      return false;
    }
  };
};


/**
 * @param {number=} opt_duration Duration.
 * @param {number=} opt_turns Turns.
 * @param {number=} opt_start Start.
 * @param {function(number): number=} opt_easingFunction Easing function.
 * @return {ol.PreRenderFunction} Pre-render function.
 */
ol.animation.createSpin =
    function(opt_duration, opt_turns, opt_start, opt_easingFunction) {
  var start = goog.isDef(opt_start) ? opt_start : Date.now();
  var duration = goog.isDef(opt_duration) ? opt_duration : 1000;
  var turns = goog.isDef(opt_turns) ? opt_turns : 1;
  var deltaTheta = 2 * turns * Math.PI;
  var easingFunction = goog.isDef(opt_easingFunction) ?
      opt_easingFunction : goog.fx.easing.inAndOut;
  return function(map, frameState) {
    if (frameState.time < start) {
      frameState.animate = true;
      frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
      return true;
    } else if (frameState.time < start + duration) {
      var delta = easingFunction((frameState.time - start) / duration);
      frameState.animate = true;
      frameState.view2DState.rotation += delta * deltaTheta;
      frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
      return true;
    } else {
      return false;
    }
  };
};
