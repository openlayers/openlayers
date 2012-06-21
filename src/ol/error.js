goog.provide('ol.error');


/**
 * @define
 * @type {boolean}
 */
ol.error.VERBOSE_ERRORS = true;


/**
 * @param {string} message Message.
 */
ol.error = function(message) {
    if (ol.error.VERBOSE_ERRORS) {
        throw new Error(message);
    } else {
        throw null;
    }
};
