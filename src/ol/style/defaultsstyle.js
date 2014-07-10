goog.provide('ol.style.defaults');

goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


/**
 * @param {ol.Feature} feature Feature.
 * @param {number} resolution Resolution.
 * @return {Array.<ol.style.Style>} Style.
 */
ol.style.defaults.styleFunction = function(feature, resolution) {
  var fill = new ol.style.Fill({
    color: 'rgba(255,255,255,0.4)'
  });
  var stroke = new ol.style.Stroke({
    color: '#3399CC',
    width: 1.25
  });
  var styles = [
    new ol.style.Style({
      image: new ol.style.Circle({
        fill: fill,
        stroke: stroke,
        radius: 5
      }),
      fill: fill,
      stroke: stroke
    })
  ];

  // now that we've run it the first time,
  // replace the function with a constant version
  ol.style.defaults.styleFunction =
      /** @type {function(this:ol.Feature):Array.<ol.style.Style>} */(
      function(resolution) {
        return styles;
      });

  return styles;
};
