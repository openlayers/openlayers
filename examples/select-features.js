goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.events.condition');
goog.require('ol.format.GeoJSON');
goog.require('ol.interaction.Select');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');

var raster = new ol.layer.Tile({
  source: new ol.source.OSM()
});

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'data/geojson/countries.geojson',
    format: new ol.format.GeoJSON()
  })
});

var map = new ol.Map({
  layers: [raster, vector],
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});

var select = null;  // ref to currently selected interaction

// select interaction working on "singleclick"
var selectSingleClick = new ol.interaction.Select({
  multi: true // multi is used in this example if hitTolerance > 0
});

// select interaction working on "click"
var selectClick = new ol.interaction.Select({
  condition: ol.events.condition.click,
  multi: true
});

// select interaction working on "pointermove"
var selectPointerMove = new ol.interaction.Select({
  condition: ol.events.condition.pointerMove,
  multi: true
});

var selectAltClick = new ol.interaction.Select({
  condition: function(mapBrowserEvent) {
    return ol.events.condition.click(mapBrowserEvent) &&
        ol.events.condition.altKeyOnly(mapBrowserEvent);
  },
  multi: true
});

var selectElement = document.getElementById('type');

var changeInteraction = function() {
  if (select !== null) {
    map.removeInteraction(select);
  }
  var value = selectElement.value;
  if (value == 'singleclick') {
    select = selectSingleClick;
  } else if (value == 'click') {
    select = selectClick;
  } else if (value == 'pointermove') {
    select = selectPointerMove;
  } else if (value == 'altclick') {
    select = selectAltClick;
  } else {
    select = null;
  }
  if (select !== null) {
    map.addInteraction(select);
    select.on('select', function(e) {
      document.getElementById('status').innerHTML = '&nbsp;' +
          e.target.getFeatures().getLength() +
          ' selected features (last operation selected ' + e.selected.length +
          ' and deselected ' + e.deselected.length + ' features)';
    });
  }
};


/**
 * onchange callback on the select element.
 */
selectElement.onchange = changeInteraction;
changeInteraction();

var selectHitToleranceElement = document.getElementById('hitTolerance');
var circleCanvas = document.getElementById('circle');

var changeHitTolerance = function() {
  var value = parseInt(selectHitToleranceElement.value, 10);
  selectSingleClick.setHitTolerance(value);
  selectClick.setHitTolerance(value);
  selectPointerMove.setHitTolerance(value);
  selectAltClick.setHitTolerance(value);

  var size = 2 * value + 2;
  circleCanvas.width = size;
  circleCanvas.height = size;
  var ctx = circleCanvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(value + 1, value + 1, value + 0.5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
};

selectHitToleranceElement.onchange = changeHitTolerance;
changeHitTolerance();
