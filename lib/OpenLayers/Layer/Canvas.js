/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/**
 * @class
 * 
 * @requires OpenLayers/Layer.js
 */
OpenLayers.Layer.Canvas = Class.create();
OpenLayers.Layer.Canvas.prototype = 
  Object.extend( new OpenLayers.Layer(), {
    
    /** Canvas layer is never a base layer. 
     * 
     * @type Boolean
     */
    isBaseLayer: false,
    isFixed: true, 
    /** internal marker list
    * @type Array(OpenLayers.Marker) */
    canvas: null,

    lines: new Array(),
    
    /**
    * @constructor
    *
    * @param {String} name
    * @param {Object} options Hashtable of extra options to tag onto the layer
    */
    initialize: function(name, options) {
        OpenLayers.Layer.prototype.initialize.apply(this, arguments);
    },
    
    /**
     * 
     */
    destroy: function() {
        // xxx actually destroy the canvas to scavenge ram?
        canvas = null;
        OpenLayers.Layer.prototype.destroy.apply(this, arguments);
    },

    
    /** 
     * @param {OpenLayers.Bounds} bounds
     * @param {Boolean} zoomChanged
     * @param {Boolean} dragging
     */
    moveTo:function(bounds, zoomChanged, dragging) {
        OpenLayers.Layer.prototype.moveTo.apply(this, arguments);

        this.redraw();
    },

    setStrokeColor: function(color) {
        var ctx = this.canvas.getContext("2d");
        ctx.strokeStyle = color;
    },
    setStrokeWidth: function(width) {
        var ctx = this.canvas.getContext("2d");
        ctx.lineWidth = width;
    },
    setAlpha: function(alpha) {
        var ctx = this.canvas.getContext("2d");
        ctx.globalAlpha = alpha;
    },
    /**
     * 
     */
    clearCanvas: function() {
        if(this.canvas != null) {
          this.canvas.getContext("2d").clearRect(0,0,this.map.getSize().w, this.map.getSize().h);
          // xxx use real width and height
        }
    },

    drawLine: function(start, end) {
        var ctx = this.canvas.getContext("2d");
        this.addLine(start, end);
        this.lines.push(new Array(start,end, ctx.strokeStyle, ctx.lineWidth, ctx.globalAlpha));
    },
    addLine: function(start, end) {
        var ctx = this.canvas.getContext("2d");
        var startpx = this.map.getPixelFromLonLat(start);
        var endpx = this.map.getPixelFromLonLat(end);
        ctx.beginPath();
        ctx.moveTo(startpx.x, startpx.y);
        ctx.lineTo(endpx.x, endpx.y);
        ctx.closePath();
        ctx.stroke();
    },
    
    /** clear all the marker div's from the layer and then redraw all of them.
    *    Use the map to recalculate new placement of markers.
    */
    redraw: function() {
        // xxx rebuild the canvas if smaller than the view
        // xxx may wish to overside the canvas with overflow=hidden by default
        if(!this.canvas) {
          this.canvas = document.createElement("CANVAS");
          this.canvas.setAttribute("width",this.map.getSize().w);
          this.canvas.setAttribute("height",this.map.getSize().h);
          this.div.appendChild(this.canvas);
        } else {
            this.clearCanvas();
        }
        for(var i=0; i < this.lines.length; i++) {
            this.setStrokeColor(this.lines[i][2]);
            this.setStrokeWidth(this.lines[i][3]);
            this.setAlpha(this.lines[i][4]);
            this.addLine(this.lines[i][0], this.lines[i][1]);
        }    
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.Canvas"
});
