goog.provide('ol.source.MapQuestOSM');
goog.provide('ol.source.MapQuestOpenAerial');

goog.require('ol.Attribution');
goog.require('ol.source.OSM');
goog.require('ol.source.XYZ');



/**
 * @constructor
 * @extends {ol.source.XYZ}
 */
ol.source.MapQuestOSM = function() {

  var attributions = [
    new ol.Attribution(
        'Tiles Courtesy of ' +
        '<a href="http://www.mapquest.com/" target="_blank">MapQuest</a>'),
    ol.source.OSM.DATA_ATTRIBUTION
  ];

  goog.base(this, {
    attributions: attributions,
    crossOrigin: 'anonymous',
    logo: 'http://developer.mapquest.com/content/osm/mq_logo.png',
    opaque: true,
    maxZoom: 28,
    url: 'http://otile{1-4}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg'
  });

};
goog.inherits(ol.source.MapQuestOSM, ol.source.XYZ);



/**
 * @constructor
 * @extends {ol.source.XYZ}
 */
ol.source.MapQuestOpenAerial = function() {

  var attributions = [
    new ol.Attribution(
        'Tiles Courtesy of ' +
        '<a href="http://www.mapquest.com/" target="_blank">MapQuest</a>'),
    new ol.Attribution(
        'Portions Courtesy NASA/JPL-Caltech and ' +
        'U.S. Depart. of Agriculture, Farm Service Agency')
  ];

  goog.base(this, {
    attributions: attributions,
    crossOrigin: 'anonymous',
    logo: 'http://developer.mapquest.com/content/osm/mq_logo.png',
    maxZoom: 18,
    opaque: true,
    url: 'http://oatile{1-4}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg'
  });

};
goog.inherits(ol.source.MapQuestOpenAerial, ol.source.XYZ);
