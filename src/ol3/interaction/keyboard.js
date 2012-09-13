// FIXME this class is ugly and should be removed

goog.provide('ol3.interaction.Keyboard');

goog.require('ol3.Interaction');



/**
 * @constructor
 * @extends {ol3.Interaction}
 */
ol3.interaction.Keyboard = function() {

  goog.base(this, null);

  /**
   * @private
   * @type {Object.<number, Function>}
   */
  this.charCodeCallbacks_ = {};

};
goog.inherits(ol3.interaction.Keyboard, ol3.Interaction);


/**
 * @param {string} s String.
 * @param {Function} callback Callback.
 */
ol3.interaction.Keyboard.prototype.addCallback = function(s, callback) {
  var i;
  for (i = 0; i < s.length; ++i) {
    this.charCodeCallbacks_[s.charCodeAt(i)] = callback;
  }
};


/**
 * @inheritDoc
 */
ol3.interaction.Keyboard.prototype.handleMapBrowserEvent =
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
