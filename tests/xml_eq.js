/**
 * File: xml_eq.js
 * Adds a xml_eq method to AnotherWay test objects.
 *
 * Function: Test.AnotherWay._test_object_t.xml_eq
 * Test if two XML nodes are equivalent.  Tests for same node types, same
 *     node names, same namespace prefix and URI, same attributes, and
 *     recursively tests child nodes.
 *
 * (code)
 * t.xml_eq(got, expected, message);
 * (end)
 * 
 * Parameters:
 * got - {DOMElement | String} A DOM node or XML string to test.
 * expected - {DOMElement | String} The expected DOM node or XML string.
 * msg - {String} A message to print with test output.
 * 
 */

(function() {
    
    /**
     * Function: stringFormat
     * Given a string with tokens in the form ${token}, return a string
     *     with tokens replaced with properties from the given context
     *     object.  Represent a literal "${" by doubling it, e.g. "${${".
     *
     * Parameters:
     * template - {String} A string with tokens to be replaced.  A template
     *     has the form "literal ${token}" where the token will be replaced
     *     by the value of context["token"].
     * context - {Object} An optional object with properties corresponding
     *     to the tokens in the format string.  If no context is sent, the
     *     window object will be used.
     *
     * Returns:
     * {String} A string with tokens replaced from the context object.
     */
    function formatString(template, context) {
        if(!context) {
            context = window;
        }
        var tokens = template.split("${");
        var item, last;
        for(var i=1; i<tokens.length; i++) {
            item = tokens[i];
            last = item.indexOf("}"); 
            if(last > 0) { 
                tokens[i] = context[item.substring(0, last)] +
                            item.substring(++last); 
            } else {
                tokens[i] = "${" + item;
            }
        }
        return tokens.join("");
    }

    /**
     * Function: createNode
     * Given a string, try to create an XML DOM node.  Throws string messages
     *     on failure.
     * 
     * Parameters:
     * text - {String} An XML string.
     *
     * Returns:
     * {DOMElement} An element node.
     */
    function createNode(text) {
        
        var index = text.indexOf('<');
        if(index > 0) {
            text = text.substring(index);
        }
        
        var doc;
        if(window.ActiveXObject && !this.xmldom) {
            doc = new ActiveXObject("Microsoft.XMLDOM");
            try {
                doc.loadXML(text);
            } catch(err) {
                throw "ActiveXObject loadXML failed: " + err;
            }
        } else if(window.DOMParser) {
            try {
                doc = new DOMParser().parseFromString(text, 'text/xml');
            } catch(err) {
                throw "DOMParser.parseFromString failed";
            }
            if(doc.documentElement && doc.documentElement.nodeName == "parsererror") {
                throw "DOMParser.parseFromString returned parsererror";
            }
        } else {
            var req = new XMLHttpRequest();
            req.open("GET", "data:text/xml;charset=utf-8," +
                     encodeURIComponent(text), false);
            if(req.overrideMimeType) {
                req.overrideMimeType("text/xml");
            }
            req.send(null);
            doc = req.responseXML;
        }
        
        var root = doc.documentElement;
        if(!root) {
            throw "no documentElement";
        }
        return root;
    }
    
    /**
     * Function assertEqual
     * Test two objects for equivalence (based on ==).  Throw an exception
     *     if not equivalent.
     * 
     * Parameters:
     * got - {Object}
     * expected - {Object}
     * msg - {String} The message to be thrown.  Can be formatted for use with
     *     formatString where got and expected (cast to string) will be
     *     substituted.
     */
    function assertEqual(got, expected, msg) {
        if(got === undefined) {
            got = "undefined";
        } else if (got === null) {
            got = "null";
        }
        if(expected === undefined) {
            expected = "undefined";
        } else if (expected === null) {
            expected = "null";
        }
        if(!msg) {
            msg = "got ${got} but expected ${expected}";
        }
        if(got != expected) {
            throw formatString(msg, {got: got, expected: expected});
        }
    }
    
    /**
     * Function assertElementNodesEqual
     * Test two element nodes for equivalence.  Nodes are considered equivalent
     *     if they are of the same type, have the same name, have the same
     *     namespace prefix and uri, and if all child nodes are equivalent.
     *     Throws a message as exception if not equivalent.
     * 
     * Parameters:
     * got - {DOMElement}
     * expected - {DOMElement}
     */
    function assertElementNodesEqual(got, expected) {
        // compare types
        assertEqual(
            got.nodeType, expected.nodeType,
            "Node type mismatch: got ${got} but expected ${expected}"
        );
        
        // compare names
        assertEqual(
            got.nodeName, expected.nodeName,
            "Node name mismatch: got ${got} but expected ${expected}"
        );
        
        // for element type nodes compare namespace, attributes, and children
        if(got.nodeType == 1) {
            
            // test namespace alias and uri
            if(got.prefix || expected.prefix) {
                assertEqual(
                    got.prefix, expected.prefix,
                    "Bad prefix for " + got.nodeName +
                    ": got ${got} but expected ${expected}"
                );
            }
            if(got.namespaceURI || expected.namespaceURI) {
                assertEqual(
                    got.namespaceURI, expected.namespaceURI,
                    "Bad namespaceURI for " + got.nodeName +
                    ": got ${got} but expected ${expected}"
                );
            }
            
            // compare attributes - disregard xmlns given namespace handling above
            var gotAttrLen = 0;
            var gotAttr = {};
            var expectedAttrLen = 0;
            var expectedAttr = {};
            var ga, ea;
            for(var i=0; i<got.attributes.length; ++i) {
                ga = got.attributes[i];
                if(ga.name.split(":").shift() != "xmlns") {
                    gotAttr[ga.name] = ga.value;
                    ++gotAttrLen;
                }
            }
            for(var i=0; i<expected.attributes.length; ++i) {
                ea = expected.attributes[i];
                if(ea.name.split(":").shift() != "xmlns") {
                    expectedAttr[ea.name] = ea.value;
                    ++expectedAttrLen;
                }
            }
            assertEqual(
                gotAttrLen, expectedAttrLen,
                "Attributes length mismatch for " + got.nodeName +
                ": got ${got} but expected ${expected}"
            );
            var gv, ev;
            for(var name in gotAttr) {
                assertEqual(
                    gotAttr[name], expectedAttr[name],
                    "Attribute value mismatch for element " + got.nodeName +
                    " attribute " + name + ": got ${got} but expected ${expected}"
                );
            }
            
            // compare children
            assertEqual(
                got.childNodes.length, expected.childNodes.length,
                "Children length mismatch for " + got.nodeName +
                ": got ${got} but expected ${expected}"
            );
            for(var j=0; j<got.childNodes.length; ++j) {
                try {
                    assertElementNodesEqual(
                        got.childNodes[j], expected.childNodes[j]
                    );
                } catch(err) {
                    throw "Bad child " + j + " for node " + got.nodeName + ": " + err;
                }
            }
        }
        return true;
    }
    
    // assign test function to AnotherWay test prototype
    var proto = Test.AnotherWay._test_object_t.prototype;    
    proto.xml_eq = function(got, expected, msg) {        
        // convert arguments to nodes if string
        if(typeof got == "string") {
            try {
                got = createNode(got);
            } catch(err) {
                this.fail("got argument could not be converted to an XML node: " + err);
                return;
            }
        }
        if(typeof expected == "string") {
            try {
                expected = createNode(expected);
            } catch(err) {
                this.fail("expected argument could not be converted to an XML node: " + err);
                return;
            }
        }
        
        // test nodes for equivalence
        try {
            assertElementNodesEqual(got, expected);
            this.ok(true, msg);
        } catch(err) {
            this.fail(err);
        }
    }
    
})();