/* Copyright (c) 2006-2007 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @requires OpenLayers/Control.js
 */

/**
 * Class: OpenLayers.Control.ScaleLine
 * Display a small line indicator representing the current map scale on the map.
 * 
 * Inherits from:
 *  - <OpenLayers.Control>
 *  
 * Is a very close copy of:
 *  - <OpenLayers.Control.Scale>
 */
OpenLayers.Control.ScaleLine = OpenLayers.Class(OpenLayers.Control, {

    /**
     * Property: maxWidth
     * {Integer} Maximum width of the scale line in pixels.  Default is 100.
     */
    maxWidth: 100,

    /**
     * Property: topOutUnits
     * {String} Units for zoomed out on top bar.  Default is km.
     */
    topOutUnits: "km",
    
    /**
     * Property: topInUnits
     * {String} Units for zoomed in on top bar.  Default is m.
     */
    topInUnits: "m",

    /**
     * Property: bottomOutUnits
     * {String} Units for zoomed out on bottom bar.  Default is mi.
     */
    bottomOutUnits: "mi",

    /**
     * Property: bottomInUnits
     * {String} Units for zoomed in on bottom bar.  Default is ft.
     */
    bottomInUnits: "ft",
    
    /**
     * Property: eTop
     * {DOMElement}
     */
    eTop: null,

    /**
     * Property: eBottom
     * {DOMElement}
     */
    eBottom:null,

    /**
     * Constructor: OpenLayers.ScaleLine
     * Create a new scale line control.
     * 
     * Parameters:
     * options - {Object} An optional object whose properties will be used
     *     to extend the control.
     */
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);     
    },

    /**
     * Method: draw
     * 
     * Returns:
     * {DOMElement}
     */
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        if (!this.eTop) {
            this.div.style.display = "block";
            this.div.style.position = "absolute";
            
            // stick in the top bar
            this.eTop = document.createElement("div");
            this.eTop.className = this.displayClass + "Top";
            var theLen = this.topInUnits.length;
            this.div.appendChild(this.eTop);
            if((this.topOutUnits == "") || (this.topInUnits == "")) {
                this.eTop.style.visibility = "hidden";
            } else {
                this.eTop.style.visibility = "visible";
            }

            // and the bottom bar
            this.eBottom = document.createElement("div");
            this.eBottom.className = this.displayClass + "Bottom";
            this.div.appendChild(this.eBottom);
            if((this.bottomOutUnits == "") || (this.bottomInUnits == "")) {
                this.eBottom.style.visibility = "hidden";
            } else {
                this.eBottom.style.visibility = "visible";
            }
        }
        this.map.events.register('moveend', this, this.update);
        this.update();
        return this.div;
    },

    /** 
     * Method: getBarLen
     * Given a number, round it down to the nearest 1,2,5 times a power of 10.
     * That seems a fairly useful set of number groups to use.
     * 
     * Parameters:
     * maxLen - {float}  the number we're rounding down from
     * 
     * Returns:
     * {Float} the rounded number (less than or equal to maxLen)
     */
    getBarLen: function(maxLen) {
        // nearest power of 10 lower than maxLen
        var digits = parseInt(Math.log(maxLen) / Math.log(10));
        var pow10 = Math.pow(10, digits);
        
        // ok, find first character
        var firstChar = parseInt(maxLen / pow10);

        // right, put it into the correct bracket
        var barLen;
        if(firstChar > 5) {
            barLen = 5;
        } else if(firstChar > 2) {
            barLen = 2;
        } else {
            barLen = 1;
        }

        // scale it up the correct power of 10
        return barLen * pow10;
    },

    /**
     * Method: update
     * Update the size of the bars, and the labels they contain.
     */
    update: function() {
        var res = this.map.getResolution();
        if (!res) {
            return;
        }

        var curMapUnits = this.map.getUnits();
        var inches = OpenLayers.INCHES_PER_UNIT;

        // convert maxWidth to map units
        var maxSizeData = this.maxWidth * res * inches[curMapUnits];  

        // decide whether to use large or small scale units     
        var topUnits;
        var bottomUnits;
        if(maxSizeData > 100000) {
            topUnits = this.topOutUnits;
            bottomUnits = this.bottomOutUnits;
        } else {
            topUnits = this.topInUnits;
            bottomUnits = this.bottomInUnits;
        }

        // and to map units units
        var topMax = maxSizeData / inches[topUnits];
        var bottomMax = maxSizeData / inches[bottomUnits];

        // now trim this down to useful block length
        var topRounded = this.getBarLen(topMax);
        var bottomRounded = this.getBarLen(bottomMax);

        // and back to display units
        topMax = topRounded / inches[curMapUnits] * inches[topUnits];
        bottomMax = bottomRounded / inches[curMapUnits] * inches[bottomUnits];

        // and to pixel units
        var topPx = topMax / res;
        var bottomPx = bottomMax / res;
        
        // now set the pixel widths
        this.eTop.style.width = Math.round(topPx) + "px";
        this.eBottom.style.width = Math.round(bottomPx) + "px"; 
        
        // and the values inside them
        this.eTop.innerHTML = topRounded + " " + topUnits;
        this.eBottom.innerHTML = bottomRounded + " " + bottomUnits ;
    }, 

    CLASS_NAME: "OpenLayers.Control.ScaleLine"
});

