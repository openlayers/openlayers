goog.provide('ol.projection');

goog.require('ol.Projection');


/**
 * @typedef {ol.Projection|string}
 */
ol.ProjectionLike;


/**
 * @export
 * @param {ol.ProjectionLike=} opt_arg Argument.
 * @return {ol.Projection} Projection.
 */
ol.projection = function(opt_arg){
    /** @type {string} */
    var code;
    
    /** @type {undefined|number} */
    var units;

    if (arguments.length == 1 && goog.isDefAndNotNull(opt_arg)) {
        if (opt_arg instanceof ol.Projection) {
            return opt_arg;
        }
        else if (goog.isString(opt_arg)) {
            code = opt_arg;
        }
        else if (goog.isObject(opt_arg)) {
            if (goog.isString(opt_arg['code'])) {
                code = opt_arg['code'];
            } else {
                throw new Error('Projection requires a string code.');
            }
            units = opt_arg['units'];
        }
        else {
            throw new Error('ol.projection');
        }
    }
    var proj = new ol.Projection(code);
    proj.setUnits(units);
    return proj;
};

