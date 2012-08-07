// FIXME this class is ugly and should be removed

goog.provide('ol.control.Keyboard');

goog.require('ol.Control');



/**
 * @constructor
 * @extends {ol.Control}
 */
ol.control.Keyboard = function() {

  goog.base(this, null);

  /**
   * @private
   * @type {Object.<number, Function>}
   */
  this.charCodeCallbacks_ = {};

};
goog.inherits(ol.control.Keyboard, ol.Control);


/**
 * @param {string} s String.
 * @param {Function} callback Callback.
 */
ol.control.Keyboard.prototype.addCallback = function(s, callback) {
  var i;
  for (i = 0; i < s.length; ++i) {
    this.charCodeCallbacks_[s.charCodeAt(i)] = callback;
  }
};


/**
 * @inheritDoc
 */
ol.control.Keyboard.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  if (mapBrowserEvent.type == goog.events.KeyHandler.EventType.KEY) {
    var keyEvent = /** @type {goog.events.KeyEvent} */
        mapBrowserEvent.browserEvent;
    var callback = this.charCodeCallbacks_[keyEvent.charCode];
    if (callback) {
      callback();
      mapBrowserEvent.preventDefault();
    }
  }
};
