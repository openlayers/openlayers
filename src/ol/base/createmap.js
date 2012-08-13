goog.provide('ol.RendererHint');
goog.provide('ol.createMap');

goog.require('goog.object');
goog.require('ol.Collection');
goog.require('ol.Map');
goog.require('ol.MapProperty');
goog.require('ol.Projection');
goog.require('ol.dom');
goog.require('ol.dom.MapRenderer');
goog.require('ol.interaction.AltDragRotate');
goog.require('ol.interaction.CenterConstraint');
goog.require('ol.interaction.Constraints');
goog.require('ol.interaction.DblClickZoom');
goog.require('ol.interaction.DragPan');
goog.require('ol.interaction.KeyboardPan');
goog.require('ol.interaction.KeyboardZoom');
goog.require('ol.interaction.MouseWheelZoom');
goog.require('ol.interaction.ResolutionConstraint');
goog.require('ol.interaction.RotationConstraint');
goog.require('ol.interaction.ShiftDragZoom');
goog.require('ol.webgl');
goog.require('ol.webgl.MapRenderer');


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
  var centerConstraint = ol.interaction.CenterConstraint.snapToPixel;
  var resolutionConstraint =
      ol.interaction.ResolutionConstraint.createSnapToPower(
          Math.exp(Math.log(2) / 8), ol.Projection.EPSG_3857_HALF_SIZE / 128);
  var rotationConstraint = ol.interaction.RotationConstraint.none;
  var constraints = new ol.interaction.Constraints(
      centerConstraint, resolutionConstraint, rotationConstraint);

  if (!goog.object.containsKey(values, ol.MapProperty.INTERACTIONS)) {
    var interactions = new ol.Collection();
    interactions.push(new ol.interaction.AltDragRotate(constraints));
    interactions.push(new ol.interaction.DblClickZoom(constraints));
    interactions.push(new ol.interaction.DragPan(constraints));
    interactions.push(new ol.interaction.KeyboardPan(constraints, 16));
    interactions.push(new ol.interaction.KeyboardZoom(constraints));
    interactions.push(new ol.interaction.MouseWheelZoom(constraints));
    interactions.push(new ol.interaction.ShiftDragZoom(constraints));
    values[ol.MapProperty.INTERACTIONS] = interactions;
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

  var i, rendererHint, rendererConstructor;
  for (i = 0; i < rendererHints.length; ++i) {
    rendererHint = rendererHints[i];
    if (rendererHint == ol.RendererHint.DOM) {
      if (ol.ENABLE_DOM && ol.dom.isSupported()) {
        rendererConstructor = ol.dom.MapRenderer;
        return new ol.Map(target, rendererConstructor, values);
      }
    } else if (rendererHint == ol.RendererHint.WEBGL) {
      if (ol.ENABLE_WEBGL && ol.webgl.isSupported()) {
        rendererConstructor = ol.webgl.MapRenderer;
        return new ol.Map(target, rendererConstructor, values);
      }
    }
  }

  return null;

};
