/**
 * @fileoverview Mouse Wheel Zoom Control.
 *
 * This control registers itself in the map as the default mouse wheel control.
 */

goog.provide('ol.control.MouseWheelZoom');

goog.require('ol.control.Control');

/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {boolean|undefined} opt_autoActivate
 */
ol.control.MouseWheelZoom = function(opt_autoActivate) {
    goog.base(this, opt_autoActivate);
};
goog.inherits(ol.control.MouseWheelZoom, ol.control.Control);

/**
 * @param {ol.Map} map
 */
ol.control.MouseWheelZoom.prototype.setMap = function(map) {
    goog.base(this, 'setMap', map);
    this.map_.setDefaultMouseWheelControl(this);
};

/**
 * @param {ol.events.MapEvent} e
 */
ol.control.MouseWheelZoom.prototype.handleEvent = function(e) {
    // FIXME do we want to test ENABLE_DRAG_HANDLER here?
    if (ol.ENABLE_MOUSEWHEEL_HANDLER) {
        var me = this,
            originalE = e.originalEvent;
        if (originalE.deltaY === 0 || me.zoomBlocked_) {
            return;
        }
        me.zoomBlocked_ = window.setTimeout(function() {
            me.zoomBlocked_ = null;
        }, 200);

        var map = me.map_,
            step = originalE.deltaY / Math.abs(originalE.deltaY),
            position = goog.style.getRelativePosition(originalE,
                                                      map.getViewport());
        map.setZoom(map.getZoom() - step, position);

        // We don't want the page to scroll.
        // (MouseWheelEvent is a originalEvent)
        e.preventDefault();
    }
};

ol.control.addControl('mousewheelzoom', ol.control.MouseWheelZoom);
