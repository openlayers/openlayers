import {
  readDateTime,
  writeCDATASection,
  writeStringTextNode,
} from '../../../../../src/ol/format/xsd.js';
import {getDocument, parse} from '../../../../../src/ol/xml.js';

describe('ol/format/xsd', function () {
  describe('readDateTime', function () {
    it('can handle non-Zulu time zones', function () {
      const node = document.createElement('time');
      node.textContent = '2016-07-12T15:00:00+03:00';
      expect(new Date(readDateTime(node) * 1000).toISOString()).to.eql(
        '2016-07-12T12:00:00.000Z',
      );
    });
  });

  describe('writeStringTextNode', function () {
    describe('can handle string data without any special characters', function () {
      it('can handle basic string data', function () {
        const text = '<text>Test</text>';

        const node = getDocument().createElement('text');
        writeStringTextNode(node, 'Test');

        expect(node.textContent).to.be('Test');
        expect(node).to.xmleql(parse(text));
      });

      it('can handle number data', function () {
        const text = '<text>123456</text>';

        const node = getDocument().createElement('text');
        writeStringTextNode(node, 123456);

        expect(node.textContent).to.be('123456');
        expect(node).to.xmleql(parse(text));
      });

      it('can handle string data with spaces', function () {
        const text = '<text>Basic string with spaces</text>';

        const node = getDocument().createElement('text');
        writeStringTextNode(node, 'Basic string with spaces');

        expect(node.textContent).to.be('Basic string with spaces');
        expect(node).to.xmleql(parse(text));
      });
    });

    describe('can handle string data with whitespaces', function () {
      it('containing multiple spaces', function () {
        const text = '<text><![CDATA[two  spaces]]></text>';

        const node = getDocument().createElement('text');
        writeStringTextNode(node, 'two  spaces');

        expect(node.textContent).to.be('two  spaces');
        expect(node).to.xmleql(parse(text));
      });

      it('starting with a space', function () {
        const text = '<text><![CDATA[ test]]></text>';

        const node = getDocument().createElement('text');
        writeStringTextNode(node, ' test');

        expect(node.textContent).to.be(' test');
        expect(node).to.xmleql(parse(text));
      });

      it('ending with a space', function () {
        const text = '<text><![CDATA[test ]]></text>';

        const node = getDocument().createElement('text');
        writeStringTextNode(node, 'test ');

        expect(node.textContent).to.be('test ');
        expect(node).to.xmleql(parse(text));
      });

      it('containing a linebreak', function () {
        const text = '<text><![CDATA[test\ntest]]></text>';

        const node = getDocument().createElement('text');
        writeStringTextNode(node, 'test\ntest');

        expect(node.textContent).to.be('test\ntest');
        expect(node).to.xmleql(parse(text));
      });

      it('containing a tab', function () {
        const text = '<text><![CDATA[test\ttest]]></text>';

        const node = getDocument().createElement('text');
        writeStringTextNode(node, 'test\ttest');

        expect(node.textContent).to.be('test\ttest');
        expect(node).to.xmleql(parse(text));
      });
    });

    describe('can handle string data with special characters', function () {
      it('containing "<"', function () {
        const text = '<text><![CDATA[test<test]]></text>';

        const node = getDocument().createElement('text');
        writeStringTextNode(node, 'test<test');

        expect(node.textContent).to.be('test<test');
        expect(node).to.xmleql(parse(text));
      });

      it('containing "&"', function () {
        const text = '<text><![CDATA[test&test]]></text>';

        const node = getDocument().createElement('text');
        writeStringTextNode(node, 'test&test');

        expect(node.textContent).to.be('test&test');
        expect(node).to.xmleql(parse(text));
      });
    });

    describe('can handle string data leading to "nested" / multiple CDATA sections', function () {
      it('containing "]]>" in the middle', function () {
        // <text><![CDATA[test]]]]><![CDATA[>\ntest]]></text>
        const check = getDocument().createElement('text');
        writeCDATASection(check, 'test]]');
        writeCDATASection(check, '>\ntest');

        const node = getDocument().createElement('text');
        writeStringTextNode(node, 'test]]>\ntest');

        expect(node.textContent).to.be('test]]>\ntest');
        expect(node).to.xmleql(check);
      });

      it('containing "]]>" at the start', function () {
        // <text><![CDATA[]]]]><![CDATA[>test\ntest]]></text>
        const check = getDocument().createElement('text');
        writeCDATASection(check, ']]');
        writeCDATASection(check, '>test\ntest');

        const node = getDocument().createElement('text');
        writeStringTextNode(node, ']]>test\ntest');

        expect(node.textContent).to.be(']]>test\ntest');
        expect(node).to.xmleql(check);
      });

      it('containing "]]>" at the end', function () {
        // <text><![CDATA[test\ntest]]]]><![CDATA[>]]></text>
        const check = getDocument().createElement('text');
        writeCDATASection(check, 'test\ntest]]');
        writeCDATASection(check, '>');

        const node = getDocument().createElement('text');
        writeStringTextNode(node, 'test\ntest]]>');

        expect(node.textContent).to.be('test\ntest]]>');
        expect(node).to.xmleql(check);
      });

      it('containing "]]>" at the start, middle and the end', function () {
        // <text><![CDATA[]]]]><![CDATA[>\ntest]]]]><![CDATA[>\ntest]]]]><!CDATA[>]]></text>';
        const check = getDocument().createElement('text');
        writeCDATASection(check, ']]');
        writeCDATASection(check, '>\ntest]]');
        writeCDATASection(check, '>\ntest]]');
        writeCDATASection(check, '>');

        const node = getDocument().createElement('text');
        writeStringTextNode(node, ']]>\ntest]]>\ntest]]>');

        expect(node.textContent).to.be(']]>\ntest]]>\ntest]]>');
        expect(node).to.xmleql(check);
      });
    });
  });
});
