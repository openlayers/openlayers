/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */
// @require: OpenLayers/Control.js
OpenLayers.Control.Permalink = Class.create();
OpenLayers.Control.Permalink.prototype = 
  Object.extend( new OpenLayers.Control(), {

    element: null,
    
    base: '',
    
    initialize: function(element, base) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        this.element = element;        
        if (base) this.base = base;
    },
    
    draw: function() {
        this.map.events.register( 'moveend', this, this.updateLink);
        var args = this.getArgs();
        if (args.lat && args.lon) {
            this.map.setCenter(
               new OpenLayers.LonLat(parseFloat(args.lon), parseFloat(args.lat))
            );
        }
        if (args.zoom) {
            this.map.zoomTo(parseInt(args.zoom));
        }
    },
   
    getArgs: function() {
        var args = new Object();
        var query = location.search.substring(1);  // Get query string.
        var pairs = query.split("&");              // Break at ampersand. //+pjl

        for(var i = 0; i < pairs.length; i++) {
            var pos = pairs[i].indexOf('=');       // Look for "name=value".
            if (pos == -1) continue;               // If not found, skip.
            var argname = pairs[i].substring(0,pos);  // Extract the name.
            var value = pairs[i].substring(pos+1); // Extract the value.
            args[argname] = unescape(value);          // Store as a property.
        }
        return args;                               // Return the object.
    },

    updateLink: function() {
        center = this.map.getCenter();
        zoom = this.map.getZoom(); 
        lat = Math.round(center.lat*100000)/100000;
        lon = Math.round(center.lon*100000)/100000;
        this.element.href = this.base+"?lat="+lat+"&lon="+lon+"&zoom="+zoom; 
    },

});

