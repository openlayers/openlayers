/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/SingleFile.js
 */

/**
 * Namespace: OpenLayers.Date
 * Contains implementations of Date.parse and date.toISOString that match the
 *     ECMAScript 5 specification for parsing RFC 3339 dates.
 *     http://tools.ietf.org/html/rfc3339
 */
OpenLayers.Date = {

    /**
     * APIMethod: toISOString
     * Generates a string representing a date.  The format of the string follows
     *     the profile of ISO 8601 for date and time on the Internet (see
     *     http://tools.ietf.org/html/rfc3339).  If the toISOString method is
     *     available on the Date prototype, that is used.  The toISOString
     *     method for Date instances is defined in ECMA-262.
     *
     * Parameters:
     * date - {Date} A date object.
     *
     * Returns:
     * {String} A string representing the date (e.g.
     *     "2010-08-07T16:58:23.123Z").  If the date does not have a valid time
     *     (i.e. isNaN(date.getTime())) this method returns the string "Invalid
     *     Date".  The ECMA standard says the toISOString method should throw
     *     RangeError in this case, but Firefox returns a string instead.  For
     *     best results, use isNaN(date.getTime()) to determine date validity
     *     before generating date strings.
     */
    toISOString: (function() {
        if ("toISOString" in Date.prototype) {
            return function(date) {
                return date.toISOString();
            };
        } else {
            function pad(num, len) {
                var str = num + "";
                while (str.length < len) {
                    str = "0" + str;
                }
                return str;
            }
            return function(date) {
                var str;
                if (isNaN(date.getTime())) {
                    // ECMA-262 says throw RangeError, Firefox returns
                    // "Invalid Date"
                    str = "Invalid Date";
                } else {
                    str =
                        date.getUTCFullYear() + "-" +
                        pad(date.getUTCMonth() + 1, 2) + "-" +
                        pad(date.getUTCDate(), 2) + "T" +
                        pad(date.getUTCHours(), 2) + ":" +
                        pad(date.getUTCMinutes(), 2) + ":" +
                        pad(date.getUTCSeconds(), 2) + "." +
                        pad(date.getUTCMilliseconds(), 3) + "Z";
                }
                return str;
            };
        }

    })(),

    /**
     * APIMethod: parse
     * Generate a date object from a string.  The format for the string follows
     *     the profile of ISO 8601 for date and time on the Internet (see
     *     http://tools.ietf.org/html/rfc3339).  We don't call the native
     *     Date.parse because of inconsistency between implmentations.  In
     *     Chrome, calling Date.parse with a string that doesn't contain any
     *     indication of the timezone (e.g. "2011"), the date is interpreted
     *     in local time.  On Firefox, the assumption is UTC.
     *
     * Parameters:
     * str - {String} A string representing the date (e.g.
     *     "2010", "2010-08", "2010-08-07", "2010-08-07T16:58:23.123Z",
     *     "2010-08-07T11:58:23.123-06").
     *
     * Returns:
     * {Date} A date object.  If the string could not be parsed, an invalid
     *     date is returned (i.e. isNaN(date.getTime())).
     */
    parse: function(str) {
        var date;
        var match = str.match(/^(?:(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?(?:(?:T(\d{1,2}):(\d{2}):(\d{2}(?:\.\d+)?)(Z|(?:[+-]\d{1,2}(?::(\d{2}))?)))|Z)?$/);
        if (match && (match[1] || match[7])) { // must have at least year or time
            var year = parseInt(match[1], 10) || 0;
            var month = (parseInt(match[2], 10) - 1) || 0;
            var day = parseInt(match[3], 10) || 1;
            date = new Date(Date.UTC(year, month, day));
            // optional time
            var type = match[7];
            if (type) {
                var hours = parseInt(match[4], 10);
                var minutes = parseInt(match[5], 10);
                var secFrac = parseFloat(match[6]);
                var seconds = secFrac | 0;
                var milliseconds = Math.round(1000 * (secFrac - seconds));
                date.setUTCHours(hours, minutes, seconds, milliseconds);
                // check offset
                if (type !== "Z") {
                    var hoursOffset = parseInt(type, 10);
                    var minutesOffset = parseInt(match[8], 10) || 0;
                    var offset = -1000 * (60 * (hoursOffset * 60) + minutesOffset * 60);
                    date = new Date(date.getTime() + offset);
                }
            }
        } else {
            date = new Date("invalid");
        }
        return date;
    }
};
