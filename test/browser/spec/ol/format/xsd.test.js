import {
  readDateTime,
  writeCDATASection,
  writeStringTextNode,
} from '../../../../../src/ol/format/xsd.js';
import {createElementNS, parse} from '../../../../../src/ol/xml.js';

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
        const text = '<text xmlns="http://www.w3.org/1999/xhtml">Test</text>';

        const node = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeStringTextNode(node, 'Test');

        expect(node).to.xmleql(parse(text));
      });

      it('can handle number data', function () {
        const text = '<text xmlns="http://www.w3.org/1999/xhtml">123456</text>';

        const node = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeStringTextNode(node, 123456);

        expect(node).to.xmleql(parse(text));
      });

      it('can handle boolean data', function () {
        const text = '<text xmlns="http://www.w3.org/1999/xhtml">true</text>';

        const node = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeStringTextNode(node, true);

        expect(node).to.xmleql(parse(text));
      });

      it('can handle string data with spaces', function () {
        const text =
          '<text xmlns="http://www.w3.org/1999/xhtml">Basic string with spaces</text>';

        const node = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeStringTextNode(node, 'Basic string with spaces');

        expect(node).to.xmleql(parse(text));
      });
    });

    describe('can handle string data with whitespaces', function () {
      it('containing multiple spaces', function () {
        const text =
          '<text xmlns="http://www.w3.org/1999/xhtml"><![CDATA[two  spaces]]></text>';

        const node = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeStringTextNode(node, 'two  spaces');

        expect(node).to.xmleql(parse(text));
      });

      it('starting with a space', function () {
        const text =
          '<text xmlns="http://www.w3.org/1999/xhtml"><![CDATA[ test]]></text>';

        const node = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeStringTextNode(node, ' test');

        expect(node).to.xmleql(parse(text));
      });

      it('ending with a space', function () {
        const text =
          '<text xmlns="http://www.w3.org/1999/xhtml"><![CDATA[test ]]></text>';

        const node = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeStringTextNode(node, 'test ');

        expect(node).to.xmleql(parse(text));
      });

      it('containing a linebreak', function () {
        const text =
          '<text xmlns="http://www.w3.org/1999/xhtml"><![CDATA[test\ntest]]></text>';

        const node = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeStringTextNode(node, 'test\ntest');

        expect(node).to.xmleql(parse(text));
      });

      it('containing a tab', function () {
        const text =
          '<text xmlns="http://www.w3.org/1999/xhtml"><![CDATA[test\ttest]]></text>';

        const node = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeStringTextNode(node, 'test\ttest');

        expect(node).to.xmleql(parse(text));
      });
    });

    describe('can handle string data with special characters', function () {
      it('containing "<"', function () {
        const text =
          '<text xmlns="http://www.w3.org/1999/xhtml"><![CDATA[test<test]]></text>';

        const node = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeStringTextNode(node, 'test<test');

        expect(node).to.xmleql(parse(text));
      });

      it('containing ">"', function () {
        const text =
          '<text xmlns="http://www.w3.org/1999/xhtml"><![CDATA[test>test]]></text>';

        const node = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeStringTextNode(node, 'test>test');

        expect(node).to.xmleql(parse(text));
      });

      it('containing "&"', function () {
        const text =
          '<text xmlns="http://www.w3.org/1999/xhtml"><![CDATA[test&test]]></text>';

        const node = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeStringTextNode(node, 'test&test');

        expect(node).to.xmleql(parse(text));
      });

      it('containing "\'"', function () {
        const text =
          '<text xmlns="http://www.w3.org/1999/xhtml"><![CDATA[test\'test]]></text>';

        const node = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeStringTextNode(node, "test'test");

        expect(node).to.xmleql(parse(text));
      });

      it('containing """', function () {
        const text =
          '<text xmlns="http://www.w3.org/1999/xhtml"><![CDATA[test"test]]></text>';

        const node = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeStringTextNode(node, 'test"test');

        expect(node).to.xmleql(parse(text));
      });
    });

    describe('can handle string data leading to "nested" / multiple CDATA sections', function () {
      it('containing "]]>" in the middle', function () {
        // <text xmlns="http://www.w3.org/1999/xhtml"><![CDATA[test]]]]><![CDATA[>test]]></text>
        const check = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeCDATASection(check, 'test]]');
        writeCDATASection(check, '>test');

        const node = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeStringTextNode(node, 'test]]>test');

        expect(node).to.xmleql(check);
      });

      it('containing "]]>" at the start', function () {
        // <text xmlns="http://www.w3.org/1999/xhtml"><![CDATA[]]]]><![CDATA[>test\ntest]]></text>
        const check = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeCDATASection(check, ']]');
        writeCDATASection(check, '>test\ntest');

        const node = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeStringTextNode(node, ']]>test\ntest');

        expect(node).to.xmleql(check);
      });

      it('containing "]]>" at the end', function () {
        // <text xmlns="http://www.w3.org/1999/xhtml"><![CDATA[test\ntest]]]]><![CDATA[>]]></text>
        const check = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeCDATASection(check, 'test\ntest]]');
        writeCDATASection(check, '>');

        const node = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeStringTextNode(node, 'test\ntest]]>');

        expect(node).to.xmleql(check);
      });

      it('containing "]]>" at the start, middle and the end', function () {
        // <text xmlns="http://www.w3.org/1999/xhtml"><![CDATA[]]]]><![CDATA[>test]]]]><![CDATA[>test]]]]><!CDATA[>]]></text>';
        const check = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeCDATASection(check, ']]');
        writeCDATASection(check, '>test]]');
        writeCDATASection(check, '>test]]');
        writeCDATASection(check, '>');

        const node = createElementNS('http://www.w3.org/1999/xhtml', 'text');
        writeStringTextNode(node, ']]>test]]>test]]>');

        expect(node).to.xmleql(check);
      });
    });
  });
});
