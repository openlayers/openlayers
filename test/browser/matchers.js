// Custom assertions (roughlyEqual, xmleql) shared by the Karma and Vitest setups.

function getChildNodes(node, options) {
  // check whitespace
  if (options && options.includeWhiteSpace) {
    return node.childNodes;
  }
  const nodes = [];
  for (let i = 0, ii = node.childNodes.length; i < ii; i++) {
    const child = node.childNodes[i];
    if (child.nodeType == 1) {
      // element node, add it
      nodes.push(child);
    } else if (child.nodeType == 3) {
      // text node, add if non empty
      if (
        child.nodeValue &&
        child.nodeValue.replace(/^\s*(.*?)\s*$/, '$1') !== ''
      ) {
        nodes.push(child);
      }
    } else if (child.nodeType == 4) {
      // CDATA section, add it
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
  // for text nodes compare value
  if (node1.nodeType === 3) {
    const nv1 = node1.nodeValue.replace(/\s/g, '');
    const nv2 = node2.nodeValue.replace(/\s/g, '');
    if (nv1 !== nv2) {
      errors.push(
        'nodeValue test failed | expected ' + nv1 + ' to equal ' + nv2,
      );
    }
  } else if (node1.nodeType === 4) {
    // for CDATA sections compare nodeValue directly
    if (node1.nodeValue !== node2.nodeValue) {
      errors.push(
        'nodeValue cdata test failed | expected ' +
          node1.nodeValue +
          ' to equal ' +
          node2.nodeValue,
      );
    }
  } else if (node1.nodeType === 1) {
    // for element type nodes compare namespace, attributes, and children
    // test namespace alias and uri
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
    // compare attributes - disregard xmlns given namespace handling above
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
      // test attribute namespace
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
    // compare children
    const node1ChildNodes = getChildNodes(node1, options);
    const node2ChildNodes = getChildNodes(node2, options);
    if (node1ChildNodes.length !== node2ChildNodes.length) {
      // check if all child nodes are text, they could be split up in
      // 4096 chunks
      // if so, ignore the childnode count error
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
    // only compare if they are equal
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
 * Compares two XML documents/nodes loosely. Returns an array of difference
 * messages; an empty array means they match.
 * @param {Object} received The actual value.
 * @param {Object} expected The expected value.
 * @param {Object} [options] includeWhiteSpace, ignoreElementOrder, prefix.
 * @return {Array<string>} The differences.
 */
export function xmlEqual(received, expected, options) {
  if (expected && expected.nodeType == 9) {
    expected = expected.documentElement;
  }
  if (received && received.nodeType == 9) {
    received = received.documentElement;
  }
  const errors = [];
  assertElementNodesEqual(expected, received, options, errors);
  return errors;
}

// Vitest matchers. roughlyEqual uses an absolute tolerance (not toBeCloseTo).
export const matchers = {
  roughlyEqual(received, n, tol) {
    const pass = Math.abs(received - n) <= tol;
    return {
      pass,
      message: () =>
        `expected ${received} ${pass ? 'not ' : ''}to be within ${tol} of ${n}`,
    };
  },
  xmleql(received, expected, options) {
    const errors = xmlEqual(received, expected, options);
    const pass = errors.length === 0;
    return {
      pass,
      message: () =>
        `expected XML to ${pass ? 'not ' : ''}sort of equal` +
        (errors.length ? '\n' + errors.join('\n') : ''),
    };
  },
};
