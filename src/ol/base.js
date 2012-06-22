goog.provide('ol.base');
goog.provide('ol.error');

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

/**
 * @define {boolean}
 */
ol.error.VERBOSE_ERRORS = true;
