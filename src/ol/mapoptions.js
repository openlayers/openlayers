goog.provide('ol.MapOptions');
goog.provide('ol.MapOptionsLiteral');
goog.provide('ol.MapOptionsType');
goog.provide('ol.RendererHint');

goog.require('ol.Collection');
goog.require('ol.Projection');
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
goog.require('ol.renderer.Map');
goog.require('ol.renderer.dom');
goog.require('ol.renderer.dom.Map');
goog.require('ol.renderer.webgl');
goog.require('ol.renderer.webgl.Map');


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
ol.DEFAULT_RENDERER_HINTS = [
  ol.RendererHint.WEBGL,
  ol.RendererHint.DOM
];


/**
 * @typedef {{center: (ol.Coordinate|undefined),
 *            doubleClickZoom: (boolean|undefined),
 *            dragPan: (boolean|undefined),
 *            interactions: (ol.Collection|undefined),
 *            keyboard: (boolean|undefined),
 *            keyboardPanOffset: (number|undefined),
 *            layers: (ol.Collection|undefined),
 *            mouseWheelZoom: (boolean|undefined),
 *            projection: (ol.Projection|string|undefined),
 *            renderer: (ol.RendererHint|undefined),
 *            renderers: (Array.<(ol.RendererHint)>|undefined),
 *            resolution: (number|undefined),
 *            rotate: (boolean|undefined),
 *            shiftDragZoom: (boolean|undefined),
 *            userProjection: (ol.Projection|string|undefined),
 *            zoom: (number|undefined)}}
 */
ol.MapOptionsLiteral;


/**
 * @typedef {{rendererConstructor:
 *                function(new: ol.renderer.Map, Element, ol.Map),
 *            values: Object.<string, *>}}
 */
ol.MapOptionsType;


/**
 * @param {ol.MapOptionsLiteral} mapOptionsLiteral Map options.
 * @return {ol.MapOptionsType} Map options.
 */
ol.MapOptions.create = function(mapOptionsLiteral) {

  /**
   * @type {Object.<string, *>}
   */
  var values = {};

  if (goog.isDef(mapOptionsLiteral.center)) {
    values[ol.MapProperty.CENTER] = mapOptionsLiteral.center;
  }

  values[ol.MapProperty.INTERACTIONS] =
      goog.isDef(mapOptionsLiteral.interactions) ?
      mapOptionsLiteral.interactions :
      ol.MapOptions.createInteractions_(mapOptionsLiteral);

  values[ol.MapProperty.LAYERS] = goog.isDef(mapOptionsLiteral.layers) ?
      mapOptionsLiteral.layers : new ol.Collection();

  values[ol.MapProperty.PROJECTION] = ol.MapOptions.createProjection_(
      mapOptionsLiteral.projection, 'EPSG:3857');

  if (goog.isDef(mapOptionsLiteral.resolution)) {
    values[ol.MapProperty.RESOLUTION] = mapOptionsLiteral.resolution;
  } else if (goog.isDef(mapOptionsLiteral.zoom)) {
    values[ol.MapProperty.RESOLUTION] =
        ol.Projection.EPSG_3857_HALF_SIZE / (128 << mapOptionsLiteral.zoom);
  }

  values[ol.MapProperty.USER_PROJECTION] = ol.MapOptions.createProjection_(
      mapOptionsLiteral.userProjection, 'EPSG:4326');

  /**
   * @type {function(new: ol.renderer.Map, Element, ol.Map)}
   */
  var rendererConstructor = ol.renderer.Map;

  /**
   * @type {Array.<ol.RendererHint>}
   */
  var rendererHints;
  if (goog.isDef(mapOptionsLiteral.renderers)) {
    rendererHints = mapOptionsLiteral.renderers;
  } else if (goog.isDef(mapOptionsLiteral.renderer)) {
    rendererHints = [mapOptionsLiteral.renderer];
  } else {
    rendererHints = ol.DEFAULT_RENDERER_HINTS;
  }

  var i, rendererHint;
  for (i = 0; i < rendererHints.length; ++i) {
    rendererHint = rendererHints[i];
    if (rendererHint == ol.RendererHint.DOM) {
      if (ol.ENABLE_DOM && ol.renderer.dom.isSupported()) {
        rendererConstructor = ol.renderer.dom.Map;
        break;
      }
    } else if (rendererHint == ol.RendererHint.WEBGL) {
      if (ol.ENABLE_WEBGL && ol.renderer.webgl.isSupported()) {
        rendererConstructor = ol.renderer.webgl.Map;
        break;
      }
    }
  }

  return {
    rendererConstructor: rendererConstructor,
    values: values
  };

};


/**
 * @private
 * @param {ol.MapOptionsLiteral} mapOptionsLiteral Map options literal.
 * @return {ol.Collection} Interactions.
 */
ol.MapOptions.createInteractions_ = function(mapOptionsLiteral) {

  // FIXME this should be a configuration option
  var centerConstraint = ol.interaction.CenterConstraint.snapToPixel;
  var resolutionConstraint =
      ol.interaction.ResolutionConstraint.createSnapToPower(
          Math.exp(Math.log(2) / 8), ol.Projection.EPSG_3857_HALF_SIZE / 128);
  var rotationConstraint = ol.interaction.RotationConstraint.none;
  var constraints = new ol.interaction.Constraints(
      centerConstraint, resolutionConstraint, rotationConstraint);

  var interactions = new ol.Collection();

  var rotate = goog.isDef(mapOptionsLiteral.rotate) ?
      mapOptionsLiteral.rotate : true;
  if (rotate) {
    interactions.push(new ol.interaction.AltDragRotate(constraints));
  }

  var doubleClickZoom = goog.isDef(mapOptionsLiteral.doubleClickZoom) ?
      mapOptionsLiteral.doubleClickZoom : true;
  if (doubleClickZoom) {
    interactions.push(new ol.interaction.DblClickZoom(constraints));
  }

  var dragPan = goog.isDef(mapOptionsLiteral.dragPan) ?
      mapOptionsLiteral.dragPan : true;
  if (dragPan) {
    interactions.push(new ol.interaction.DragPan(constraints));
  }

  var keyboard = goog.isDef(mapOptionsLiteral.keyboard) ?
      mapOptionsLiteral.keyboard : true;
  var keyboardPanOffset = goog.isDef(mapOptionsLiteral.keyboardPanOffset) ?
      mapOptionsLiteral.keyboardPanOffset : 80;
  if (keyboard) {
    interactions.push(
        new ol.interaction.KeyboardPan(constraints, keyboardPanOffset));
    interactions.push(new ol.interaction.KeyboardZoom(constraints));
  }

  var mouseWheelZoom = goog.isDef(mapOptionsLiteral.mouseWheelZoom) ?
      mapOptionsLiteral.mouseWheelZoom : true;
  if (mouseWheelZoom) {
    interactions.push(new ol.interaction.MouseWheelZoom(constraints));
  }

  var shiftDragZoom = goog.isDef(mapOptionsLiteral.shiftDragZoom) ?
      mapOptionsLiteral.shiftDragZoom : true;
  if (shiftDragZoom) {
    interactions.push(new ol.interaction.ShiftDragZoom(constraints));
  }

  return interactions;

};


/**
 * @private
 * @param {ol.Projection|string|undefined} projection Projection.
 * @param {string} defaultCode Default code.
 * @return {ol.Projection} Projection.
 */
ol.MapOptions.createProjection_ = function(projection, defaultCode) {
  if (!goog.isDefAndNotNull(projection)) {
    return ol.Projection.getFromCode(defaultCode);
  } else if (goog.isString(projection)) {
    return ol.Projection.getFromCode(projection);
  } else {
    goog.asserts.assert(projection instanceof ol.Projection);
    return projection;
  }
};
