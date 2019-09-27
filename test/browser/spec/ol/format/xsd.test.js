import {assert} from 'chai';
import {
  readDateTime,
  writeCDATASection,
  writeStringTextNode,
} from '../../../../../src/ol/format/xsd.js';
import {getDocument, parse} from '../../../../../src/ol/xml.js';
import {assertXmlEqual} from '../../../../util/xml.js';

describe('ol/format/xsd', function () {
  describe('readDateTime', function () {
    it('can handle non-Zulu time zones', function () {
      const node = document.createElement('time');
      node.textContent = '2016-07-12T15:00:00+03:00';
      assert.deepEqual(
        new Date(readDateTime(node) * 1000).toISOString(),
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

        assert.strictEqual(node.textContent, 'Test');
        assertXmlEqual(node, parse(text));
      });

      it('can handle number data', function () {
        const text = '<text>123456</text>';

        const node = getDocument().createElement('text');
        writeStringTextNode(node, 123456);

        assert.strictEqual(node.textContent, '123456');
        assertXmlEqual(node, parse(text));
      });

      it('can handle string data with spaces', function () {
        const text = '<text>Basic string with spaces</text>';

        const node = getDocument().createElement('text');
        writeStringTextNode(node, 'Basic string with spaces');

        assert.strictEqual(node.textContent, 'Basic string with spaces');
        assertXmlEqual(node, parse(text));
      });
    });

    describe('can handle string data with whitespaces', function () {
      it('containing multiple spaces', function () {
        const text = '<text><![CDATA[two  spaces]]></text>';

        const node = getDocument().createElement('text');
        writeStringTextNode(node, 'two  spaces');

        assert.strictEqual(node.textContent, 'two  spaces');
        assertXmlEqual(node, parse(text));
      });

      it('starting with a space', function () {
        const text = '<text><![CDATA[ test]]></text>';

        const node = getDocument().createElement('text');
        writeStringTextNode(node, ' test');

        assert.strictEqual(node.textContent, ' test');
        assertXmlEqual(node, parse(text));
      });

      it('ending with a space', function () {
        const text = '<text><![CDATA[test ]]></text>';

        const node = getDocument().createElement('text');
        writeStringTextNode(node, 'test ');

        assert.strictEqual(node.textContent, 'test ');
        assertXmlEqual(node, parse(text));
      });

      it('containing a linebreak', function () {
        const text = '<text><![CDATA[test\ntest]]></text>';

        const node = getDocument().createElement('text');
        writeStringTextNode(node, 'test\ntest');

        assert.strictEqual(node.textContent, 'test\ntest');
        assertXmlEqual(node, parse(text));
      });

      it('containing a tab', function () {
        const text = '<text><![CDATA[test\ttest]]></text>';

        const node = getDocument().createElement('text');
        writeStringTextNode(node, 'test\ttest');

        assert.strictEqual(node.textContent, 'test\ttest');
        assertXmlEqual(node, parse(text));
      });
    });

    describe('can handle string data with special characters', function () {
      it('containing "<"', function () {
        const text = '<text><![CDATA[test<test]]></text>';

        const node = getDocument().createElement('text');
        writeStringTextNode(node, 'test<test');

        assert.strictEqual(node.textContent, 'test<test');
        assertXmlEqual(node, parse(text));
      });

      it('containing "&"', function () {
        const text = '<text><![CDATA[test&test]]></text>';

        const node = getDocument().createElement('text');
        writeStringTextNode(node, 'test&test');

        assert.strictEqual(node.textContent, 'test&test');
        assertXmlEqual(node, parse(text));
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

        assert.strictEqual(node.textContent, 'test]]>\ntest');
        assertXmlEqual(node, check);
      });

      it('containing "]]>" at the start', function () {
        // <text><![CDATA[]]]]><![CDATA[>test\ntest]]></text>
        const check = getDocument().createElement('text');
        writeCDATASection(check, ']]');
        writeCDATASection(check, '>test\ntest');

        const node = getDocument().createElement('text');
        writeStringTextNode(node, ']]>test\ntest');

        assert.strictEqual(node.textContent, ']]>test\ntest');
        assertXmlEqual(node, check);
      });

      it('containing "]]>" at the end', function () {
        // <text><![CDATA[test\ntest]]]]><![CDATA[>]]></text>
        const check = getDocument().createElement('text');
        writeCDATASection(check, 'test\ntest]]');
        writeCDATASection(check, '>');

        const node = getDocument().createElement('text');
        writeStringTextNode(node, 'test\ntest]]>');

        assert.strictEqual(node.textContent, 'test\ntest]]>');
        assertXmlEqual(node, check);
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

        assert.strictEqual(node.textContent, ']]>\ntest]]>\ntest]]>');
        assertXmlEqual(node, check);
      });
    });
  });
});
