goog.require('ol.Map');



/**
 * @constructor
 * @extends {ol.Map}
 * @param {Element} container Container.
 * @param {olx.MapOptionsExtern} mapOptionsExtern Map options literal.
 */
ol.MapExport = function(container, mapOptionsExtern) {

  goog.base(this, container, {
    center: mapOptionsExtern.center,
    controls: mapOptionsExtern.controls,
    doubleClickZoom: mapOptionsExtern.doubleClickZoom,
    dragPan: mapOptionsExtern.dragPan,
    interactions: mapOptionsExtern.interactions,
    keyboard: mapOptionsExtern.keyboard,
    keyboardPanOffset: mapOptionsExtern.keyboardPanOffset,
    layers: mapOptionsExtern.layers,
    maxResolution: mapOptionsExtern.maxResolution,
    mouseWheelZoom: mapOptionsExtern.mouseWheelZoom,
    mouseWheelZoomDelta: mapOptionsExtern.mouseWheelZoomDelta,
    projection: mapOptionsExtern.projection,
    renderer: mapOptionsExtern.renderer,
    renderers: mapOptionsExtern.renderers,
    resolution: mapOptionsExtern.resolution,
    resolutions: mapOptionsExtern.resolutions,
    rotate: mapOptionsExtern.rotate,
    shiftDragZoom: mapOptionsExtern.shiftDragZoom,
    userProjection: mapOptionsExtern.userProjection,
    zoom: mapOptionsExtern.zoom,
    zoomDelta: mapOptionsExtern.zoomDelta,
    zoomFactor: mapOptionsExtern.zoomFactor
  });

};
goog.inherits(ol.MapExport, ol.Map);

goog.exportSymbol('ol.Map', ol.MapExport);
