goog.provide('ol.RendererHint');
goog.provide('ol.createMap');

goog.require('goog.object');
goog.require('ol.Collection');
goog.require('ol.Map');
goog.require('ol.MapProperty');
goog.require('ol.Projection');
goog.require('ol.control.CenterConstraint');
goog.require('ol.control.Constraints');
goog.require('ol.control.DblClickZoom');
goog.require('ol.control.DragPan');
goog.require('ol.control.KeyboardPan');
goog.require('ol.control.KeyboardZoom');
goog.require('ol.control.MouseWheelZoom');
goog.require('ol.control.ResolutionConstraint');
goog.require('ol.control.RotationConstraint');
goog.require('ol.control.ShiftDragRotate');
goog.require('ol.control.ShiftDragZoom');
goog.require('ol.dom');
goog.require('ol.dom.Map');
goog.require('ol.webgl');
goog.require('ol.webgl.Map');


/**
 * @define {string} Default projection code.
 */
ol.DEFAULT_PROJECTION_CODE = 'EPSG:3857';


/**
 * @define {string} Default user projection code.
 */
ol.DEFAULT_USER_PROJECTION_CODE = 'EPSG:4326';


/**
 * @define {boolean} Whether to enable DOM.
 */
ol.ENABLE_DOM = true;


/**
 * @define {boolean} Whether to enable WebGL.
 */
ol.ENABLE_WEBGL = true;


/**
 * @enum {string}
 */
ol.RendererHint = {
  DOM: 'dom',
  WEBGL: 'webgl'
};


/**
 * @type {Array.<ol.RendererHint>}
 */
ol.DEFAULT_RENDERER_HINT = [
  ol.RendererHint.WEBGL,
  ol.RendererHint.DOM
];


/**
 * @param {Element} target Target.
 * @param {Object.<string, *>=} opt_values Values.
 * @param {ol.RendererHint|Array.<ol.RendererHint>=} opt_rendererHints
 *     Renderer hints.
 * @return {ol.Map} Map.
 */
ol.createMap = function(target, opt_values, opt_rendererHints) {

  var values = {};
  if (goog.isDef(opt_values)) {
    goog.object.extend(values, opt_values);
  }

  // FIXME this should be a configuration option
  var centerConstraint = ol.control.CenterConstraint.snapToPixel;
  var resolutionConstraint = ol.control.ResolutionConstraint.createSnapToPower(
      Math.exp(Math.log(2) / 8), ol.Projection.EPSG_3857_HALF_SIZE / 128);
  var rotationConstraint = ol.control.RotationConstraint.none;
  var constraints = new ol.control.Constraints(
      centerConstraint, resolutionConstraint, rotationConstraint);

  if (!goog.object.containsKey(values, ol.MapProperty.CONTROLS)) {
    var controls = new ol.Collection();
    controls.push(new ol.control.DblClickZoom(constraints));
    controls.push(new ol.control.DragPan(constraints));
    controls.push(new ol.control.KeyboardPan(constraints, 16));
    controls.push(new ol.control.KeyboardZoom(constraints));
    controls.push(new ol.control.MouseWheelZoom(constraints));
    controls.push(new ol.control.ShiftDragRotate(constraints));
    controls.push(new ol.control.ShiftDragZoom(constraints));
    values[ol.MapProperty.CONTROLS] = controls;
  }

  if (!goog.object.containsKey(values, ol.MapProperty.LAYERS)) {
    values[ol.MapProperty.LAYERS] = new ol.Collection();
  }

  if (!goog.object.containsKey(values, ol.MapProperty.PROJECTION)) {
    values[ol.MapProperty.PROJECTION] =
        ol.Projection.getFromCode(ol.DEFAULT_PROJECTION_CODE);
  }

  if (!goog.object.containsKey(values, ol.MapProperty.USER_PROJECTION)) {
    values[ol.MapProperty.USER_PROJECTION] =
        ol.Projection.getFromCode(ol.DEFAULT_USER_PROJECTION_CODE);
  }

  /**
   * @type {Array.<ol.RendererHint>}
   */
  var rendererHints;
  if (goog.isDef(opt_rendererHints)) {
    if (goog.isArray(opt_rendererHints)) {
      rendererHints = opt_rendererHints;
    } else {
      rendererHints = [opt_rendererHints];
    }
  } else {
    rendererHints = ol.DEFAULT_RENDERER_HINT;
  }

  var i, rendererHint;
  for (i = 0; i < rendererHints.length; ++i) {
    rendererHint = rendererHints[i];
    if (rendererHint == ol.RendererHint.DOM) {
      if (ol.ENABLE_DOM && ol.dom.isSupported()) {
        return new ol.dom.Map(target, values);
      }
    } else if (rendererHint == ol.RendererHint.WEBGL) {
      if (ol.ENABLE_WEBGL && ol.webgl.isSupported()) {
        return new ol.webgl.Map(target, values);
      }
    }
  }

  return null;

};
