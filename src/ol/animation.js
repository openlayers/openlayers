// FIXME works for View2D only

goog.provide('ol.animation');

goog.require('ol.PreRenderFunction');
goog.require('ol.ViewHint');
goog.require('ol.easing');


/**
 * @param {ol.animation.BounceOptions} options Options.
 * @return {ol.PreRenderFunction} Pre-render function.
 */
ol.animation.bounce = function(options) {
  var resolution = options.resolution;
  var start = goog.isDef(options.start) ? options.start : goog.now();
  var duration = goog.isDef(options.duration) ? options.duration : 1000;
  var easing = goog.isDef(options.easing) ?
      options.easing : ol.easing.upAndDown;
  return function(map, frameState) {
    if (frameState.time < start) {
      frameState.animate = true;
      frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
      return true;
    } else if (frameState.time < start + duration) {
      var delta = easing((frameState.time - start) / duration);
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
 * @param {ol.animation.PanOptions} options Options.
 * @return {ol.PreRenderFunction} Pre-render function.
 */
ol.animation.pan = function(options) {
  var source = options.source;
  var start = goog.isDef(options.start) ? options.start : goog.now();
  var sourceX = source.x;
  var sourceY = source.y;
  var duration = goog.isDef(options.duration) ? options.duration : 1000;
  var easing = goog.isDef(options.easing) ?
      options.easing : ol.easing.inAndOut;
  return function(map, frameState) {
    if (frameState.time < start) {
      frameState.animate = true;
      frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
      return true;
    } else if (frameState.time < start + duration) {
      var delta = 1 - easing((frameState.time - start) / duration);
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
 * @param {ol.animation.RotateOptions} options Options.
 * @return {ol.PreRenderFunction} Pre-render function.
 */
ol.animation.rotate = function(options) {
  var sourceRotation = options.rotation;
  var start = goog.isDef(options.start) ? options.start : goog.now();
  var duration = goog.isDef(options.duration) ? options.duration : 1000;
  var easing = goog.isDef(options.easing) ?
      options.easing : ol.easing.inAndOut;

  return function(map, frameState) {
    if (frameState.time < start) {
      frameState.animate = true;
      frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
      return true;
    } else if (frameState.time < start + duration) {
      var delta = 1 - easing((frameState.time - start) / duration);
      var deltaRotation =
          sourceRotation - frameState.view2DState.rotation;
      frameState.animate = true;
      frameState.view2DState.rotation += delta * deltaRotation;
      frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
      return true;
    } else {
      return false;
    }
  };
};


/**
 * @param {ol.animation.ZoomOptions} options Options.
 * @return {ol.PreRenderFunction} Pre-render function.
 */
ol.animation.zoom = function(options) {
  var sourceResolution = options.resolution;
  var start = goog.isDef(options.start) ? options.start : goog.now();
  var duration = goog.isDef(options.duration) ? options.duration : 1000;
  var easing = goog.isDef(options.easing) ?
      options.easing : ol.easing.linear;
  return function(map, frameState) {
    if (frameState.time < start) {
      frameState.animate = true;
      frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
      return true;
    } else if (frameState.time < start + duration) {
      var delta = 1 - easing((frameState.time - start) / duration);
      var deltaResolution =
          sourceResolution - frameState.view2DState.resolution;
      frameState.animate = true;
      frameState.view2DState.resolution += delta * deltaResolution;
      frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
      return true;
    } else {
      return false;
    }
  };
};
