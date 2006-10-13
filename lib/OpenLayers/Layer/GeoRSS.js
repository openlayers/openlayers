/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/**
 * @class
 * 
 * @requires OpenLayers/Layer/Markers.js
 */
OpenLayers.Layer.GeoRSS = OpenLayers.Class.create();
OpenLayers.Layer.GeoRSS.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Layer.Markers, {

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
        
    /**
     * @param {?} ajaxRequest
     */
    parseData: function(ajaxRequest) {
        var doc = ajaxRequest.responseXML;
        if (!doc || ajaxRequest.fileType!="XML") {
            doc = OpenLayers.parseXMLString(ajaxRequest.responseText);
        }
        
        this.name = null;
        try {
            this.name = doc.getElementsByTagNameNS('*', 'title')[0].firstChild.nodeValue;
        }
        catch (e) {
            this.name = doc.getElementsByTagName('title')[0].firstChild.nodeValue;
        }
       
        /* Try RSS items first, then Atom entries */
        var itemlist = null;
        try {
            itemlist = doc.getElementsByTagNameNS('*', 'item');
        }
        catch (e) {
            itemlist = doc.getElementsByTagName('item');
        }

        if (itemlist.length == 0) {
            try {
                itemlist = doc.getElementsByTagNameNS('*', 'entry');
            }
            catch(e) {
                itemlist = doc.getElementsByTagName('entry');
            }
        }

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
            
            /* Provide defaults for title and description */
            var title = "Untitled";
            try {
              title = OpenLayers.Util.getNodes(itemlist[i], 
                        "title")[0].firstChild.nodeValue;
            }
            catch (e) { title="Untitled"; }
           
            /* First try RSS descriptions, then Atom summaries */
            var descr_nodes = null;
            try {
                descr_nodes = itemlist[i].getElementsByTagNameNS("*",
                                                "description");
            }
            catch (e) {
                descr_nodes = itemlist[i].getElementsByTagName("description");
            }
            if (descr_nodes.length == 0) {
                try {
                    descr_nodes = itemlist[i].getElementsByTagNameNS("*",
                                                "summary");
                }
                catch (e) {
                    descr_nodes = itemlist[i].getElementsByTagName("summary");
                }
            }

            var description = "No description.";
            try {
              description = descr_nodes[0].firstChild.nodeValue;
            }
            catch (e) { description="No description."; }

            try { var link = OpenLayers.Util.getNodes(itemlist[i], "link")[0].firstChild.nodeValue; } catch (e) { } 
            data.icon = OpenLayers.Marker.defaultIcon();
            data.popupSize = new OpenLayers.Size(250, 120);
            if ((title != null) && (description != null)) {
                contentHTML = '<div class="olLayerGeoRSSClose">[x]</div>'; 
                contentHTML += '<div class="olLayerGeoRSSTitle">';
                if (link) contentHTML += '<a class="link" href="'+link+'" target="_blank">';
                contentHTML += title;
                if (link) contentHTML += '</a>';
                contentHTML += '</div>';
                contentHTML += '<div style="" class="olLayerGeoRSSDescription">';
                contentHTML += description;
                contentHTML += '</div>';
                data['popupContentHTML'] = contentHTML;                
            }
            var feature = new OpenLayers.Feature(this, location, data);
            this.features.push(feature);
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
            OpenLayers.Event.observe(popup.div, "click",
            function() { 
              for(var i=0; i < this.layer.map.popups.length; i++) { 
                this.layer.map.removePopup(this.layer.map.popups[i]); 
              } 
            }.bindAsEventListener(this));
            this.layer.map.addPopup(popup); 
        }
        OpenLayers.Event.stop(evt);
    },

    /**
     * 
     */
    clearFeatures: function() {
        if (this.features != null) {
            while(this.features.length > 0) {
                var feature = this.features[0];
                OpenLayers.Util.removeItem(this.features, feature);
                feature.destroy();
            }
        }        
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.GeoRSS"
});
     
    
