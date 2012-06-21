goog.provide('ol.layer.xyz');

goog.require('ol.layer.XYZ');

/**
 * @export
 * @param {Object} opt_arg Config object.
 * @return {ol.layer.XYZ}
 */
ol.layer.xyz = function(opt_arg) {
    if (opt_arg instanceof ol.layer.XYZ) {
        return opt_arg;
    }

    /** @type {string} */
    var url;

    var usage = 'ol.layer.xyz accepts an object with a "url" property';

    if (goog.isObject(opt_arg)) {
        url = opt_arg['url'];
    } else {
        throw new Error(usage);
    }

    if (!goog.isDef(url)) {
        throw new Error(usage);
    }

    return new ol.layer.XYZ(url);
};
