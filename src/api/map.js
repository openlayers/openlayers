goog.provide('ol.map');

goog.require('ol.Loc');
goog.require('ol.Map');
goog.require('ol.Projection');
goog.require('ol.loc');


/**
 * @typedef {ol.Map|Object|string}
 */
ol.MapLike;


/**
 * @param {ol.MapLike=} opt_arg Argument.
 * @return {ol.Map} Map.
 */
ol.map = function(opt_arg){

    /** @type {ol.Loc|undefined} */
    var center;
    var target;
    
    if (arguments.length == 1) {
        if (opt_arg instanceof ol.Map) {
            return opt_arg;
        }
        else 
            if (goog.isObject(opt_arg)) {
                var config = opt_arg;
                if (goog.isDef(config.center)) {
                    center = ol.loc(config.center);
                }
                if (goog.isDef(config.target)) {
                    target = config.target;
                }
            }
            else {
                throw new Error('ol.map');
            }
    }
    
    var map = new ol.Map();
    
    return map;
    
};

/**
 * @param {ol.LocLike=} opt_arg
 * @returns {ol.Map|ol.Loc|undefined} Map center.
 */
ol.Map.prototype.center = function(opt_arg) {
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        return this.setCenter(ol.loc(opt_arg));
    } else {
        return this.getCenter();
    }
};
