/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Layer/Markers.js
 * @requires OpenLayers/Ajax.js
 */

/**
 * Class: OpenLayers.Layer.Text
 * This layer creates markers given data in a text file.  The <location>
 *     property of the layer (specified as a property of the options argument
 *     in the <OpenLayers.Layer.Text> constructor) points to a tab delimited
 *     file with data used to create markers.
 *
 * The first row of the data file should be a header line with the column names
 *     of the data. Each column should be delimited by a tab space. The
 *     possible columns are:
 *      - *point* lat,lon of the point where a marker is to be placed
 *      - *lat*  Latitude of the point where a marker is to be placed
 *      - *lon*  Longitude of the point where a marker is to be placed
 *      - *iconURL* URL of marker icon to use.
 *      - *iconSize* Size of Icon to use.
 *      - *iconOffset* Where the top-left corner of the icon is to be placed
 *            relative to the latitude and longitude of the point.
 *      - *title* The text of the 'title' is placed inside an 'h2' marker
 *            inside a popup, which opens when the marker is clicked.
 *      - *description* The text of the 'description' is placed below the h2
 *            in the popup. this can be plain text or HTML.
 *
 * Example text file:
 * (code)
 * lat	lon	title	description	iconSize	iconOffset	icon
 * 10	20	title	description	21,25		-10,-25		http://www.openlayers.org/dev/img/marker.png
 * (end)
 *
 * Inherits from:
 *  - <OpenLayers.Layer.Markers>
 */
OpenLayers.Layer.Text = OpenLayers.Class(OpenLayers.Layer.Markers, {

    /**
     * APIProperty: location 
     * {String} URL of text file.  Must be specified in the "options" argument
     *   of the constructor. Can not be changed once passed in. 
     */
    location:null,

    /** 
     * Property: features
     * Array({<OpenLayers.Feature>}) 
     */
    features: null,
    
    /**
     * APIProperty: formatOptions
     * {Object} Hash of options which should be passed to the format when it is
     * created. Must be passed in the constructor.
     */
    formatOptions: null, 

    /** 
     * Property: selectedFeature
     * {<OpenLayers.Feature>}
     */
    selectedFeature: null,

    /**
     * Constructor: OpenLayers.Layer.Text
     * Create a text layer.
     * 
     * Parameters:
     * name - {String} 
     * options - {Object} Object with properties to be set on the layer.
     *     Must include <location> property.
     */
    initialize: function(name, options) {
        OpenLayers.Layer.Markers.prototype.initialize.apply(this, arguments);
        this.features = new Array();
    },

    /**
     * APIMethod: destroy 
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
     * Method: loadText
     * Start the load of the Text data. Don't do this when we first add the layer,
     * since we may not be visible at any point, and it would therefore be a waste.
     */
    loadText: function() {
        if (!this.loaded) {
            if (this.location != null) {

                var onFail = function(e) {
                    this.events.triggerEvent("loadend");
                };

                this.events.triggerEvent("loadstart");
                OpenLayers.loadURL(this.location, null, 
                                   this, this.parseData, onFail);
                this.loaded = true;
            }
        }    
    },    
    
    /**
     * Method: moveTo
     * If layer is visible and Text has not been loaded, load Text. 
     * 
     * Parameters:
     * bounds - {Object} 
     * zoomChanged - {Object} 
     * minor - {Object} 
     */
    moveTo:function(bounds, zoomChanged, minor) {
        OpenLayers.Layer.Markers.prototype.moveTo.apply(this, arguments);
        if(this.visibility && !this.loaded){
            this.events.triggerEvent("loadstart");
            this.loadText();
        }
    },
    
    /**
     * Method: parseData
     *
     * Parameters:
     * ajaxRequest - {XMLHttpRequest} 
     */
    parseData: function(ajaxRequest) {
        var text = ajaxRequest.responseText;
        
        var options = {};
        
        OpenLayers.Util.extend(options, this.formatOptions);
        
        if (this.map && !this.projection.equals(this.map.getProjectionObject())) {
            options.externalProjection = this.projection;
            options.internalProjection = this.map.getProjectionObject();
        }    
        
        var parser = new OpenLayers.Format.Text(options);
        features = parser.read(text);
        for (var i = 0; i < features.length; i++) {
            var data = {};
            var feature = features[i];
            var location;
            var iconSize, iconOffset;
            
            location = new OpenLayers.LonLat(feature.geometry.x, 
                                             feature.geometry.y);
            
            if (feature.style.graphicWidth 
                && feature.style.graphicHeight) {
                iconSize = new OpenLayers.Size(
                    feature.style.graphicWidth,
                    feature.style.graphicHeight);
            }        
            
            // FIXME: At the moment, we only use this if we have an 
            // externalGraphic, because icon has no setOffset API Method.  
            if (feature.style.graphicXOffset 
                && feature.style.graphicYOffset) {
                iconOffset = new OpenLayers.Size(
                    feature.style.graphicXOffset, 
                    feature.style.graphicYOffset);
            }
            
            if (feature.style.externalGraphic != null) {
                data.icon = new OpenLayers.Icon(feature.style.externalGraphic, 
                                                iconSize, 
                                                iconOffset);
            } else {
                data.icon = OpenLayers.Marker.defaultIcon();

                //allows for the case where the image url is not 
                // specified but the size is. use a default icon
                // but change the size
                if (iconSize != null) {
                    data.icon.setSize(iconSize);
                }
            }
            
            if ((feature.attributes.title != null) 
                && (feature.attributes.description != null)) {
                data['popupContentHTML'] = 
                    '<h2>'+feature.attributes.title+'</h2>' + 
                    '<p>'+feature.attributes.description+'</p>';
            }
            
            data['overflow'] = feature.attributes.overflow || "auto"; 
            
            var markerFeature = new OpenLayers.Feature(this, location, data);
            this.features.push(markerFeature);
            var marker = markerFeature.createMarker();
            if ((feature.attributes.title != null) 
                && (feature.attributes.description != null)) {
              marker.events.register('click', markerFeature, this.markerClick);
            }
            this.addMarker(marker);
        }
        this.events.triggerEvent("loadend");
    },
    
    /**
     * Property: markerClick
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
            this.layer.map.addPopup(this.createPopup()); 
        }
        OpenLayers.Event.stop(evt);
    },

    /**
     * Method: clearFeatures
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

    CLASS_NAME: "OpenLayers.Layer.Text"
});
