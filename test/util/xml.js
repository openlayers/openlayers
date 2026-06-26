import {assert} from 'chai';

/**
 * @typedef {Object} XmlEqualOptions
 * @property {boolean} [includeWhiteSpace] IncludeWhiteSpace.
 * @property {boolean} [ignoreElementOrder] IgnoreElementOrder.
 * @property {boolean} [prefix] Compare element prefixes.
 */

/**
 * @param {Node} node Node.
 * @param {XmlEqualOptions} [options] Options.
 * @return {Array<Node>} Child nodes.
 */
function getChildNodes(node, options) {
  if (options && options.includeWhiteSpace) {
    return node.childNodes;
  }
  const nodes = [];
  for (let i = 0, ii = node.childNodes.length; i < ii; i++) {
    const child = node.childNodes[i];
    if (child.nodeType == 1) {
      nodes.push(child);
    } else if (child.nodeType == 3) {
      if (
        child.nodeValue &&
        child.nodeValue.replace(/^\s*(.*?)\s*$/, '$1') !== ''
      ) {
        nodes.push(child);
      }
    } else if (child.nodeType == 4) {
      nodes.push(child);
    }
  }
  if (options && options.ignoreElementOrder) {
    nodes.sort(function (a, b) {
      return a.nodeName > b.nodeName ? 1 : a.nodeName < b.nodeName ? -1 : 0;
    });
  }
  return nodes;
}

/**
 * @param {Node} node1 First node.
 * @param {Node} node2 Second node.
 * @param {XmlEqualOptions} [options] Options.
 * @param {Array<string>} errors Collected errors.
 */
function assertElementNodesEqual(node1, node2, options, errors) {
  const testPrefix = options && options.prefix === true;
  if (node1.nodeType !== node2.nodeType) {
    errors.push(
      'nodeType test failed for: ' +
        node1.nodeName +
        ' | ' +
        node2.nodeName +
        ' | expected ' +
        node1.nodeType +
        ' to equal ' +
        node2.nodeType,
    );
  }
  if (testPrefix) {
    if (node1.nodeName !== node2.nodeName) {
      errors.push(
        'nodeName test failed for: ' +
          node1.nodeName +
          ' | ' +
          node2.nodeName +
          ' | expected ' +
          node1.nodeName +
          ' to equal ' +
          node2.nodeName,
      );
    }
  } else {
    const n1 = node1.nodeName.split(':').pop();
    const n2 = node2.nodeName.split(':').pop();
    if (n1 !== n2) {
      errors.push(
        'nodeName test failed for: ' +
          node1.nodeName +
          ' | ' +
          node2.nodeName +
          ' | expected ' +
          n1 +
          ' to equal ' +
          n2,
      );
    }
  }
  if (node1.nodeType === 3) {
    const nv1 = node1.nodeValue.replace(/\s/g, '');
    const nv2 = node2.nodeValue.replace(/\s/g, '');
    if (nv1 !== nv2) {
      errors.push(
        'nodeValue test failed | expected ' + nv1 + ' to equal ' + nv2,
      );
    }
  } else if (node1.nodeType === 4) {
    if (node1.nodeValue !== node2.nodeValue) {
      errors.push(
        'nodeValue cdata test failed | expected ' +
          node1.nodeValue +
          ' to equal ' +
          node2.nodeValue,
      );
    }
  } else if (node1.nodeType === 1) {
    if (node1.prefix || node2.prefix) {
      if (testPrefix) {
        if (node1.prefix !== node2.prefix) {
          errors.push(
            'Prefix test failed for: ' +
              node1.nodeName +
              ' | expected ' +
              node1.prefix +
              ' to equal ' +
              node2.prefix,
          );
        }
      }
    }
    if (node1.namespaceURI || node2.namespaceURI) {
      if (node1.namespaceURI !== node2.namespaceURI) {
        errors.push(
          'namespaceURI test failed for: ' +
            node1.nodeName +
            ' | expected ' +
            node1.namespaceURI +
            ' to equal ' +
            node2.namespaceURI,
        );
      }
    }
    let node1AttrLen = 0;
    const node1Attr = {};
    let node2AttrLen = 0;
    const node2Attr = {};
    let ga, ea, gn, en;
    let i, ii;
    if (node1.attributes) {
      for (i = 0, ii = node1.attributes.length; i < ii; ++i) {
        ga = node1.attributes[i];
        if (ga.specified === undefined || ga.specified === true) {
          if (ga.name.split(':').shift() != 'xmlns') {
            gn = testPrefix ? ga.name : ga.name.split(':').pop();
            node1Attr[gn] = ga;
            ++node1AttrLen;
          }
        }
      }
    }
    if (node2.attributes) {
      for (i = 0, ii = node2.attributes.length; i < ii; ++i) {
        ea = node2.attributes[i];
        if (ea.specified === undefined || ea.specified === true) {
          if (ea.name.split(':').shift() != 'xmlns') {
            en = testPrefix ? ea.name : ea.name.split(':').pop();
            node2Attr[en] = ea;
            ++node2AttrLen;
          }
        }
      }
    }
    if (node1AttrLen !== node2AttrLen) {
      errors.push(
        'Number of attributes test failed for: ' +
          node1.nodeName +
          ' | expected ' +
          node1AttrLen +
          ' to equal ' +
          node2AttrLen,
      );
    }
    for (const name in node1Attr) {
      if (node2Attr[name] === undefined) {
        errors.push(
          'Attribute name ' +
            node1Attr[name].name +
            ' expected for element ' +
            node1.nodeName,
        );
        break;
      }
      if (node1Attr[name].namespaceURI !== node2Attr[name].namespaceURI) {
        errors.push(
          'namespaceURI attribute test failed for: ' +
            node1.nodeName +
            ' | expected ' +
            node1Attr[name].namespaceURI +
            ' to equal ' +
            node2Attr[name].namespaceURI,
        );
      }
      if (node1Attr[name].value !== node2Attr[name].value) {
        errors.push(
          'Attribute value test failed for: ' +
            node1.nodeName +
            ' | expected ' +
            node1Attr[name].value +
            ' to equal ' +
            node2Attr[name].value,
        );
      }
    }
    const node1ChildNodes = getChildNodes(node1, options);
    const node2ChildNodes = getChildNodes(node2, options);
    if (node1ChildNodes.length !== node2ChildNodes.length) {
      let allText = true;
      let c, cc;
      for (c = 0, cc = node1ChildNodes.length; c < cc; ++c) {
        if (node1ChildNodes[c].nodeType !== 3) {
          allText = false;
          break;
        }
      }
      for (c = 0, cc = node2ChildNodes.length; c < cc; ++c) {
        if (node2ChildNodes[c].nodeType !== 3) {
          allText = false;
          break;
        }
      }
      if (!allText) {
        errors.push(
          'Number of childNodes test failed for: ' +
            node1.nodeName +
            ' | expected ' +
            node1ChildNodes.length +
            ' to equal ' +
            node2ChildNodes.length,
        );
      }
    }
    if (node1ChildNodes.length === node2ChildNodes.length) {
      for (let j = 0, jj = node1ChildNodes.length; j < jj; ++j) {
        assertElementNodesEqual(
          node1ChildNodes[j],
          node2ChildNodes[j],
          options,
          errors,
        );
      }
    }
  }
}

/**
 * @param {Node} node Node.
 * @return {Node} Normalized node.
 */
function normalizeXmlNode(node) {
  if (node && node.nodeType == 9) {
    return node.documentElement;
  }
  return node;
}

/**
 * Compare two XML nodes and return a list of error messages.
 * @param {*} actual Actual value.
 * @param {*} expected Expected value.
 * @param {XmlEqualOptions} [options] Options.
 * @return {Array<string>} Errors.
 */
export function compareXml(actual, expected, options) {
  const errors = [];
  assertElementNodesEqual(
    normalizeXmlNode(expected),
    normalizeXmlNode(actual),
    options,
    errors,
  );
  return errors;
}

/**
 * Assert two XML documents or nodes are equivalent.
 * @param {*} actual Actual value.
 * @param {*} expected Expected value.
 * @param {XmlEqualOptions} [options] Options.
 */
export function assertXmlEqual(actual, expected, options) {
  const errors = compareXml(actual, expected, options);
  assert.strictEqual(
    errors.length,
    0,
    'expected XML to sort of equal\n' + errors.join('\n'),
  );
}

/**
 * Assert two XML documents or nodes are not equivalent.
 * @param {*} actual Actual value.
 * @param {*} expected Expected value.
 * @param {XmlEqualOptions} [options] Options.
 */
export function assertNotXmlEqual(actual, expected, options) {
  const errors = compareXml(actual, expected, options);
  assert.notStrictEqual(errors.length, 0, 'expected XML to sort of not equal');
}
