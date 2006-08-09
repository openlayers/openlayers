/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */
// @require: OpenLayers/Layer/Markers.js

/**
* @class
*/
OpenLayers.Layer.Text = Class.create();
OpenLayers.Layer.Text.prototype = 
  Object.extend( new OpenLayers.Layer.Markers(), {

    /** Text layer is never a base layer. 
     * 
     * @type Boolean
     */
    isBaseLayer: false,
    
    /** store url of text file - this should be specified in the 
     *   "options" hashtable
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
    * @param {Object} options Hashtable of extra options to tag onto the layer
    */
    initialize: function(name, options) {
        OpenLayers.Layer.Markers.prototype.initialize.apply(this, arguments);
        this.features = new Array();
        if (this.location != null) {
            OpenLayers.loadURL(this.location, null, this, this.parseData);
        }
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
                      marker.events.register('click', feature, this.markerClick);
                      this.addMarker(marker);
                    }
                }
            }
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
            this.layer.map.addPopup(this.createPopup()); 
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
    CLASS_NAME: "OpenLayers.Text"
});
     
    
