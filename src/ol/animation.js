goog.provide('ol.animation');

goog.require('ol');
goog.require('ol.View');
goog.require('ol.coordinate');
goog.require('ol.easing');


/**
 * Generate an animated transition that will "bounce" the resolution as it
 * approaches the final value.
 * @param {olx.animation.BounceOptions} options Bounce options.
 * @return {ol.PreRenderFunction} Pre-render function.
 * @api
 */
ol.animation.bounce = function(options) {
  var resolution = options.resolution;
  var start = options.start ? options.start : Date.now();
  var duration = options.duration !== undefined ? options.duration : 1000;
  var easing = options.easing ?
      options.easing : ol.easing.upAndDown;
  return (
      /**
       * @param {ol.Map} map Map.
       * @param {?olx.FrameState} frameState Frame state.
       * @return {boolean} Run this function in the next frame.
       */
      function(map, frameState) {
        if (frameState.time < start) {
          frameState.animate = true;
          frameState.viewHints[ol.View.Hint.ANIMATING] += 1;
          return true;
        } else if (frameState.time < start + duration) {
          var delta = easing((frameState.time - start) / duration);
          var deltaResolution = resolution - frameState.viewState.resolution;
          frameState.animate = true;
          frameState.viewState.resolution += delta * deltaResolution;
          frameState.viewHints[ol.View.Hint.ANIMATING] += 1;
          return true;
        } else {
          return false;
        }
      });
};


/**
 * Generate an animated transition while updating the view center.
 * @param {olx.animation.PanOptions} options Pan options.
 * @return {ol.PreRenderFunction} Pre-render function.
 * @api
 */
ol.animation.pan = function(options) {
  var source = options.source;
  var start = options.start ? options.start : Date.now();
  var sourceX = source[0];
  var sourceY = source[1];
  var duration = options.duration !== undefined ? options.duration : 1000;
  var easing = options.easing ?
      options.easing : ol.easing.inAndOut;
  return (
      /**
       * @param {ol.Map} map Map.
       * @param {?olx.FrameState} frameState Frame state.
       * @return {boolean} Run this function in the next frame.
       */
      function(map, frameState) {
        if (frameState.time < start) {
          frameState.animate = true;
          frameState.viewHints[ol.View.Hint.ANIMATING] += 1;
          return true;
        } else if (frameState.time < start + duration) {
          var delta = 1 - easing((frameState.time - start) / duration);
          var deltaX = sourceX - frameState.viewState.center[0];
          var deltaY = sourceY - frameState.viewState.center[1];
          frameState.animate = true;
          frameState.viewState.center[0] += delta * deltaX;
          frameState.viewState.center[1] += delta * deltaY;
          frameState.viewHints[ol.View.Hint.ANIMATING] += 1;
          return true;
        } else {
          return false;
        }
      });
};


/**
 * Generate an animated transition while updating the view rotation.
 * @param {olx.animation.RotateOptions} options Rotate options.
 * @return {ol.PreRenderFunction} Pre-render function.
 * @api
 */
ol.animation.rotate = function(options) {
  var sourceRotation = options.rotation ? options.rotation : 0;
  var start = options.start ? options.start : Date.now();
  var duration = options.duration !== undefined ? options.duration : 1000;
  var easing = options.easing ?
      options.easing : ol.easing.inAndOut;
  var anchor = options.anchor ?
      options.anchor : null;

  return (
      /**
       * @param {ol.Map} map Map.
       * @param {?olx.FrameState} frameState Frame state.
       * @return {boolean} Run this function in the next frame.
       */
      function(map, frameState) {
        if (frameState.time < start) {
          frameState.animate = true;
          frameState.viewHints[ol.View.Hint.ANIMATING] += 1;
          return true;
        } else if (frameState.time < start + duration) {
          var delta = 1 - easing((frameState.time - start) / duration);
          var deltaRotation =
              (sourceRotation - frameState.viewState.rotation) * delta;
          frameState.animate = true;
          frameState.viewState.rotation += deltaRotation;
          if (anchor) {
            var center = frameState.viewState.center;
            ol.coordinate.sub(center, anchor);
            ol.coordinate.rotate(center, deltaRotation);
            ol.coordinate.add(center, anchor);
          }
          frameState.viewHints[ol.View.Hint.ANIMATING] += 1;
          return true;
        } else {
          return false;
        }
      });
};


/**
 * Generate an animated transition while updating the view resolution.
 * @param {olx.animation.ZoomOptions} options Zoom options.
 * @return {ol.PreRenderFunction} Pre-render function.
 * @api
 */
ol.animation.zoom = function(options) {
  var sourceResolution = options.resolution;
  var start = options.start ? options.start : Date.now();
  var duration = options.duration !== undefined ? options.duration : 1000;
  var easing = options.easing ?
      options.easing : ol.easing.inAndOut;
  return (
      /**
       * @param {ol.Map} map Map.
       * @param {?olx.FrameState} frameState Frame state.
       * @return {boolean} Run this function in the next frame.
       */
      function(map, frameState) {
        if (frameState.time < start) {
          frameState.animate = true;
          frameState.viewHints[ol.View.Hint.ANIMATING] += 1;
          return true;
        } else if (frameState.time < start + duration) {
          var delta = 1 - easing((frameState.time - start) / duration);
          var deltaResolution =
              sourceResolution - frameState.viewState.resolution;
          frameState.animate = true;
          frameState.viewState.resolution += delta * deltaResolution;
          frameState.viewHints[ol.View.Hint.ANIMATING] += 1;
          return true;
        } else {
          return false;
        }
      });
};
