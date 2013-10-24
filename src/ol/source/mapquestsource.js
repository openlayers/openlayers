goog.provide('ol.source.MapQuestOSM');
goog.provide('ol.source.MapQuestOpenAerial');

goog.require('ol.Attribution');
goog.require('ol.source.OSM');
goog.require('ol.source.XYZ');



/**
 * @constructor
 * @extends {ol.source.XYZ}
 * @param {ol.source.MapQuestOptions=} opt_options MapQuest options.
 * @todo stability experimental
 */
ol.source.MapQuestOSM = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var attributions = [
    new ol.Attribution({
      html: 'Tiles Courtesy of ' +
          '<a href="http://www.mapquest.com/" target="_blank">MapQuest</a>'
    }),
    ol.source.OSM.DATA_ATTRIBUTION
  ];

  goog.base(this, {
    attributions: attributions,
    crossOrigin: 'anonymous',
    logo: 'http://developer.mapquest.com/content/osm/mq_logo.png',
    opaque: true,
    maxZoom: 28,
    tileLoadFunction: options.tileLoadFunction,
    url: 'http://otile{1-4}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg'
  });

};
goog.inherits(ol.source.MapQuestOSM, ol.source.XYZ);



/**
 * @constructor
 * @extends {ol.source.XYZ}
 * @param {ol.source.MapQuestOptions=} opt_options MapQuest options.
 * @todo stability experimental
 */
ol.source.MapQuestOpenAerial = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var attributions = [
    new ol.Attribution({
      html: 'Tiles Courtesy of ' +
          '<a href="http://www.mapquest.com/" target="_blank">MapQuest</a>'
    }),
    new ol.Attribution({
      html: 'Portions Courtesy NASA/JPL-Caltech and ' +
          'U.S. Depart. of Agriculture, Farm Service Agency'
    })
  ];

  goog.base(this, {
    attributions: attributions,
    crossOrigin: 'anonymous',
    logo: 'http://developer.mapquest.com/content/osm/mq_logo.png',
    maxZoom: 18,
    opaque: true,
    tileLoadFunction: options.tileLoadFunction,
    url: 'http://oatile{1-4}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg'
  });

};
goog.inherits(ol.source.MapQuestOpenAerial, ol.source.XYZ);
