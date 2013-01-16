/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/Control.js
 */

/**
 * Class: OpenLayers.Control.MousePosition
 * The MousePosition control displays geographic coordinates of the mouse
 * pointer, as it is moved about the map.
 *
 * You can use the <prefix>- or <suffix>-properties to provide more information
 * about the displayed coordinates to the user:
 *
 * (code)
 *     var mousePositionCtrl = new OpenLayers.Control.MousePosition({
 *         prefix: '<a target="_blank" ' +
 *             'href="http://spatialreference.org/ref/epsg/4326/">' +
 *             'EPSG:4326</a> coordinates: '
 *         }
 *     );
 * (end code)
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.MousePosition = OpenLayers.Class(OpenLayers.Control, {

    /**
     * APIProperty: autoActivate
     * {Boolean} Activate the control when it is added to a map.  Default is
     *     true.
     */
    autoActivate: true,

    /**
     * Property: element
     * {DOMElement}
     */
    element: null,

    /**
     * APIProperty: prefix
     * {String} A string to be prepended to the current pointers coordinates
     *     when it is rendered.  Defaults to the empty string ''.
     */
    prefix: '',

    /**
     * APIProperty: separator
     * {String} A string to be used to seperate the two coordinates from each
     *     other.  Defaults to the string ', ', which will result in a
     *     rendered coordinate of e.g. '42.12, 21.22'.
     */
    separator: ', ',

    /**
     * APIProperty: suffix
     * {String} A string to be appended to the current pointers coordinates
     *     when it is rendered.  Defaults to the empty string ''.
     */
    suffix: '',

    /**
     * APIProperty: numDigits
     * {Integer} The number of digits each coordinate shall have when being
     *     rendered, Defaults to 5.
     */
    numDigits: 5,

    /**
     * APIProperty: granularity
     * {Integer}
     */
    granularity: 10,

    /**
     * APIProperty: emptyString
     * {String} Set this to some value to set when the mouse is outside the
     *     map.
     */
    emptyString: null,

    /**
     * Property: lastXy
     * {<OpenLayers.Pixel>}
     */
    lastXy: null,

    /**
     * APIProperty: displayProjection
     * {<OpenLayers.Projection>} The projection in which the mouse position is
     *     displayed.
     */
    displayProjection: null,

    /**
     * Constructor: OpenLayers.Control.MousePosition
     *
     * Parameters:
     * options - {Object} Options for control.
     */

    /**
     * Method: destroy
     */
     destroy: function() {
         this.deactivate();
         OpenLayers.Control.prototype.destroy.apply(this, arguments);
     },

    /**
     * APIMethod: activate
     */
    activate: function() {
        if (OpenLayers.Control.prototype.activate.apply(this, arguments)) {
            this.map.events.register('mousemove', this, this.redraw);
            this.map.events.register('mouseout', this, this.reset);
            this.redraw();
            return true;
        } else {
            return false;
        }
    },

    /**
     * APIMethod: deactivate
     */
    deactivate: function() {
        if (OpenLayers.Control.prototype.deactivate.apply(this, arguments)) {
            this.map.events.unregister('mousemove', this, this.redraw);
            this.map.events.unregister('mouseout', this, this.reset);
            this.element.innerHTML = "";
            return true;
        } else {
            return false;
        }
    },

    /**
     * Method: draw
     * {DOMElement}
     */
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);

        if (!this.element) {
            this.div.left = "";
            this.div.top = "";
            this.element = this.div;
        }

        return this.div;
    },

    /**
     * Method: redraw
     */
    redraw: function(evt) {

        var lonLat;

        if (evt == null) {
            this.reset();
            return;
        } else {
            if (this.lastXy == null ||
                Math.abs(evt.xy.x - this.lastXy.x) > this.granularity ||
                Math.abs(evt.xy.y - this.lastXy.y) > this.granularity)
            {
                this.lastXy = evt.xy;
                return;
            }

            lonLat = this.map.getLonLatFromPixel(evt.xy);
            if (!lonLat) {
                // map has not yet been properly initialized
                return;
            }
            if (this.displayProjection) {
                lonLat.transform(this.map.getProjectionObject(),
                                 this.displayProjection );
            }
            this.lastXy = evt.xy;

        }

        var newHtml = this.formatOutput(lonLat);

        if (newHtml != this.element.innerHTML) {
            this.element.innerHTML = newHtml;
        }
    },

    /**
     * Method: reset
     */
    reset: function(evt) {
        if (this.emptyString != null) {
            this.element.innerHTML = this.emptyString;
        }
    },

    /**
     * Method: formatOutput
     * Override to provide custom display output
     *
     * Parameters:
     * lonLat - {<OpenLayers.LonLat>} Location to display
     */
    formatOutput: function(lonLat) {
        var digits = parseInt(this.numDigits);
        var newHtml =
            this.prefix +
            lonLat.lon.toFixed(digits) +
            this.separator +
            lonLat.lat.toFixed(digits) +
            this.suffix;
        return newHtml;
    },

    CLASS_NAME: "OpenLayers.Control.MousePosition"
});
