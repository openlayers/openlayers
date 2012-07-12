/**
 * @fileoverview Click Handler.
 *
 * Provides a class for listening to click events on a DOM element
 * and re-dispatching to a map instance.
 *
 * This handler has no default behaviour.
 */

goog.provide('ol.handler.Click');

goog.require('ol.handler.states');
goog.require('ol.events.MapEvent');
goog.require('ol.events.MapEventType');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.Disposable');


/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {ol.Map} map The map instance.
 * @param {Element} element The element we listen for click on.
 * @param {Object} states An object for the handlers to share states.
 */
ol.handler.Click = function(map, element, states) {
    goog.base(this);

    /**
     * @type {ol.Map}
     */
    this.map_ = map;

    /**
     * @type {Element}
     */
    this.element_ = element;

    /**
     * @type {Object}
     */
    this.states_ = states;

    goog.events.listen(this.element_, goog.events.EventType.CLICK,
                       this.handleClick, undefined, this);
};
goog.inherits(ol.handler.Click, goog.Disposable);

/**
 * @inheritDoc
 */
ol.handler.Click.prototype.disposeInternal = function() {
    goog.events.unlisten(this.element_, goog.events.EventType.CLICK,
                         this.handleClick, undefined, this);
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
