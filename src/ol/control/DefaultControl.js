goog.provide('ol.control.DefaultControl');

goog.require('ol.control.Control');

/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {boolean|undefined} opt_autoActivate
 */
ol.control.DefaultControl = function(opt_autoActivate) {
    goog.base(this, opt_autoActivate);

    /**
     * Activate this control when it is added to a map.  Default is true.
     *
     * @type {boolean} autoActivate
     */
    this.autoActivate_ =
        goog.isDef(opt_autoActivate) ? opt_autoActivate : true;
    
};
goog.inherits(ol.control.DefaultControl, ol.control.Control);

/** @inheritDoc */
ol.control.DefaultControl.prototype.activate = function() {
    var active = goog.base(this, 'activate');
    if (active) {
        this.map_.setDefaultControl(this);
    }
    return active;
};

/** @inheritDoc */
ol.control.DefaultControl.prototype.deactivate = function() {
    var inactive = goog.base(this, 'deactivate');
    if (inactive) {
        this.map_.setDefaultControl(null);
    }
    return inactive;
};

/**
 * @param {ol.events.MapEvent} e
 */
ol.control.DefaultControl.prototype.defaultDrag = function(e) {};

/**
 * @param {ol.events.MapEvent} e
 */
ol.control.DefaultControl.prototype.defaultMouseWheel = function(e) {};
