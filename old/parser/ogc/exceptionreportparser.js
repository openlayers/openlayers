goog.provide('ol.parser.ogc.ExceptionReport');
goog.require('goog.dom.xml');
goog.require('ol.parser.XML');



/**
 * @constructor
 * @extends {ol.parser.XML}
 */
ol.parser.ogc.ExceptionReport = function() {
  var exceptionReader = function(node, exceptionReport) {
    var exception = {
      code: node.getAttribute('exceptionCode'),
      locator: node.getAttribute('locator'),
      texts: []
    };
    exceptionReport.exceptions.push(exception);
    this.readChildNodes(node, exception);
  };
  var exceptionTextReader = function(node, exception) {
    var text = this.getChildValue(node);
    exception.texts.push(text);
  };
  this.readers = {
    'http://www.opengis.net/ogc': {
      'ServiceExceptionReport': function(node, obj) {
        obj['exceptionReport'] = {};
        obj['exceptionReport']['exceptions'] = [];
        this.readChildNodes(node, obj['exceptionReport']);
      },
      'ServiceException': function(node, exceptionReport) {
        var exception = {};
        exception['code'] = node.getAttribute('code');
        exception['locator'] = node.getAttribute('locator');
        exception['text'] = this.getChildValue(node);
        exceptionReport['exceptions'].push(exception);
      }
    },
    'http://www.opengis.net/ows': {
      'ExceptionReport': function(node, obj) {
        obj.success = false;
        obj.exceptionReport = {
          version: node.getAttribute('version'),
          language: node.getAttribute('language'),
          exceptions: []
        };
        this.readChildNodes(node, obj.exceptionReport);
      },
      'Exception': function(node, exceptionReport) {
        exceptionReader.apply(this, arguments);
      },
      'ExceptionText': function(node, exception) {
        exceptionTextReader.apply(this, arguments);
      }
    },
    'http://www.opengis.net/ows/1.1': {
      'ExceptionReport': function(node, obj) {
        obj.exceptionReport = {
          version: node.getAttribute('version'),
          language: node.getAttribute('xml:lang'),
          exceptions: []
        };
        this.readChildNodes(node, obj.exceptionReport);
      },
      'Exception': function(node, exceptionReport) {
        exceptionReader.apply(this, arguments);
      },
      'ExceptionText': function(node, exception) {
        exceptionTextReader.apply(this, arguments);
      }
    }
  };
  goog.base(this);
};
goog.inherits(ol.parser.ogc.ExceptionReport, ol.parser.XML);


/**
 * Read OGC exception report data from a string, and return an object with
 * information about the exceptions.
 *
 * @param {string|Document} data to read/parse.
 * @return {Object} Information about the exceptions that occurred.
 */
ol.parser.ogc.ExceptionReport.prototype.read = function(data) {
  if (goog.isString(data)) {
    data = goog.dom.xml.loadXml(data);
  }
  var exceptionInfo = {};
  exceptionInfo['exceptionReport'] = null;
  if (data) {
    this.readChildNodes(data, exceptionInfo);
  }
  return exceptionInfo;
};
