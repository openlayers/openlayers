goog.provide('ol.control.Control');

goog.require('ol.Map');


/**
 * @constructor
 * @param {boolean|undefined} opt_autoActivate
 */
ol.control.Control = function(opt_autoActivate) {
    
    /**
     * @type {ol.Map} map
     * @private
     */
    this.map_ = null;

    /**
     * @type {boolean} active
     * @private
     */
    this.active_ = false;
    
    /**
     * Activate this control when it is added to a map.  Default is false.
     *
     * @type {boolean} autoActivate
     */
    this.autoActivate_ =
        goog.isDef(opt_autoActivate) ? opt_autoActivate : false;
};

/**
 * @return {ol.Map} getMap
 */
ol.control.Control.prototype.getMap = function() {
    return this.map_;
};

/**
 * @param {ol.Map} map
 */
ol.control.Control.prototype.setMap = function(map) {
    this.map_ = map;
    if (this.autoActivate_) {
        this.activate();
    }
};

/**
 * @return {boolean}
 */
ol.control.Control.prototype.activate = function() {
    var returnValue = !this.active_;
    this.active_ = true;
    return returnValue;
};

/**
 * @return {boolean}
 */
ol.control.Control.prototype.deactivate = function() {
    var returnValue = this.active_;
    this.active_ = true;
    return returnValue;
};