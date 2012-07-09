goog.provide('ol.control.Navigation');

goog.require('ol.control.Control');


/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {boolean|undefined} opt_autoActivate
 */
ol.control.Navigation = function(opt_autoActivate) {

    goog.base(this, opt_autoActivate);

    /**
     * Activate this control when it is added to a map.  Default is true.
     *
     * @type {boolean} autoActivate
     */
    this.autoActivate_ =
        goog.isDef(opt_autoActivate) ? opt_autoActivate : true;
    
    /**
     * @type {number?}
     * @private
     */
    this.zoomBlocked_ = null;
    
};
goog.inherits(ol.control.Navigation, ol.control.Control);

/** @inheritDoc */
ol.control.Navigation.prototype.activate = function() {
    var active = goog.base(this, 'activate');
    if (active) {
        // Listen to the map's parent EventTarget here. This is to
        // give other, higher-level, controls a chance to stop the
        // navigation control.
        var target = this.map_.getParentEventTarget();
        goog.events.listen(target, 'drag', this.moveMap, false, this);
        goog.events.listen(target, 'mousewheel', this.zoomMap, false, this);
    }
    return active;
};

/** @inheritDoc */
ol.control.Navigation.prototype.deactivate = function() {
    var inactive = goog.base(this, 'deactivate');
    if (inactive) {
        var target = this.map_.getParentEventTarget();
        goog.events.unlisten(target, 'drag', this.moveMap, false, this);
        goog.events.unlisten(target, 'mousewheel', this.zoomMap, false, this);
    }
    return inactive;
};

/**
 * @param {Object} evt
 */
ol.control.Navigation.prototype.moveMap = function(evt) {
    this.map_.moveByViewportPx(evt.deltaX, evt.deltaY);
    return false;
};

/**
 * @param {Event} evt
 */
ol.control.Navigation.prototype.zoomMap = function(evt) {
    var me = this;
    if (evt.deltaY === 0 || me.zoomBlocked_) {
        return;
    }
    me.zoomBlocked_ = window.setTimeout(function() {
        me.zoomBlocked_ = null;
    }, 200);
    
    var map = me.map_,
        step = evt.deltaY / Math.abs(evt.deltaY);
    map.setZoom(map.getZoom()-step, evt.position);
    // We don't want the page to scroll.
    evt.preventDefault();
    return false;
};

ol.control.addControl('navigation', ol.control.Navigation);
