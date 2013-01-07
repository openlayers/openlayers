// FIXME this class is ugly and should be removed

goog.provide('ol.interaction.Keyboard');

goog.require('ol.interaction.Interaction');



/**
 * @constructor
 * @extends {ol.interaction.Interaction}
 */
ol.interaction.Keyboard = function() {

  goog.base(this);

  /**
   * @private
   * @type {Object.<number, Function>}
   */
  this.charCodeCallbacks_ = {};

};
goog.inherits(ol.interaction.Keyboard, ol.interaction.Interaction);


/**
 * @param {string} s String.
 * @param {Function} callback Callback.
 */
ol.interaction.Keyboard.prototype.addCallback = function(s, callback) {
  var i;
  for (i = 0; i < s.length; ++i) {
    this.charCodeCallbacks_[s.charCodeAt(i)] = callback;
  }
};


/**
 * @inheritDoc
 */
ol.interaction.Keyboard.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  if (mapBrowserEvent.type == goog.events.KeyHandler.EventType.KEY) {
    var keyEvent = /** @type {goog.events.KeyEvent} */
        (mapBrowserEvent.browserEvent);
    var callback = this.charCodeCallbacks_[keyEvent.charCode];
    if (callback) {
      callback();
      mapBrowserEvent.preventDefault();
    }
  }
};
