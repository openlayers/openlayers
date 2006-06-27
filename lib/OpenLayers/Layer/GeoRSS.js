/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */
// @require: OpenLayers/Layer/Markers.js

/**
* @class
*/
OpenLayers.Layer.GeoRSS = Class.create();
OpenLayers.Layer.GeoRSS.prototype = 
  Object.extend( new OpenLayers.Layer.Markers(), {

    /** store url of text file
    * @type str */
    location:null,

    /** @type Array(OpenLayers.Feature) */
    features: null,

    /** @type OpenLayers.Feature */
    selectedFeature: null,

    /**
    * @constructor
    *
    * @param {String} name
    * @param {String} location
    */
    initialize: function(name, location) {
        OpenLayers.Layer.Markers.prototype.initialize.apply(this, [name]);
        this.location = location;
        this.features = new Array();
        OpenLayers.loadURL(location, null, this, this.parseData);
    },

    /**
     * 
     */
    destroy: function() {
        this.clearFeatures();
        this.features = null;
        OpenLayers.Layer.Markers.prototype.destroy.apply(this, arguments);
    },
    
    /** WFS layer is never a base class. 
     * @type Boolean
     */
    isBaseLayer: function() {
        return false;
    },
    
    
    /**
     * @param {?} ajaxRequest
     */
    parseData: function(ajaxRequest) {
        var doc = ajaxRequest.responseXML;
        if (!doc || ajaxRequest.fileType!="XML") {
            doc = OpenLayers.parseXMLString(ajaxRequest.responseText);
        }
        var itemlist = doc.getElementsByTagName('item');
        for (var i = 0; i < itemlist.length; i++) {
            var data = {};
            var point = OpenLayers.Util.getNodes(itemlist[i], 'georss:point');
            var lat = OpenLayers.Util.getNodes(itemlist[i], 'geo:lat');
            var lon = OpenLayers.Util.getNodes(itemlist[i], 'geo:long');
            if (point.length > 0) {
                var location = point[0].firstChild.nodeValue.split(" ");
                
                if (location.length !=2) {
                    var location = point[0].firstChild.nodeValue.split(",");
                }
            } else if (lat.length > 0 && lon.length > 0) {
                var location = [parseFloat(lat[0].firstChild.nodeValue), parseFloat(lon[0].firstChild.nodeValue)];
            } else {
                continue;
            }
            location = new OpenLayers.LonLat(parseFloat(location[1]), parseFloat(location[0]));
            var title = OpenLayers.Util.getNodes(itemlist[i], "title")[0].firstChild.nodeValue;
            var description = OpenLayers.Util.getNodes(itemlist[i], "description")[0].firstChild.nodeValue;
            try { var link = OpenLayers.Util.getNodes(itemlist[i], "link")[0].firstChild.nodeValue; } catch (e) { } 
            data.icon = OpenLayers.Marker.defaultIcon();
            data.popupSize = new OpenLayers.Size(250, 100);
            if ((title != null) && (description != null)) {
                contentHTML = "<br />";
                contentHTML += "<div style='margin: -0.5em 0.5em 0.5em 0.5em'>" 
                
                contentHTML += "<div style='height: 1.3em; overflow: hidden'>";
                contentHTML += "<span style='font-size: 1.2em; font-weight: bold'>"; 
                if (link)  contentHTML += "<a href='"+link+"' target='_blank'>"; 
                contentHTML +=     title;
                if (link) contentHTML += "</a>";
                contentHTML += "</span>";
                contentHTML += "</div>";


                contentHTML += "<span style='font-size: 0.7em; align:center'>";
                contentHTML += description;
                contentHTML += "</span>";

                contentHTML += "</div>"
                data['popupContentHTML'] = contentHTML;
                
                //data['popupContentHTML'] = '<h2>'+title+'</h2><p>'+description+'</p>';
            }
            var feature = new OpenLayers.Feature(this, location, data);
            this.features.append(feature);
            var marker = feature.createMarker();
            marker.events.register('click', feature, this.markerClick);
            this.addMarker(marker);
        }
    },
    
    /**
     * @param {Event} evt
     */
    markerClick: function(evt) {
        sameMarkerClicked = (this == this.layer.selectedFeature);
        this.layer.selectedFeature = (!sameMarkerClicked) ? this : null;
        for(var i=0; i < this.layer.map.popups.length; i++) {
            this.layer.map.removePopup(this.layer.map.popups[i]);
        }
        if (!sameMarkerClicked) {
            var popup = this.createPopup();
            Event.observe(popup.div, "click",
            function() { 
              for(var i=0; i < this.layer.map.popups.length; i++) { 
                this.layer.map.removePopup(this.layer.map.popups[i]); 
              } 
            }.bindAsEventListener(this));
            this.layer.map.addPopup(popup); 
        }
        Event.stop(evt);
    },

    /**
     * 
     */
    clearFeatures: function() {
        if (this.features != null) {
            while(this.features.length > 0) {
                var feature = this.features[0];
                this.features.remove(feature);
                feature.destroy();
            }
        }        
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.GeoRSS"
});
     
    
