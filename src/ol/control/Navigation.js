goog.provide('ol.control.Navigation');

goog.require('ol.control.DefaultControl');
goog.require('ol.Map');

/**
 * @constructor
 * @extends {ol.control.DefaultControl}
 * @param {boolean|undefined} opt_autoActivate
 */
ol.control.Navigation = function(opt_autoActivate) {
    goog.base(this, opt_autoActivate);
};
goog.inherits(ol.control.Navigation, ol.control.DefaultControl);


/**
 * @inheritDoc
 */
ol.control.Navigation.prototype.defaultDrag = function(e) {
    if (ol.ENABLE_DRAG_HANDLER) {
        var deltaX = /** @type {number} */ e.deltaX;
        var deltaY = /** @type {number} */ e.deltaY;
        this.map_.moveByViewportPx(deltaX, deltaY);
    }
};

/**
 * @inheritDoc
 */
ol.control.Navigation.prototype.defaultMouseWheel = function(e) {
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

ol.control.addControl('navigation', ol.control.Navigation);
