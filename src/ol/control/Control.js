goog.provide('ol.control');
goog.provide('ol.control.Control');

goog.require('goog.object');


/**
 * @enum {Object}
 */
ol.control.CONTROL_MAP = {};

/**
 * @param {string} name
 * @param {Function} Control
 */
ol.control.addControl = function(name, Control) {
    ol.control.CONTROL_MAP[name] = Control;
};

/**
 * @constructor
 * @param {boolean|undefined} opt_autoActivate
 */
ol.control.Control = function(opt_autoActivate) {
    
    /**
     * @type {ol.Map} map
     * @protected
     */
    this.map_ = null;

    /**
     * @type {boolean} active
     * @protected
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
    this.active_ = false;
    return returnValue;
};

ol.control.Control.prototype.destroy = function() {
    this.deactivate();
    goog.object.clear(this);
};
