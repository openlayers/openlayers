goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.Point');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


// Create separate layers for red, green an blue circles.
//
// Every layer has one feature that is styled with a circle, together the
// features form the corners of an equilateral triangle and their styles overlap
var redLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: [new ol.Feature(new ol.geom.Point([0, 0]))]
  }),
  style: new ol.style.Style({
    image: new ol.style.Circle({
      fill: new ol.style.Fill({
        color: 'rgba(255,0,0,0.8)'
      }),
      stroke: new ol.style.Stroke({
        color: 'rgb(255,0,0)',
        width: 15
      }),
      radius: 120
    })
  })
});
var greenLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    // 433.013 is roughly 250 * Math.sqrt(3)
    features: [new ol.Feature(new ol.geom.Point([250, 433.013]))]
  }),
  style: new ol.style.Style({
    image: new ol.style.Circle({
      fill: new ol.style.Fill({
        color: 'rgba(0,255,0,0.8)'
      }),
      stroke: new ol.style.Stroke({
        color: 'rgb(0,255,0)',
        width: 15
      }),
      radius: 120
    })
  })
});
var blueLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: [new ol.Feature(new ol.geom.Point([500, 0]))]
  }),
  style: new ol.style.Style({
    image: new ol.style.Circle({
      fill: new ol.style.Fill({
        color: 'rgba(0,0,255,0.8)'
      }),
      stroke: new ol.style.Stroke({
        color: 'rgb(0,0,255)',
        width: 15
      }),
      radius: 120
    })
  })
});

// Create the map, the view is centered on the triangle. Zooming and panning is
// restricted to a sane area
var map = new ol.Map({
  layers: [
    redLayer,
    greenLayer,
    blueLayer
  ],
  target: 'map',
  view: new ol.View({
    center: [250, 220],
    extent: [0, 0, 500, 500],
    resolution: 4,
    minResolution: 2,
    maxResolution: 32
  })
});

// Get the form elements and bind the listeners
var select = document.getElementById('blend-mode');
var affectRed = document.getElementById('affect-red');
var affectGreen = document.getElementById('affect-green');
var affectBlue = document.getElementById('affect-blue');


/**
 * This method sets the globalCompositeOperation to the value of the select
 * field and it is bound to the precompose event of the layers.
 *
 * @param {ol.render.Event} evt The render event.
 */
var setBlendModeFromSelect = function(evt) {
  evt.context.globalCompositeOperation = select.value;
};


/**
 * This method resets the globalCompositeOperation to the default value of
 * 'source-over' and it is bound to the postcompose event of the layers.
 *
 * @param {ol.render.Event} evt The render event.
 */
var resetBlendModeFromSelect = function(evt) {
  evt.context.globalCompositeOperation = 'source-over';
};


/**
 * Bind the pre- and postcompose handlers to the passed layer.
 *
 * @param {ol.layer.Vector} layer The layer to bind the handlers to.
 */
var bindLayerListeners = function(layer) {
  layer.on('precompose', setBlendModeFromSelect);
  layer.on('postcompose', resetBlendModeFromSelect);
};


/**
 * Unind the pre- and postcompose handlers to the passed layers.
 *
 * @param {ol.layer.Vector} layer The layer to unbind the handlers from.
 */
var unbindLayerListeners = function(layer) {
  layer.un('precompose', setBlendModeFromSelect);
  layer.un('postcompose', resetBlendModeFromSelect);
};


/**
 * Handler for the click event of the 'affect-XXX' checkboxes.
 *
 * @this {HTMLInputElement}
 */
var affectLayerClicked = function() {
  var layer;
  if (this.id == 'affect-red') {
    layer = redLayer;
  } else if (this.id == 'affect-green') {
    layer = greenLayer;
  } else {
    layer = blueLayer;
  }
  if (this.checked) {
    bindLayerListeners(layer);
  } else {
    unbindLayerListeners(layer);
  }
  map.render();
};


// Rerender map when blend mode changes
select.addEventListener('change', function() {
  map.render();
});

// Unbind / bind listeners depending on the checked state when the checkboxes
// are clicked
affectRed.addEventListener('click', affectLayerClicked);
affectGreen.addEventListener('click', affectLayerClicked);
affectBlue.addEventListener('click', affectLayerClicked);

// Initially bind listeners
bindLayerListeners(redLayer);
bindLayerListeners(greenLayer);
bindLayerListeners(blueLayer);
