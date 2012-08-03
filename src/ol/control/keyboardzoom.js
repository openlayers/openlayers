goog.provide('ol.control.KeyboardZoom');

goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler.EventType');
goog.require('ol.Control');
goog.require('ol.control.ResolutionConstraintType');



/**
 * @constructor
 * @extends {ol.Control}
 * @param {ol.control.ResolutionConstraintType} resolutionConstraint
 *     Resolution constraint.
 */
ol.control.KeyboardZoom = function(resolutionConstraint) {

  goog.base(this);

  /**
   * @private
   * @type {ol.control.ResolutionConstraintType}
   */
  this.resolutionConstraint_ = resolutionConstraint;

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
      var resolution = this.resolutionConstraint_(map.getResolution(), delta);
      map.setResolution(resolution);
      keyEvent.preventDefault();
      mapBrowserEvent.preventDefault();
    }
  }
};
