goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Polygon');
goog.require('ol.interaction');
goog.require('ol.interaction.Draw');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.MapQuest');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');

var raster = new ol.layer.Tile({
  source: new ol.source.MapQuest({layer: 'sat'})
});

var source = new ol.source.Vector();

var vector = new ol.layer.Vector({
  source: source,
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 0.2)'
    }),
    stroke: new ol.style.Stroke({
      color: '#ffcc33',
      width: 2
    }),
    image: new ol.style.Circle({
      radius: 7,
      fill: new ol.style.Fill({
        color: '#ffcc33'
      })
    })
  })
});


/**
 * Currently drawed feature
 * @type {ol.Feature}
 */
var sketch;


/**
 * Element for currently drawed feature
 * @type {Element}
 */
var sketchElement;


/**
 * handle pointer move
 * @param {Event} evt
 */
var mouseMoveHandler = function(evt) {
  if (sketch) {
    var output;
    var geom = (sketch.getGeometry());
    if (geom instanceof ol.geom.Polygon) {
      output = formatArea(/** @type {ol.geom.Polygon} */ (geom));

    } else if (geom instanceof ol.geom.LineString) {
      output = formatLength( /** @type {ol.geom.LineString} */ (geom));
    }
    sketchElement.innerHTML = output;
  }
};


var map = new ol.Map({
  layers: [raster, vector],
  target: 'map',
  view: new ol.View({
    center: [-11000000, 4600000],
    zoom: 15
  })
});

$(map.getViewport()).on('mousemove', mouseMoveHandler);

var typeSelect = document.getElementById('type');

var draw; // global so we can remove it later
function addInteraction() {
  var type = (typeSelect.value == 'area' ? 'Polygon' : 'LineString');
  draw = new ol.interaction.Draw({
    source: source,
    type: /** @type {ol.geom.GeometryType} */ (type)
  });
  map.addInteraction(draw);

  draw.on('drawstart',
      function(evt) {
        // set sketch
        sketch = evt.feature;
        sketchElement = document.createElement('li');
        var outputList = document.getElementById('measureOutput');

        if (outputList.childNodes) {
          outputList.insertBefore(sketchElement, outputList.firstChild);
        } else {
          outputList.appendChild(sketchElement);
        }
      }, this);

  draw.on('drawend',
      function(evt) {
        // unset sketch
        sketch = null;
        sketchElement = null;
      }, this);
}


/**
 * Let user change the geometry type.
 * @param {Event} e Change event.
 */
typeSelect.onchange = function(e) {
  map.removeInteraction(draw);
  addInteraction();
};


/**
 * format length output
 * @param {ol.geom.LineString} line
 * @return {string}
 */
var formatLength = function(line) {
  var length = Math.round(line.getLength() * 100) / 100;
  var output;
  if (length > 100) {
    output = (Math.round(length / 1000 * 100) / 100) +
        ' ' + 'km';
  } else {
    output = (Math.round(length * 100) / 100) +
        ' ' + 'm';
  }
  return output;
};


/**
 * format length output
 * @param {ol.geom.Polygon} polygon
 * @return {string}
 */
var formatArea = function(polygon) {
  var area = polygon.getArea();
  var output;
  if (area > 10000) {
    output = (Math.round(area / 1000000 * 100) / 100) +
        ' ' + 'km<sup>2</sup>';
  } else {
    output = (Math.round(area * 100) / 100) +
        ' ' + 'm<sup>2</sup>';
  }
  return output;
};

addInteraction();
