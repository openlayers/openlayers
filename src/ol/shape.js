// FIXME check size when stroked
// FIXME move to ol.render?
// FIXME find a sensible caching strategy

goog.provide('ol.shape');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('ol.style');


/**
 * @param {number} radius Radius.
 * @param {?ol.style.Fill} fillStyle Fill style.
 * @param {?ol.style.Stroke} strokeStyle Stroke style.
 * @return {ol.style.Image} Image.
 */
ol.shape.renderCircle = function(radius, fillStyle, strokeStyle) {

  var canvas = /** @type {HTMLCanvasElement} */
      (goog.dom.createElement(goog.dom.TagName.CANVAS));
  var size = 2 * radius + 1;
  if (!goog.isNull(strokeStyle) && goog.isDef(strokeStyle.width)) {
    size += strokeStyle.width;
  }
  canvas.height = size;
  canvas.width = size;

  var context = /** @type {CanvasRenderingContext2D} */
      (canvas.getContext('2d'));
  context.arc(size / 2, size / 2, radius, 0, 2 * Math.PI, true);

  if (goog.isDefAndNotNull(fillStyle)) {
    context.fillStyle = fillStyle.color;
    context.fill();
  }
  if (goog.isDefAndNotNull(strokeStyle)) {
    context.strokeStyle = strokeStyle.color;
    context.lineWidth = strokeStyle.width;
    context.stroke();
  }

  return {
    anchor: [size / 2, size / 2],
    image: canvas,
    rotation: 0,
    snapToPixel: undefined,
    subtractViewRotation: false
  };

};
