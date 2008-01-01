/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Layer/Markers.js
 * @requires OpenLayers/Ajax.js
 */

/**
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
        // Warning: Layer.Markers.destroy() must be called prior to calling
        // clearFeatures() here, otherwise we leak memory. Indeed, if
        // Layer.Markers.destroy() is called after clearFeatures(), it won't be
        // able to remove the marker image elements from the layer's div since
        // the markers will have been destroyed by clearFeatures().
        OpenLayers.Layer.Markers.prototype.destroy.apply(this, arguments);
        this.clearFeatures();
        this.features = null;
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
       
        var format = new OpenLayers.Format.GeoRSS();
        var features = format.read(doc);
        
        for (var i = 0; i < features.length; i++) {
            var data = {};
            var feature = features[i];
            var title = feature.attributes.title ? 
                         feature.attributes.title : "Untitled";
            
            var description = feature.attributes.description ? 
                         feature.attributes.description : "No description.";
            
            var link = feature.attributes.link ? feature.attributes.link : "";

            var location = feature.geometry.getBounds().getCenterLonLat();
            
            
            data.icon = this.icon == null ? 
                                     OpenLayers.Marker.defaultIcon() : 
                                     this.icon.clone();
            
            data.popupSize = this.popupSize ? 
                             this.popupSize.clone() :
                             new OpenLayers.Size(250, 120);
            
            if (title || description) {
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
    
    CLASS_NAME: "OpenLayers.Layer.GeoRSS"
});
