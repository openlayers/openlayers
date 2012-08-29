goog.provide('ol3.layer.MapQuestOSM');
goog.provide('ol3.layer.MapQuestOpenAerial');

goog.require('ol3.Attribution');
goog.require('ol3.TileUrlFunction');
goog.require('ol3.layer.XYZ');



/**
 * @constructor
 * @extends {ol3.layer.XYZ}
 * @param {Object.<string, *>=} opt_values Values.
 */
ol3.layer.MapQuestOSM = function(opt_values) {

  var tileUrlFunction = ol3.TileUrlFunction.createFromTemplate(
      'http://otile{1-4}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg');

  var attributions = [
    new ol3.Attribution(
        'Tiles Courtesy of ' +
        '<a href="http://www.mapquest.com/" target="_blank">MapQuest</a> ' +
        '<img src="http://developer.mapquest.com/content/osm/mq_logo.png">'),
    new ol3.Attribution(
        'Data &copy; ' +
        '<a href="http://www.openstreetmap.org">OpenStreetMap</a> ' +
        'contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA</a>')
  ];

  goog.base(this, 18, tileUrlFunction, attributions);

};
goog.inherits(ol3.layer.MapQuestOSM, ol3.layer.XYZ);



/**
 * @constructor
 * @extends {ol3.layer.XYZ}
 * @param {Object.<string, *>=} opt_values Values.
 */
ol3.layer.MapQuestOpenAerial = function(opt_values) {

  var tileUrlFunction = ol3.TileUrlFunction.createFromTemplate(
      'http://oatile{1-4}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg');

  var attributions = [
    new ol3.Attribution(
        'Tiles Courtesy of ' +
        '<a href="http://www.mapquest.com/" target="_blank">MapQuest</a> ' +
        '<img src="http://developer.mapquest.com/content/osm/mq_logo.png">'),
    new ol3.Attribution(
        'Portions Courtesy NASA/JPL-Caltech and ' +
        'U.S. Depart. of Agriculture, Farm Service Agency')
  ];

  goog.base(this, 18, tileUrlFunction, attributions);

};
goog.inherits(ol3.layer.MapQuestOpenAerial, ol3.layer.XYZ);
