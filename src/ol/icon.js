goog.provide('ol.icon');

goog.require('ol.style.Image');


/**
 * @param {string} src Image source URI.
 * @param {ol.Size} size Image size.
 * @return {ol.style.Image} Image.
 */
ol.icon.renderIcon = function(src, size) {
  return new ol.style.Image({
    anchor: [size[0] / 2, size[1] / 2],
    size: size,
    src: src,
    rotation: 0,
    snapToPixel: undefined,
    subtractViewRotation: false
  });
};
