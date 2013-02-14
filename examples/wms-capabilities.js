goog.require('goog.debug.Console');
goog.require('goog.debug.DivConsole');
goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');
goog.require('goog.json.Serializer');
goog.require('goog.net.XhrIo');
goog.require('ol.parser.ogc.WMSCapabilities');


if (goog.DEBUG) {
  goog.debug.Console.autoInstall();
  goog.debug.Logger.getLogger('ol').setLevel(goog.debug.Logger.Level.INFO);
  var logconsole = new goog.debug.DivConsole(goog.dom.getElement('log'));
  logconsole.setCapturing(true);
}

var parser = new ol.parser.ogc.WMSCapabilities(), result;
var url = '../test/spec/ol/parser/ogc/xml/wmscapabilities_v1_3_0/ogcsample.xml';
goog.net.XhrIo.send(url, function(e) {
  var xhr = e.target;
  result = parser.read(xhr.getResponseXml());
  if (goog.DEBUG) {
    var output = new goog.json.Serializer().serialize(result);
    goog.debug.Logger.getLogger('ol').info(output);
  }
});
