goog.provide('ol3.RendererHint');
goog.provide('ol3.createMap');

goog.require('goog.object');
goog.require('ol3.Collection');
goog.require('ol3.Map');
goog.require('ol3.MapProperty');
goog.require('ol3.Projection');
goog.require('ol3.interaction.AltDragRotate');
goog.require('ol3.interaction.CenterConstraint');
goog.require('ol3.interaction.Constraints');
goog.require('ol3.interaction.DblClickZoom');
goog.require('ol3.interaction.DragPan');
goog.require('ol3.interaction.KeyboardPan');
goog.require('ol3.interaction.KeyboardZoom');
goog.require('ol3.interaction.MouseWheelZoom');
goog.require('ol3.interaction.ResolutionConstraint');
goog.require('ol3.interaction.RotationConstraint');
goog.require('ol3.interaction.ShiftDragZoom');
goog.require('ol3.renderer.dom');
goog.require('ol3.renderer.dom.Map');
goog.require('ol3.renderer.webgl');
goog.require('ol3.renderer.webgl.Map');


/**
 * @define {string} Default projection code.
 */
ol3.DEFAULT_PROJECTION_CODE = 'EPSG:3857';


/**
 * @define {string} Default user projection code.
 */
ol3.DEFAULT_USER_PROJECTION_CODE = 'EPSG:4326';


/**
 * @define {boolean} Whether to enable DOM.
 */
ol3.ENABLE_DOM = true;


/**
 * @define {boolean} Whether to enable WebGL.
 */
ol3.ENABLE_WEBGL = true;


/**
 * @enum {string}
 */
ol3.RendererHint = {
  DOM: 'dom',
  WEBGL: 'webgl'
};


/**
 * @type {Array.<ol3.RendererHint>}
 */
ol3.DEFAULT_RENDERER_HINT = [
  ol3.RendererHint.WEBGL,
  ol3.RendererHint.DOM
];


/**
 * @param {Element} target Target.
 * @param {Object.<string, *>=} opt_values Values.
 * @param {ol3.RendererHint|Array.<ol3.RendererHint>=} opt_rendererHints
 *     Renderer hints.
 * @return {ol3.Map} Map.
 */
ol3.createMap = function(target, opt_values, opt_rendererHints) {

  var values = {};
  if (goog.isDef(opt_values)) {
    goog.object.extend(values, opt_values);
  }

  // FIXME this should be a configuration option
  var centerConstraint = ol3.interaction.CenterConstraint.snapToPixel;
  var resolutionConstraint =
      ol3.interaction.ResolutionConstraint.createSnapToPower(
          Math.exp(Math.log(2) / 8), ol3.Projection.EPSG_3857_HALF_SIZE / 128);
  var rotationConstraint = ol3.interaction.RotationConstraint.none;
  var constraints = new ol3.interaction.Constraints(
      centerConstraint, resolutionConstraint, rotationConstraint);

  if (!goog.object.containsKey(values, ol3.MapProperty.INTERACTIONS)) {
    var interactions = new ol3.Collection();
    interactions.push(new ol3.interaction.AltDragRotate(constraints));
    interactions.push(new ol3.interaction.DblClickZoom(constraints));
    interactions.push(new ol3.interaction.DragPan(constraints));
    interactions.push(new ol3.interaction.KeyboardPan(constraints, 16));
    interactions.push(new ol3.interaction.KeyboardZoom(constraints));
    interactions.push(new ol3.interaction.MouseWheelZoom(constraints));
    interactions.push(new ol3.interaction.ShiftDragZoom(constraints));
    values[ol3.MapProperty.INTERACTIONS] = interactions;
  }

  if (!goog.object.containsKey(values, ol3.MapProperty.LAYERS)) {
    values[ol3.MapProperty.LAYERS] = new ol3.Collection();
  }

  if (!goog.object.containsKey(values, ol3.MapProperty.PROJECTION)) {
    values[ol3.MapProperty.PROJECTION] =
        ol3.Projection.getFromCode(ol3.DEFAULT_PROJECTION_CODE);
  }

  if (!goog.object.containsKey(values, ol3.MapProperty.USER_PROJECTION)) {
    values[ol3.MapProperty.USER_PROJECTION] =
        ol3.Projection.getFromCode(ol3.DEFAULT_USER_PROJECTION_CODE);
  }

  /**
   * @type {Array.<ol3.RendererHint>}
   */
  var rendererHints;
  if (goog.isDef(opt_rendererHints)) {
    if (goog.isArray(opt_rendererHints)) {
      rendererHints = opt_rendererHints;
    } else {
      rendererHints = [opt_rendererHints];
    }
  } else {
    rendererHints = ol3.DEFAULT_RENDERER_HINT;
  }

  var i, rendererHint, rendererConstructor;
  for (i = 0; i < rendererHints.length; ++i) {
    rendererHint = rendererHints[i];
    if (rendererHint == ol3.RendererHint.DOM) {
      if (ol3.ENABLE_DOM && ol3.renderer.dom.isSupported()) {
        rendererConstructor = ol3.renderer.dom.Map;
        break;
      }
    } else if (rendererHint == ol3.RendererHint.WEBGL) {
      if (ol3.ENABLE_WEBGL && ol3.renderer.webgl.isSupported()) {
        rendererConstructor = ol3.renderer.webgl.Map;
        break;
      }
    }
  }

  if (goog.isDef(rendererConstructor)) {
    return new ol3.Map(target, rendererConstructor, values);
  } else {
    return null;
  }

};
