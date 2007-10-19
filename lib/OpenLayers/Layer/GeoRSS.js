/* Copyright (c) 2006-2007 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Layer/Markers.js
 * @requires OpenLayers/Ajax.js
 * 
 * Class: OpenLayers.Layer.GeoRSS
 * Add GeoRSS Point features to your map. 
 * 
 * Inherits from:
 *  - <OpenLayers.Layer.Markers>
 *  - <OpenLayers.Layer>
 */
OpenLayers.Layer.GeoRSS = OpenLayers.Class(OpenLayers.Layer.Markers, {

    /** 
     * Property: location 
     * {String} store url of text file 
     */
    location: null,

    /** 
     * Property: features 
     * Array({<OpenLayers.Feature>}) 
     */
    features: null,

    /** 
     * Property: selectedFeature 
     * {<OpenLayers.Feature>} 
     */
    selectedFeature: null,

    /** 
     * APIProperty: icon 
     * {<OpenLayers.Icon>}. This determines the Icon to be used on the map
     * for this GeoRSS layer.
     */
    icon: null,

    /**
     * APIProperty: popupSize
     * {<OpenLayers.Size>} This determines the size of GeoRSS popups. If 
     * not provided, defaults to 250px by 120px. 
     */
    popupSize: null, 
    
    /** 
     * APIProperty: useFeedTitle 
     * {Boolean} Set layer.name to the first <title> element in the feed. Default is true. 
     */
    useFeedTitle: true,
    
    /**
    * Constructor: OpenLayers.Layer.GeoRSS
    * Create a GeoRSS Layer.
    *
    * Parameters:
    * name - {String} 
    * location - {String} 
    * options - {Object}
    */
    initialize: function(name, location, options) {
        OpenLayers.Layer.Markers.prototype.initialize.apply(this, [name, options]);
        this.location = location;
        this.features = [];
        this.events.triggerEvent("loadstart");
        OpenLayers.loadURL(location, null, this, this.parseData);
    },

    /**
     * Method: destroy 
     */
    destroy: function() {
        this.clearFeatures();
        this.features = null;
        OpenLayers.Layer.Markers.prototype.destroy.apply(this, arguments);
    },
        
    /**
     * Method: parseData
     * Parse the data returned from the Events call.
     *
     * Parameters:
     * ajaxRequest - {XMLHttpRequest} 
     */
    parseData: function(ajaxRequest) {
        var doc = ajaxRequest.responseXML;
        if (!doc || ajaxRequest.fileType!="XML") {
            doc = OpenLayers.parseXMLString(ajaxRequest.responseText);
        }
        
        if (this.useFeedTitle) {
            var name = null;
            try {
                name = doc.getElementsByTagNameNS('*', 'title')[0].firstChild.nodeValue;
            }
            catch (e) {
                name = doc.getElementsByTagName('title')[0].firstChild.nodeValue;
            }
            if (name) {
                this.setName(name);
            }    
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

            /* If no link URL is found in the first child node, try the
               href attribute */
            try {
              var link = OpenLayers.Util.getNodes(itemlist[i], "link")[0].firstChild.nodeValue;
            } 
            catch (e) {
              try {
                var link = OpenLayers.Util.getNodes(itemlist[i], "link")[0].getAttribute("href");
              }
              catch (e) {}
            }

            data.icon = this.icon == null ? 
                                     OpenLayers.Marker.defaultIcon() : 
                                     this.icon.clone();
            
            data.popupSize = this.popupSize ? this.popupSize.clone() : new OpenLayers.Size(250, 120);
            if ((title != null) && (description != null)) {
                var contentHTML = '<div class="olLayerGeoRSSClose">[x]</div>'; 
                contentHTML += '<div class="olLayerGeoRSSTitle">';
                if (link) {
                    contentHTML += '<a class="link" href="'+link+'" target="_blank">';
                }
                contentHTML += title;
                if (link) {
                    contentHTML += '</a>';
                }
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
        this.events.triggerEvent("loadend");
    },
    
    /**
     * Method: markerClick
     *
     * Parameters:
     * evt - {Event} 
     */
    markerClick: function(evt) {
        var sameMarkerClicked = (this == this.layer.selectedFeature);
        this.layer.selectedFeature = (!sameMarkerClicked) ? this : null;
        for(var i=0; i < this.layer.map.popups.length; i++) {
            this.layer.map.removePopup(this.layer.map.popups[i]);
        }
        if (!sameMarkerClicked) {
            var popup = this.createPopup();
            OpenLayers.Event.observe(popup.div, "click",
                OpenLayers.Function.bind(function() { 
                    for(var i=0; i < this.layer.map.popups.length; i++) { 
                        this.layer.map.removePopup(this.layer.map.popups[i]); 
                    }
                }, this)
            );
            this.layer.map.addPopup(popup); 
        }
        OpenLayers.Event.stop(evt);
    },

    /**
     * Method: clearFeatures
     * Destroy all features in this layer.
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
