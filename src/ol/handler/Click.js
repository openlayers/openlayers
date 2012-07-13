/**
 * @fileoverview Click Handler.
 *
 * Provides a class for listening to click events on a DOM element
 * and dispatching click events to a map instance.
 *
 * This handler has no default behaviour.
 */

goog.provide('ol.handler.Click');

goog.require('ol.handler.MapHandler');
goog.require('ol.events.MapEvent');
goog.require('ol.events.MapEventType');

goog.require('goog.events');
goog.require('goog.events.EventType');


/**
 * @constructor
 * @extends {ol.handler.MapHandler}
 * @param {ol.Map} map The map instance.
 * @param {ol.handler.states} states An object for the handlers to share
 *     states.
 */
ol.handler.Click = function(map, states) {
    goog.base(this, map, states);

    goog.events.listen(this.element_, goog.events.EventType.CLICK,
                       this.handleClick, false, this);
};
goog.inherits(ol.handler.Click, ol.handler.MapHandler);

/**
 * @inheritDoc
 */
ol.handler.Click.prototype.disposeInternal = function() {
    goog.events.unlisten(this.element_, goog.events.EventType.CLICK,
                         this.handleClick, false, this);
};

/**
 * @param {goog.events.BrowserEvent} e
 */
ol.handler.Click.prototype.handleClick = function(e) {
    // do not emit a map click event after a drag
    if (!this.states_.dragged) {
        var newE = new ol.events.MapEvent(ol.events.MapEventType.CLICK, e);
        goog.events.dispatchEvent(this.map_, newE);
    }
};
