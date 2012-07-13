/**
 * @fileoverview Drag Pan Control.
 *
 * This control registers itself in the map as the default drag control.
 */

goog.provide('ol.control.DragPan');

goog.require('ol.control.Control');

/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {boolean|undefined} opt_autoActivate
 */
ol.control.DragPan = function(opt_autoActivate) {
    goog.base(this, opt_autoActivate);
};
goog.inherits(ol.control.DragPan, ol.control.Control);

/**
 * @param {ol.Map} map
 */
ol.control.DragPan.prototype.setMap = function(map) {
    goog.base(this, 'setMap', map);
    this.map_.setDefaultDragControl(this);
};

/**
 * @param {ol.events.MapEvent} e
 */
ol.control.DragPan.prototype.handleEvent = function(e) {
    // FIXME do we want to test ENABLE_DRAG_HANDLER here?
    if (ol.ENABLE_DRAG_HANDLER) {
        var deltaX = /** @type {number} */ e.deltaX;
        var deltaY = /** @type {number} */ e.deltaY;
        this.map_.moveByViewportPx(deltaX, deltaY);
    }
};

ol.control.addControl('dragpan', ol.control.DragPan);
