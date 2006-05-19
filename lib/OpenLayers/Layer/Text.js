/**
* @class
*/
OpenLayers.Layer.Text = Class.create();
OpenLayers.Layer.Text.prototype = 
  Object.extend( new OpenLayers.Layer.Marker(), {

    /** store url of text file
    * @type str */
    location:null,
    /**
    * @constructor
    *
    * @param {String} name
    */
    initialize: function(name, location) {
        OpenLayers.Layer.Marker.prototype.initialize.apply(this, [name]);
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
                  var name = ""; var description = "";
                  var icon = new OpenLayers.Icon('http://boston.openguides.org/markers/AQUA.png',new OpenLayers.Size(10,17));
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
                          } else if (columns[valIndex] == 'locationName')
                              name = vals[valIndex];
                          else if (columns[valIndex] == 'image')
                              icon.url = vals[valIndex];
                          else if (columns[valIndex] == 'title')
                              location.title = vals[valIndex];
                          else if (columns[valIndex] == 'description')
                              location.description = vals[valIndex];
                      }
                  }
                  if (set) {
                    this.addMarker(new OpenLayers.Marker(icon, location));
                  }
              }
          }
        }
    }
});
     
    
