/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @requires OpenLayers/Layer/Markers.js
 *
 * Class: OpenLayers.Layer.Text
 * Tab seperated values file parsing code which creates a markers layer.  
 *
 * Inherits from;
 *  - <OpenLayers.Layer.Markers>
 */
OpenLayers.Layer.Text = OpenLayers.Class.create();
OpenLayers.Layer.Text.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Layer.Markers, {

    /**
     * APIProperty: location 
     * {String} store url of text file - this should be specified in the 
     *   "options" hashtable. Can not be changed once passed in. 
     */
    location:null,

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
    * Constructor: OpenLayers.Layer.Text
    * Create a text layer.
    * 
    * Parameters:
    * name - {String} 
    * options - {Object} Hashtable of extra options to tag onto
    *                    the layer. Must include "location" property.
    */
    initialize: function(name, options) {
        OpenLayers.Layer.Markers.prototype.initialize.apply(this, arguments);
        this.features = new Array();
        if (this.location != null) {
            OpenLayers.loadURL(this.location, null, this, this.parseData);
        }
    },

   /**
     * APIMethod: destroy 
     */
    destroy: function() {
        this.clearFeatures();
        this.features = null;
        OpenLayers.Layer.Markers.prototype.destroy.apply(this, arguments);
    },
    
    
    /**
     * Method: parseData
     *
     * Parameters:
     * ajaxRequest - {XMLHttpRequest} 
     */
    parseData: function(ajaxRequest) {
        var text = ajaxRequest.responseText;
        var lines = text.split('\n');
        var columns;
        // length - 1 to allow for trailing new line
        for (var lcv = 0; lcv < (lines.length - 1); lcv++) {
            var currLine = lines[lcv].replace(/^\s*/,'').replace(/\s*$/,'');
        
            if (currLine.charAt(0) != '#') { /* not a comment */
            
                if (!columns) {
                    //First line is columns
                    columns = currLine.split('\t');
                } else {
                    var vals = currLine.split('\t');
                    var location = new OpenLayers.LonLat(0,0);
                    var title; var url;
                    var icon, iconSize, iconOffset;
                    var set = false;
                    for (var valIndex = 0; valIndex < vals.length; valIndex++) {
                        if (vals[valIndex]) {
                            if (columns[valIndex] == 'point') {
                                var coords = vals[valIndex].split(',');
                                location.lat = parseFloat(coords[0]);
                                location.lon = parseFloat(coords[1]);
                                set = true;
                            } else if (columns[valIndex] == 'lat') {
                                location.lat = parseFloat(vals[valIndex]);
                                set = true;
                            } else if (columns[valIndex] == 'lon') {
                                location.lon = parseFloat(vals[valIndex]);
                                set = true;
                            } else if (columns[valIndex] == 'title')
                                title = vals[valIndex];
                            else if (columns[valIndex] == 'image' ||
                                     columns[valIndex] == 'icon')
                                url = vals[valIndex];
                            else if (columns[valIndex] == 'iconSize') {
                                var size = vals[valIndex].split(',');
                                iconSize = new OpenLayers.Size(parseFloat(size[0]),
                                                           parseFloat(size[1]));
                            } else if (columns[valIndex] == 'iconOffset') {
                                var offset = vals[valIndex].split(',');
                                iconOffset = new OpenLayers.Pixel(parseFloat(offset[0]),
                                                           parseFloat(offset[1]));
                            } else if (columns[valIndex] == 'title') {
                                title = vals[valIndex];
                            } else if (columns[valIndex] == 'description') {
                                description = vals[valIndex];
                            }
                        }
                    }
                    if (set) {
                      var data = new Object();
                      if (url != null) {
                          data.icon = new OpenLayers.Icon(url, 
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
                      if ((title != null) && (description != null)) {
                          data['popupContentHTML'] = '<h2>'+title+'</h2><p>'+description+'</p>';
                      }
                      var feature = new OpenLayers.Feature(this, location, data);
                      this.features.push(feature);
                      var marker = feature.createMarker();
                      if ((title != null) && (description != null)) {
                        marker.events.register('click', feature, this.markerClick);
                      }
                      this.addMarker(marker);
                    }
                }
            }
        }
    },
    
    /**
     * Property: markerClick
     * 
     * Parameters:
     * evt - {Event} 
     */
    markerClick: function(evt) {
        sameMarkerClicked = (this == this.layer.selectedFeature);
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
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.Text"
});
     
    
