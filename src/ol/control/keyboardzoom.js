goog.provide('ol.control.KeyboardZoom');

goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler.EventType');
goog.require('ol.Control');
goog.require('ol.control.ZoomFunctionType');



/**
 * @constructor
 * @extends {ol.Control}
 * @param {ol.control.ZoomFunctionType} zoomFunction Zoom function.
 */
ol.control.KeyboardZoom = function(zoomFunction) {

  goog.base(this);

  /**
   * @private
   * @type {ol.control.ZoomFunctionType}
   */
  this.zoomFunction_ = zoomFunction;

};
goog.inherits(ol.control.KeyboardZoom, ol.Control);


/**
 * @inheritDoc
 */
ol.control.KeyboardZoom.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  if (mapBrowserEvent.type == goog.events.KeyHandler.EventType.KEY) {
    var keyEvent = /** @type {goog.events.KeyEvent} */
        mapBrowserEvent.browserEvent;
    var charCode = keyEvent.charCode;
    if (charCode == '+'.charCodeAt(0) || charCode == '-'.charCodeAt(0)) {
      var map = mapBrowserEvent.map;
      var delta = charCode == '+'.charCodeAt(0) ? 1 : -1;
      var resolution = this.zoomFunction_(map.getResolution(), delta);
      map.setResolution(resolution);
      keyEvent.preventDefault();
      mapBrowserEvent.preventDefault();
    }
  }
};
