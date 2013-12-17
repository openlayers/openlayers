goog.provide('ol.icon');

goog.require('ol.style.Image');


/**
 * @param {string} src Image source URI.
 * @param {ol.Size=} opt_size Image size.
 * @return {ol.style.Image} Image.
 */
ol.icon.renderIcon = function(src, opt_size) {

  /**
   * @type {ol.Size}
   */
  var size = goog.isDef(opt_size) ? opt_size : null;

  /**
   * @type {ol.Pixel}
   */
  var anchor = !goog.isNull(size) ? [size[0] / 2, size[1] / 2] : null;

  return new ol.style.Image({
    anchor: anchor,
    size: size,
    src: src,
    rotation: 0,
    snapToPixel: undefined,
    subtractViewRotation: false
  });
};
