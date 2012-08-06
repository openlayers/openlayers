goog.provide('ol.layer.MapQuestOSM');
goog.provide('ol.layer.MapQuestOpenAerial');

goog.require('ol.Attribution');
goog.require('ol.TileUrlFunction');
goog.require('ol.layer.XYZ');



/**
 * @constructor
 * @extends {ol.layer.XYZ}
 * @param {Object.<string, *>=} opt_values Values.
 */
ol.layer.MapQuestOSM = function(opt_values) {

  var tileUrlFunction = ol.TileUrlFunction.createFromTemplate(
      'http://otile{1-4}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg');

  var attributions = [
    new ol.Attribution(
        'Tiles Courtesy of ' +
        '<a href="http://www.mapquest.com/" target="_blank">MapQuest</a> ' +
        '<img src="http://developer.mapquest.com/content/osm/mq_logo.png">'),
    new ol.Attribution(
        'Data &copy; ' +
        '<a href="http://www.openstreetmap.org">OpenStreetMap</a> ' +
        'contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA</a>')
  ];

  goog.base(this, 18, tileUrlFunction, attributions);

};
goog.inherits(ol.layer.MapQuestOSM, ol.layer.XYZ);



/**
 * @constructor
 * @extends {ol.layer.XYZ}
 * @param {Object.<string, *>=} opt_values Values.
 */
ol.layer.MapQuestOpenAerial = function(opt_values) {

  var tileUrlFunction = ol.TileUrlFunction.createFromTemplate(
      'http://oatile{1-4}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg');

  var attributions = [
    new ol.Attribution(
        'Tiles Courtesy of ' +
        '<a href="http://www.mapquest.com/" target="_blank">MapQuest</a> ' +
        '<img src="http://developer.mapquest.com/content/osm/mq_logo.png">'),
    new ol.Attribution(
        'Portions Courtesy NASA/JPL-Caltech and ' +
        'U.S. Depart. of Agriculture, Farm Service Agency')
  ];

  goog.base(this, 18, tileUrlFunction, attributions);

};
goog.inherits(ol.layer.MapQuestOpenAerial, ol.layer.XYZ);
