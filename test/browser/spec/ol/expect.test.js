describe('expect.js', function () {
  describe('roughlyEqual', function () {
    it('can tell the difference between 1 and 3', function () {
      expect(1).not.to.roughlyEqual(3, 1);
    });

    it('really can tell the difference between 1 and 3', function () {
      expect(function () {
        expect(1).to.roughlyEqual(3, 0.5);
      }).to.throwException();
    });

    it("thinks that 1 ain't so different from 2", function () {
      expect(1).to.roughlyEqual(2, 1);
    });

    it('knows that, like, 1 and 2 would, like, totally dig each other', function () {
      expect(function () {
        expect(1).to.roughlyEqual(2, 1);
      }).not.to.throwException();
    });
  });

  describe('Test equality of XML documents - xmleql', function () {
    it('Test XML document with single root, different prefix', function () {
      const doc1 = '<bar:foo xmlns:bar="http://foo"></bar:foo>';
      const doc2 = '<foo xmlns="http://foo"></foo>';
      expect(
        new DOMParser().parseFromString(doc1, 'application/xml')
      ).to.xmleql(new DOMParser().parseFromString(doc2, 'application/xml'));
    });

    it('Test XML document with single root, different prefix, prefix true', function () {
      const doc1 = '<bar:foo xmlns:bar="http://foo"></bar:foo>';
      const doc2 = '<foo xmlns="http://foo"></foo>';
      expect(
        new DOMParser().parseFromString(doc1, 'application/xml')
      ).to.not.xmleql(
        new DOMParser().parseFromString(doc2, 'application/xml'),
        {prefix: true}
      );
    });

    it('Test XML document with different root', function () {
      const doc1 = '<foo></foo>';
      const doc2 = '<bar></bar>';
      expect(
        new DOMParser().parseFromString(doc1, 'application/xml')
      ).to.not.xmleql(new DOMParser().parseFromString(doc2, 'application/xml'));
    });

    it('Test different number of attributes', function () {
      const doc1 = '<foo attr="bla"></foo>';
      const doc2 = '<foo></foo>';
      expect(
        new DOMParser().parseFromString(doc1, 'application/xml')
      ).to.not.xmleql(new DOMParser().parseFromString(doc2, 'application/xml'));
    });

    it('Test different attribute value', function () {
      const doc1 = '<foo attr="bla"></foo>';
      const doc2 = '<foo attr="foo"></foo>';
      expect(
        new DOMParser().parseFromString(doc1, 'application/xml')
      ).to.not.xmleql(new DOMParser().parseFromString(doc2, 'application/xml'));
    });

    it('Test different number of children', function () {
      const doc1 = '<foo><mynode></mynode></foo>';
      const doc2 = '<foo></foo>';
      expect(
        new DOMParser().parseFromString(doc1, 'application/xml')
      ).to.not.xmleql(new DOMParser().parseFromString(doc2, 'application/xml'));
    });
  });
});
