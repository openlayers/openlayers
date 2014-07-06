goog.provide('ol.test.expect.js');


describe('expect.js', function() {

  describe('arreqlNaN', function() {

    it('considers NaN in array to be equal', function() {
      expect([1, NaN, 2]).to.arreqlNaN([1, NaN, 2]);
      expect([1, NaN, 2]).not.to.arreqlNaN([1, 1.5, 2]);
    });

    it('allows a mix of number and string', function() {
      expect([1, NaN, 'foo']).to.arreqlNaN([1, NaN, 'foo']);
      expect([1, NaN, 'foo']).not.to.arreqlNaN([1, NaN, 'bar']);
      expect([1, NaN]).not.to.arreqlNaN([1, 'foo']);
    });

  });

  describe('roughlyEqual', function() {

    it('can tell the difference between 1 and 3', function() {
      expect(1).not.to.roughlyEqual(3, 1);
    });

    it('really can tell the difference between 1 and 3', function() {
      expect(function() {
        expect(1).to.roughlyEqual(3, 0.5);
      }).to.throwException();
    });

    it('thinks that 1 ain\'t so different from 2', function() {
      expect(1).to.roughlyEqual(2, 1);
    });

    it('knows that, like, 1 and 2 would, like, totally dig each other',
        function() {
          expect(function() {
            expect(1).to.roughlyEqual(2, 1);
          }).not.to.throwException();
        });

  });

  describe('called', function() {

    var telephone;
    beforeEach(function() {
      telephone = sinon.spy();
    });

    it('has caller ID', function() {
      telephone();
      expect(telephone).to.be.called();
    });

    it('also knows when it\'s speaking to the hand', function() {
      (function() {})();
      expect(telephone).not.to.be.called();
    });

    it('reminds you that you forgot', function() {
      expect(function() {
        expect(telephone).to.be.called();
      }).to.throwException();
    });

    it('gets moody all too quickly', function() {
      telephone();
      expect(function() {
        expect(telephone).not.to.be.called();
      }).to.throwException();
    });

  });

  describe('Test equality of XML documents - xmleql', function() {

    it('Test XML document with single root, different prefix', function() {
      var doc1 = '<bar:foo xmlns:bar="http://foo"></bar:foo>';
      var doc2 = '<foo xmlns="http://foo"></foo>';
      expect(goog.dom.xml.loadXml(doc1)).to.xmleql(
          goog.dom.xml.loadXml(doc2));
    });

    it('Test XML document with single root, different prefix, prefix true',
        function() {
          var doc1 = '<bar:foo xmlns:bar="http://foo"></bar:foo>';
          var doc2 = '<foo xmlns="http://foo"></foo>';
          expect(goog.dom.xml.loadXml(doc1)).to.not.xmleql(
              goog.dom.xml.loadXml(doc2), {prefix: true});
        });

    it('Test XML document with different root', function() {
      var doc1 = '<foo></foo>';
      var doc2 = '<bar></bar>';
      expect(goog.dom.xml.loadXml(doc1)).to.not.xmleql(
          goog.dom.xml.loadXml(doc2));
    });

    it('Test different number of attributes', function() {
      var doc1 = '<foo attr="bla"></foo>';
      var doc2 = '<foo></foo>';
      expect(goog.dom.xml.loadXml(doc1)).to.not.xmleql(
          goog.dom.xml.loadXml(doc2));
    });

    it('Test different attribute value', function() {
      var doc1 = '<foo attr="bla"></foo>';
      var doc2 = '<foo attr="foo"></foo>';
      expect(goog.dom.xml.loadXml(doc1)).to.not.xmleql(
          goog.dom.xml.loadXml(doc2));
    });

    it('Test different number of children', function() {
      var doc1 = '<foo><mynode></mynode></foo>';
      var doc2 = '<foo></foo>';
      expect(goog.dom.xml.loadXml(doc1)).to.not.xmleql(
          goog.dom.xml.loadXml(doc2));
    });

  });

});

goog.require('goog.dom.xml');
