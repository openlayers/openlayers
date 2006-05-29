// @require: OpenLayers/Layer/Markers.js
/**
* @class
*/
OpenLayers.Layer.Text = Class.create();
OpenLayers.Layer.Text.prototype = 
  Object.extend( new OpenLayers.Layer.Markers(), {

    /** store url of text file
    * @type str */
    location:null,

    /** @type OpenLayers.Feature */
    selectedFeature: null,

    /**
    * @constructor
    *
    * @param {String} name
    */
    initialize: function(name, location) {
        OpenLayers.Layer.Markers.prototype.initialize.apply(this, [name]);
        this.location = location;
        new Ajax.Request(location, 
          { method: 'get', onComplete:this.parseData.bind(this) } );
    },
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
    }
});
     
    
