

describe('expect.js', () => {

  describe('arreqlNaN', () => {

    test('considers NaN in array to be equal', () => {
      expect([1, NaN, 2]).to.arreqlNaN([1, NaN, 2]);
      expect([1, NaN, 2]).not.to.arreqlNaN([1, 1.5, 2]);
    });

    test('allows a mix of number and string', () => {
      expect([1, NaN, 'foo']).to.arreqlNaN([1, NaN, 'foo']);
      expect([1, NaN, 'foo']).not.to.arreqlNaN([1, NaN, 'bar']);
      expect([1, NaN]).not.to.arreqlNaN([1, 'foo']);
    });

  });

  describe('roughlyEqual', () => {

    test('can tell the difference between 1 and 3', () => {
      expect(1).not.to.roughlyEqual(3, 1);
    });

    test('really can tell the difference between 1 and 3', () => {
      expect(function() {
        expect(1).to.roughlyEqual(3, 0.5);
      }).toThrow();
    });

    test('thinks that 1 ain\'t so different from 2', () => {
      expect(1).to.roughlyEqual(2, 1);
    });

    test(
      'knows that, like, 1 and 2 would, like, totally dig each other',
      () => {
        expect(function() {
          expect(1).to.roughlyEqual(2, 1);
        }).not.toThrow();
      }
    );

  });

  describe('called', () => {

    let telephone;
    beforeEach(() => {
      telephone = sinon.spy();
    });

    test('has caller ID', () => {
      telephone();
      expect(telephone).to.be.called();
    });

    test('also knows when it\'s speaking to the hand', () => {
      (function() {})();
      expect(telephone).not.to.be.called();
    });

    test('reminds you that you forgot', () => {
      expect(function() {
        expect(telephone).to.be.called();
      }).toThrow();
    });

    test('gets moody all too quickly', () => {
      telephone();
      expect(function() {
        expect(telephone).not.to.be.called();
      }).toThrow();
    });

  });

  describe('Test equality of XML documents - xmleql', () => {

    test('Test XML document with single root, different prefix', () => {
      const doc1 = '<bar:foo xmlns:bar="http://foo"></bar:foo>';
      const doc2 = '<foo xmlns="http://foo"></foo>';
      expect(new DOMParser().parseFromString(doc1, 'application/xml')).to.xmleql(
        new DOMParser().parseFromString(doc2, 'application/xml'));
    });

    test(
      'Test XML document with single root, different prefix, prefix true',
      () => {
        const doc1 = '<bar:foo xmlns:bar="http://foo"></bar:foo>';
        const doc2 = '<foo xmlns="http://foo"></foo>';
        expect(new DOMParser().parseFromString(doc1, 'application/xml')).to.not.xmleql(
          new DOMParser().parseFromString(doc2, 'application/xml'), {prefix: true});
      }
    );

    test('Test XML document with different root', () => {
      const doc1 = '<foo></foo>';
      const doc2 = '<bar></bar>';
      expect(new DOMParser().parseFromString(doc1, 'application/xml')).to.not.xmleql(
        new DOMParser().parseFromString(doc2, 'application/xml'));
    });

    test('Test different number of attributes', () => {
      const doc1 = '<foo attr="bla"></foo>';
      const doc2 = '<foo></foo>';
      expect(new DOMParser().parseFromString(doc1, 'application/xml')).to.not.xmleql(
        new DOMParser().parseFromString(doc2, 'application/xml'));
    });

    test('Test different attribute value', () => {
      const doc1 = '<foo attr="bla"></foo>';
      const doc2 = '<foo attr="foo"></foo>';
      expect(new DOMParser().parseFromString(doc1, 'application/xml')).to.not.xmleql(
        new DOMParser().parseFromString(doc2, 'application/xml'));
    });

    test('Test different number of children', () => {
      const doc1 = '<foo><mynode></mynode></foo>';
      const doc2 = '<foo></foo>';
      expect(new DOMParser().parseFromString(doc1, 'application/xml')).to.not.xmleql(
        new DOMParser().parseFromString(doc2, 'application/xml'));
    });

  });

});
