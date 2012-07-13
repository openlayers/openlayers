/**
 * @fileoverview Map Handler.
 *
 * Type definitions and base class for map event handlers that share states,
 * listen for events on a map related dom element (usually the map's viewport),
 * dispatch events to an ol.Map instance, and optionally perform default
 * actions on an ol.Map instance.
 */

goog.provide('ol.handler.states');
goog.provide('ol.handler.MapHandler');

goog.require('goog.Disposable');

/**
 * Type definition for shared states between handlers. The following states
 * are defined:
 *
 * * dragged (boolean) - Set by the Drag handler when we are dragging. Read by
 *   the click handler to determine if a click is a real click or the result
 *   of a mouseup/touchend at the end of a drag sequence.
 *
 * @typedef {{dragged: boolean}}
 */
ol.handler.states;

/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {ol.Map} map The map instance.
 * @param {ol.handler.states} states An object for the handlers to share
 *     states.
 */
ol.handler.MapHandler = function(map, states) {
    goog.base(this);

    /**
     * @type {ol.Map}
     * @protected
     */
    this.map_ = map;

    /**
     * @type {Element}
     * @protected
     */
    this.element_ = map.getViewport();

    /**
     * @type {ol.handler.states}
     * @protected
     */
    this.states_ = states;

};
goog.inherits(ol.handler.MapHandler, goog.Disposable);