goog.provide('ol.test.parser.ogc.ExceptionReport');


describe('ol.parser.ogc.exceptionreport', function() {

  var parser = new ol.parser.ogc.ExceptionReport();

  describe('test read exception', function() {

    it('OCG WMS 1.3.0 exceptions', function(done) {
      var url = 'spec/ol/parser/ogc/xml/exceptionreport/wms1_3_0.xml';
      afterLoadXml(url, function(xml) {
        var exceptions = parser.read(xml).exceptionReport.exceptions;
        expect(exceptions.length).to.be(4);
        var str = 'Plain text message about an error.';
        expect(goog.string.trim(exceptions[0].text)).to.be(str);
        expect(exceptions[1].code).to.be('InvalidUpdateSequence');
        str = ' Another error message, this one with a service exception ' +
            'code supplied. ';
        expect(exceptions[1].text).to.be(str);
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
        done();
      });
    });

    it('test read exception OWSCommon 1.0.0', function(done) {
      var url = 'spec/ol/parser/ogc/xml/exceptionreport/ows1_0_0.xml';
      afterLoadXml(url, function(xml) {
        var report = parser.read(xml).exceptionReport;
        var exception = report.exceptions[0];

        expect(report.version).to.eql('1.0.0');
        expect(report.language).to.eql('en');
        expect(exception.code).to.eql('InvalidParameterValue');
        expect(exception.locator).to.eql('foo');
        var msg = 'Update error: Error occured updating features';
        expect(exception.texts[0]).to.eql(msg);
        msg = 'Second exception line';
        expect(exception.texts[1]).to.eql(msg);
        done();
      });
    });

    it('test read exception OWSCommon 1.1.0', function(done) {
      var url = 'spec/ol/parser/ogc/xml/exceptionreport/ows1_1_0.xml';
      afterLoadXml(url, function(xml) {
        var report = parser.read(xml).exceptionReport;
        var exception = report.exceptions[0];

        expect(report.version).to.eql('1.1.0');
        expect(report.language).to.eql('en');
        expect(exception.code).to.eql('InvalidParameterValue');
        expect(exception.locator).to.eql('foo');
        var msg = 'Update error: Error occured updating features';
        expect(exception.texts[0]).to.eql(msg);
        expect(exception.texts[1]).to.eql('Second exception line');
        done();
      });
    });
  });
});

goog.require('goog.string');
goog.require('ol.parser.ogc.ExceptionReport');
