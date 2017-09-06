// NOCOMPILE
import _ol_Feature_ from '../src/ol/feature';
import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_geom_LineString_ from '../src/ol/geom/linestring';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_proj_ from '../src/ol/proj';
import _ol_source_Stamen_ from '../src/ol/source/stamen';
import _ol_source_Vector_ from '../src/ol/source/vector';
import _ol_style_Stroke_ from '../src/ol/style/stroke';
import _ol_style_Style_ from '../src/ol/style/style';

var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_Stamen_({
        layer: 'toner'
      })
    })
  ],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  })
});

var style = new _ol_style_Style_({
  stroke: new _ol_style_Stroke_({
    color: '#EAE911',
    width: 2
  })
});

var flightsSource;
var addLater = function(feature, timeout) {
  window.setTimeout(function() {
    feature.set('start', new Date().getTime());
    flightsSource.addFeature(feature);
  }, timeout);
};

var pointsPerMs = 0.1;
var animateFlights = function(event) {
  var vectorContext = event.vectorContext;
  var frameState = event.frameState;
  vectorContext.setStyle(style);

  var features = flightsSource.getFeatures();
  for (var i = 0; i < features.length; i++) {
    var feature = features[i];
    if (!feature.get('finished')) {
      // only draw the lines for which the animation has not finished yet
      var coords = feature.getGeometry().getCoordinates();
      var elapsedTime = frameState.time - feature.get('start');
      var elapsedPoints = elapsedTime * pointsPerMs;

      if (elapsedPoints >= coords.length) {
        feature.set('finished', true);
      }

      var maxIndex = Math.min(elapsedPoints, coords.length);
      var currentLine = new _ol_geom_LineString_(coords.slice(0, maxIndex));

      // directly draw the line with the vector context
      vectorContext.drawGeometry(currentLine);
    }
  }
  // tell OpenLayers to continue the animation
  map.render();
};

flightsSource = new _ol_source_Vector_({
  wrapX: false,
  attributions: 'Flight data by ' +
        '<a href="http://openflights.org/data.html">OpenFlights</a>,',
  loader: function() {
    var url = 'data/openflights/flights.json';
    fetch(url).then(function(response) {
      return response.json();
    }).then(function(json) {
      var flightsData = json.flights;
      for (var i = 0; i < flightsData.length; i++) {
        var flight = flightsData[i];
        var from = flight[0];
        var to = flight[1];

        // create an arc circle between the two locations
        var arcGenerator = new arc.GreatCircle(
            {x: from[1], y: from[0]},
            {x: to[1], y: to[0]});

        var arcLine = arcGenerator.Arc(100, {offset: 10});
        if (arcLine.geometries.length === 1) {
          var line = new _ol_geom_LineString_(arcLine.geometries[0].coords);
          line.transform(_ol_proj_.get('EPSG:4326'), _ol_proj_.get('EPSG:3857'));

          var feature = new _ol_Feature_({
            geometry: line,
            finished: false
          });
          // add the feature with a delay so that the animation
          // for all features does not start at the same time
          addLater(feature, i * 50);
        }
      }
      map.on('postcompose', animateFlights);
    });
  }
});

var flightsLayer = new _ol_layer_Vector_({
  source: flightsSource,
  style: function(feature) {
    // if the animation is still active for a feature, do not
    // render the feature with the layer style
    if (feature.get('finished')) {
      return style;
    } else {
      return null;
    }
  }
});
map.addLayer(flightsLayer);
