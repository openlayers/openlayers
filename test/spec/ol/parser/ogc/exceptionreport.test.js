goog.provide('ol.test.parser.ogc.ExceptionReport');

describe('ol.parser.ogc.exceptionreport', function() {

  var parser = new ol.parser.ogc.ExceptionReport();

  describe('test read exception', function() {
    it('OCG WMS 1.3.0 exceptions', function() {
      var result, exceptions;
      runs(function() {
        var url = 'spec/ol/parser/ogc/xml/exceptionreport/wms1_3_0.xml';
        goog.net.XhrIo.send(url, function(e) {
          var xhr = e.target;
          result = parser.read(xhr.getResponseXml());
          exceptions = result.exceptionReport.exceptions;
        });
      });
      waitsFor(function() {
        return (result !== undefined);
      }, 'XHR timeout', 1000);
      runs(function() {
        expect(exceptions.length).toBe(4);
        var str = 'Plain text message about an error.';
        expect(goog.string.trim(exceptions[0].text)).toBe(str);
        expect(exceptions[1].code).toBe('InvalidUpdateSequence');
        str = ' Another error message, this one with a service exception ' +
            'code supplied. ';
        expect(exceptions[1].text).toBe(str);
        str = 'Error in module <foo.c>, line 42A message that includes angle ' +
            'brackets in text must be enclosed in a Character Data Section as' +
            ' in this example. All XML-like markup is ignored except for this' +
            ' sequence of three closing characters:';
        expect(goog.string.trim(exceptions[2].text), str);
        str = '<Module>foo.c</Module> <Error>An error occurred</Error> ' +
            '<Explanation>Similarly, actual XML can be enclosed in a CDATA ' +
            'section. A generic parser will ignore that XML, but ' +
            'application-specific software may choose to process it.' +
            '</Explanation>';
        expect(goog.string.trim(exceptions[3].text), str);
      });
    });
    it('test read exception OWSCommon 1.0.0', function() {
      var result, report, exception;
      runs(function() {
        var url = 'spec/ol/parser/ogc/xml/exceptionreport/ows1_0_0.xml';
        goog.net.XhrIo.send(url, function(e) {
          var xhr = e.target;
          result = parser.read(xhr.getResponseXml());
          report = result.exceptionReport;
          exception = report.exceptions[0];
        });
      });
      waitsFor(function() {
        return (result !== undefined);
      }, 'XHR timeout', 1000);
      runs(function() {
        expect(report.version).toEqual('1.0.0');
        expect(report.language).toEqual('en');
        expect(exception.code).toEqual('InvalidParameterValue');
        expect(exception.locator).toEqual('foo');
        var msg = 'Update error: Error occured updating features';
        expect(exception.texts[0]).toEqual(msg);
        msg = 'Second exception line';
        expect(exception.texts[1]).toEqual(msg);
      });
    });
    it('test read exception OWSCommon 1.1.0', function() {
      var result, report, exception;
      runs(function() {
        var url = 'spec/ol/parser/ogc/xml/exceptionreport/ows1_1_0.xml';
        goog.net.XhrIo.send(url, function(e) {
          var xhr = e.target;
          result = parser.read(xhr.getResponseXml());
          report = result.exceptionReport;
          exception = report.exceptions[0];
        });
      });
      waitsFor(function() {
        return (result !== undefined);
      }, 'XHR timeout', 1000);
      runs(function() {
        expect(report.version).toEqual('1.1.0');
        expect(report.language).toEqual('en');
        expect(exception.code).toEqual('InvalidParameterValue');
        expect(exception.locator).toEqual('foo');
        var msg = 'Update error: Error occured updating features';
        expect(exception.texts[0]).toEqual(msg);
        expect(exception.texts[1]).toEqual('Second exception line');
      });
    });
  });
});

goog.require('goog.net.XhrIo');
goog.require('goog.string');
goog.require('ol.parser.ogc.ExceptionReport');
