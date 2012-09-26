goog.require('ol.Map');



/**
 * @constructor
 * @extends {ol.Map}
 * @param {Element} container Container.
 * @param {olx.MapOptionsExtern} mapOptionsExtern Map options literal.
 * @param {goog.dom.ViewportSizeMonitor=} opt_viewportSizeMonitor
 *     Viewport size monitor.
 */
ol.MapExport = function(container, mapOptionsExtern, opt_viewportSizeMonitor) {

  goog.base(this, container, {
    center: mapOptionsExtern.center,
    doubleClickZoom: mapOptionsExtern.doubleClickZoom,
    dragPan: mapOptionsExtern.dragPan,
    interactions: mapOptionsExtern.interactions,
    keyboard: mapOptionsExtern.keyboard,
    keyboardPanOffset: mapOptionsExtern.keyboardPanOffset,
    layers: mapOptionsExtern.layers,
    mouseWheelZoom: mapOptionsExtern.mouseWheelZoom,
    projection: mapOptionsExtern.projection,
    renderer: mapOptionsExtern.renderer,
    renderers: mapOptionsExtern.renderers,
    resolution: mapOptionsExtern.resolution,
    rotate: mapOptionsExtern.rotate,
    shiftDragZoom: mapOptionsExtern.shiftDragZoom,
    userProjection: mapOptionsExtern.userProjection,
    zoom: mapOptionsExtern.zoom
  }, opt_viewportSizeMonitor);

};
goog.inherits(ol.MapExport, ol.Map);

goog.exportSymbol('ol.Map', ol.MapExport);
