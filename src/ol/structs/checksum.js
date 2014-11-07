goog.provide('ol.structs.IHasChecksum');


/**
 * @typedef {string}
 */
ol.structs.Checksum;



/**
 * @interface
 */
ol.structs.IHasChecksum = function() {
};


/**
 * @return {string} The checksum.
 */
ol.structs.IHasChecksum.prototype.getChecksum = function() {
};
