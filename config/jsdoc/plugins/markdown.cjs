/**
 * Modified from JSDoc's plugins/markdown and lib/jsdoc/util/markdown modules
 * (see https://github.com/jsdoc3/jsdoc/), which are licensed under the Apache 2
 * license (see https://www.apache.org/licenses/LICENSE-2.0).
 *
 * This version does not protect http(s) urls from being turned into links, and
 * works around an issue with `~` characters in module paths by escaping them.
 */

const {marked} = require('marked');

const tags = [
  'author',
  'classdesc',
  'description',
  'exceptions',
  'params',
  'properties',
  'returns',
  'see',
  'summary',
];

const hasOwnProp = Object.prototype.hasOwnProperty;

const markedRenderer = new marked.Renderer();

// Allow prettyprint to work on inline code samples
markedRenderer.code = function (code) {
  const langClass = code.lang ? ' lang-' + code.lang : '';
  const escapedCode = escapeCode(code.text);

  return `<pre class="prettyprint source${langClass}"><code>${escapedCode}</code></pre>`;
};

function escapeCode(source) {
  return source
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeUnderscoresAndTildes(source) {
  return source.replace(/\{@[^}\r\n]+\}/g, function (wholeMatch) {
    return wholeMatch.replace(/(^|[^\\])_/g, '$1\\_').replace('~', '&tilde;');
  });
}

function unencodeQuotesAndTildes(source) {
  return source.replace(/\{@[^}\r\n]+\}/g, function (wholeMatch) {
    return wholeMatch.replace(/&quot;/g, '"').replace(/&tilde;/g, '~');
  });
}

function parse(source) {
  let result;

  source = escapeUnderscoresAndTildes(source);

  result = marked(source, {
    renderer: markedRenderer,
    headerIds: false,
    mangle: false,
  })
    .replace(/\s+$/, '')
    .replace(/&#39;/g, "'");

  result = unencodeQuotesAndTildes(result);

  return result;
}

function shouldProcessString(tagName, text) {
  let shouldProcess = true;

  // we only want to process `@author` and `@see` tags that contain Markdown links
  if ((tagName === 'author' || tagName === 'see') && !text.includes('[')) {
    shouldProcess = false;
  }

  return shouldProcess;
}

function process(doclet) {
  tags.forEach(function (tag) {
    if (!hasOwnProp.call(doclet, tag)) {
      return;
    }

    if (typeof doclet[tag] === 'string') {
      if (shouldProcessString(tag, doclet[tag])) {
        doclet[tag] = parse(doclet[tag]);
      }
    } else if (Array.isArray(doclet[tag])) {
      doclet[tag].forEach(function (value, index, original) {
        const inner = {};

        inner[tag] = value;
        process(inner);
        original[index] = inner[tag];
      });
    } else if (doclet[tag]) {
      process(doclet[tag]);
    }
  });
}

exports.handlers = {
  newDoclet: function (e) {
    process(e.doclet);
  },
};
