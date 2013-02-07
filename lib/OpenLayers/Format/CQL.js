/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WKT.js
 * @requires OpenLayers/Filter/Comparison.js
 * @requires OpenLayers/Filter/Logical.js
 * @requires OpenLayers/Filter/Spatial.js
 */

/**
 * Class: OpenLayers.Format.CQL
 * Read CQL strings to get <OpenLayers.Filter> objects.  Write 
 *     <OpenLayers.Filter> objects to get CQL strings. Create a new parser with 
 *     the <OpenLayers.Format.CQL> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Format>
 */
OpenLayers.Format.CQL = (function() {
    
    var tokens = [
        "PROPERTY", "COMPARISON", "VALUE", "LOGICAL"
    ],

    patterns = {
        PROPERTY: /^[_a-zA-Z]\w*/,
        COMPARISON: /^(=|<>|<=|<|>=|>|LIKE)/i,
        IS_NULL: /^IS NULL/i,
        COMMA: /^,/,
        LOGICAL: /^(AND|OR)/i,
        VALUE: /^('([^']|'')*'|\d+(\.\d*)?|\.\d+)/,
        LPAREN: /^\(/,
        RPAREN: /^\)/,
        SPATIAL: /^(BBOX|INTERSECTS|DWITHIN|WITHIN|CONTAINS)/i,
        NOT: /^NOT/i,
        BETWEEN: /^BETWEEN/i,
        GEOMETRY: function(text) {
            var type = /^(POINT|LINESTRING|POLYGON|MULTIPOINT|MULTILINESTRING|MULTIPOLYGON|GEOMETRYCOLLECTION)/.exec(text);
            if (type) {
                var len = text.length;
                var idx = text.indexOf("(", type[0].length);
                if (idx > -1) {
                    var depth = 1;
                    while (idx < len && depth > 0) {
                        idx++;
                        switch(text.charAt(idx)) {
                            case '(':
                                depth++;
                                break;
                            case ')':
                                depth--;
                                break;
                            default:
                                // in default case, do nothing
                        }
                    }
                }
                return [text.substr(0, idx+1)];
            }
        },
        END: /^$/
    },

    follows = {
        LPAREN: ['GEOMETRY', 'SPATIAL', 'PROPERTY', 'VALUE', 'LPAREN'],
        RPAREN: ['NOT', 'LOGICAL', 'END', 'RPAREN'],
        PROPERTY: ['COMPARISON', 'BETWEEN', 'COMMA', 'IS_NULL'],
        BETWEEN: ['VALUE'],
        IS_NULL: ['END'],
        COMPARISON: ['VALUE'],
        COMMA: ['GEOMETRY', 'VALUE', 'PROPERTY'],
        VALUE: ['LOGICAL', 'COMMA', 'RPAREN', 'END'],
        SPATIAL: ['LPAREN'],
        LOGICAL: ['NOT', 'VALUE', 'SPATIAL', 'PROPERTY', 'LPAREN'],
        NOT: ['PROPERTY', 'LPAREN'],
        GEOMETRY: ['COMMA', 'RPAREN']
    },

    operators = {
        '=': OpenLayers.Filter.Comparison.EQUAL_TO,
        '<>': OpenLayers.Filter.Comparison.NOT_EQUAL_TO,
        '<': OpenLayers.Filter.Comparison.LESS_THAN,
        '<=': OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO,
        '>': OpenLayers.Filter.Comparison.GREATER_THAN,
        '>=': OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
        'LIKE': OpenLayers.Filter.Comparison.LIKE,
        'BETWEEN': OpenLayers.Filter.Comparison.BETWEEN,
        'IS NULL': OpenLayers.Filter.Comparison.IS_NULL
    },

    operatorReverse = {},

    logicals = {
        'AND': OpenLayers.Filter.Logical.AND,
        'OR': OpenLayers.Filter.Logical.OR
    },

    logicalReverse = {},

    precedence = {
        'RPAREN': 3,
        'LOGICAL': 2,
        'COMPARISON': 1
    };

    var i;
    for (i in operators) {
        if (operators.hasOwnProperty(i)) {
            operatorReverse[operators[i]] = i;
        }
    }

    for (i in logicals) {
        if (logicals.hasOwnProperty(i)) {
            logicalReverse[logicals[i]] = i;
        }
    }

    function tryToken(text, pattern) {
        if (pattern instanceof RegExp) {
            return pattern.exec(text);
        } else {
            return pattern(text);
        }
    }

    function nextToken(text, tokens) {
        var i, token, len = tokens.length;
        for (i=0; i<len; i++) {
            token = tokens[i];
            var pat = patterns[token];
            var matches = tryToken(text, pat);
            if (matches) {
                var match = matches[0];
                var remainder = text.substr(match.length).replace(/^\s*/, "");
                return {
                    type: token,
                    text: match,
                    remainder: remainder
                };
            }
        }

        var msg = "ERROR: In parsing: [" + text + "], expected one of: ";
        for (i=0; i<len; i++) {
            token = tokens[i];
            msg += "\n    " + token + ": " + patterns[token];
        }

        throw new Error(msg);
    }

    function tokenize(text) {
        var results = [];
        var token, expect = ["NOT", "GEOMETRY", "SPATIAL", "PROPERTY", "LPAREN"];

        do {
            token = nextToken(text, expect);
            text = token.remainder;
            expect = follows[token.type];
            if (token.type != "END" && !expect) {
                throw new Error("No follows list for " + token.type);
            }
            results.push(token);
        } while (token.type != "END");

        return results;
    }

    function buildAst(tokens) {
        var operatorStack = [],
            postfix = [];

        while (tokens.length) {
            var tok = tokens.shift();
            switch (tok.type) {
                case "PROPERTY":
                case "GEOMETRY":
                case "VALUE":
                    postfix.push(tok);
                    break;
                case "COMPARISON":
                case "BETWEEN":
                case "IS_NULL":
                case "LOGICAL":
                    var p = precedence[tok.type];

                    while (operatorStack.length > 0 &&
                        (precedence[operatorStack[operatorStack.length - 1].type] <= p)
                    ) {
                        postfix.push(operatorStack.pop());
                    }

                    operatorStack.push(tok);
                    break;
                case "SPATIAL":
                case "NOT":
                case "LPAREN":
                    operatorStack.push(tok);
                    break;
                case "RPAREN":
                    while (operatorStack.length > 0 &&
                        (operatorStack[operatorStack.length - 1].type != "LPAREN")
                    ) {
                        postfix.push(operatorStack.pop());
                    }
                    operatorStack.pop(); // toss out the LPAREN

                    if (operatorStack.length > 0 &&
                        operatorStack[operatorStack.length-1].type == "SPATIAL") {
                        postfix.push(operatorStack.pop());
                    }
                case "COMMA":
                case "END":
                    break;
                default:
                    throw new Error("Unknown token type " + tok.type);
            }
        }

        while (operatorStack.length > 0) {
            postfix.push(operatorStack.pop());
        }

        function buildTree() {
            var tok = postfix.pop();
            switch (tok.type) {
                case "LOGICAL":
                    var rhs = buildTree(),
                        lhs = buildTree();
                    return new OpenLayers.Filter.Logical({
                        filters: [lhs, rhs],
                        type: logicals[tok.text.toUpperCase()]
                    });
                case "NOT":
                    var operand = buildTree();
                    return new OpenLayers.Filter.Logical({
                        filters: [operand],
                        type: OpenLayers.Filter.Logical.NOT
                    });
                case "BETWEEN":
                    var min, max, property;
                    postfix.pop(); // unneeded AND token here
                    max = buildTree();
                    min = buildTree();
                    property = buildTree();
                    return new OpenLayers.Filter.Comparison({
                        property: property,
                        lowerBoundary: min,
                        upperBoundary: max,
                        type: OpenLayers.Filter.Comparison.BETWEEN
                    });
                case "COMPARISON":
                    var value = buildTree(),
                        property = buildTree();
                    return new OpenLayers.Filter.Comparison({
                        property: property,
                        value: value,
                        type: operators[tok.text.toUpperCase()]
                    });
                case "IS_NULL":
                    var property = buildTree();
                    return new OpenLayers.Filter.Comparison({
                        property: property,
                        type: operators[tok.text.toUpperCase()]
                    });
                case "VALUE":
                    var match = tok.text.match(/^'(.*)'$/);
                    if (match) {
                        return match[1].replace(/''/g, "'");
                    } else {
                        return Number(tok.text);
                    }
                case "SPATIAL":
                    switch(tok.text.toUpperCase()) {
                        case "BBOX":
                            var maxy = buildTree(),
                                maxx = buildTree(),
                                miny = buildTree(),
                                minx = buildTree(),
                                prop = buildTree();

                            return new OpenLayers.Filter.Spatial({
                                type: OpenLayers.Filter.Spatial.BBOX,
                                property: prop,
                                value: OpenLayers.Bounds.fromArray(
                                    [minx, miny, maxx, maxy]
                                )
                            });
                        case "INTERSECTS":
                            var value = buildTree(),
                                property = buildTree();
                            return new OpenLayers.Filter.Spatial({
                                type: OpenLayers.Filter.Spatial.INTERSECTS,
                                property: property,
                                value: value
                            });
                        case "WITHIN":
                            var value = buildTree(),
                                property = buildTree();
                            return new OpenLayers.Filter.Spatial({
                                type: OpenLayers.Filter.Spatial.WITHIN,
                                property: property,
                                value: value
                            });
                        case "CONTAINS":
                            var value = buildTree(),
                                property = buildTree();
                            return new OpenLayers.Filter.Spatial({
                                type: OpenLayers.Filter.Spatial.CONTAINS,
                                property: property,
                                value: value
                            });
                        case "DWITHIN":
                            var distance = buildTree(),
                                value = buildTree(),
                                property = buildTree();
                            return new OpenLayers.Filter.Spatial({
                                type: OpenLayers.Filter.Spatial.DWITHIN,
                                value: value,
                                property: property,
                                distance: Number(distance)
                            });
                    }
                case "GEOMETRY":
                    return OpenLayers.Geometry.fromWKT(tok.text);
                default:
                    return tok.text;
            }
        }

        var result = buildTree();
        if (postfix.length > 0) {
            var msg = "Remaining tokens after building AST: \n";
            for (var i = postfix.length - 1; i >= 0; i--) {
                msg += postfix[i].type + ": " + postfix[i].text + "\n";
            }
            throw new Error(msg);
        }

        return result;
    }

    return OpenLayers.Class(OpenLayers.Format, {
        /**
         * APIMethod: read
         * Generate a filter from a CQL string.

         * Parameters:
         * text - {String} The CQL text.
         *
         * Returns:
         * {<OpenLayers.Filter>} A filter based on the CQL text.
         */
        read: function(text) { 
            var result = buildAst(tokenize(text));
            if (this.keepData) {
                this.data = result;
            }
            return result;
        },

        /**
         * APIMethod: write
         * Convert a filter into a CQL string.

         * Parameters:
         * filter - {<OpenLayers.Filter>} The filter.
         *
         * Returns:
         * {String} A CQL string based on the filter.
         */
        write: function(filter) {
            if (filter instanceof OpenLayers.Geometry) {
                return filter.toString();
            }
            switch (filter.CLASS_NAME) {
                case "OpenLayers.Filter.Spatial":
                    switch(filter.type) {
                        case OpenLayers.Filter.Spatial.BBOX:
                            return "BBOX(" +
                                filter.property + "," +
                                filter.value.toBBOX() +
                                ")";
                        case OpenLayers.Filter.Spatial.DWITHIN:
                            return "DWITHIN(" +
                                filter.property + ", " +
                                this.write(filter.value) + ", " +
                                filter.distance + ")";
                        case OpenLayers.Filter.Spatial.WITHIN:
                            return "WITHIN(" +
                                filter.property + ", " +
                                this.write(filter.value) + ")";
                        case OpenLayers.Filter.Spatial.INTERSECTS:
                            return "INTERSECTS(" +
                                filter.property + ", " +
                                this.write(filter.value) + ")";
                        case OpenLayers.Filter.Spatial.CONTAINS:
                            return "CONTAINS(" +
                                filter.property + ", " +
                                this.write(filter.value) + ")";
                        default:
                            throw new Error("Unknown spatial filter type: " + filter.type);
                    }
                case "OpenLayers.Filter.Logical":
                    if (filter.type == OpenLayers.Filter.Logical.NOT) {
                        // TODO: deal with precedence of logical operators to 
                        // avoid extra parentheses (not urgent)
                        return "NOT (" + this.write(filter.filters[0]) + ")";
                    } else {
                        var res = "(";
                        var first = true;
                        for (var i = 0; i < filter.filters.length; i++) {
                            if (first) {
                                first = false;
                            } else {
                                res += ") " + logicalReverse[filter.type] + " (";
                            }
                            res += this.write(filter.filters[i]);
                        }
                        return res + ")";
                    }
                case "OpenLayers.Filter.Comparison":
                    if (filter.type == OpenLayers.Filter.Comparison.BETWEEN) {
                        return filter.property + " BETWEEN " + 
                            this.write(filter.lowerBoundary) + " AND " + 
                            this.write(filter.upperBoundary);
                    } else {
                        return (filter.value !== null) ? filter.property +
                            " " + operatorReverse[filter.type] + " " + 
                            this.write(filter.value) : filter.property +
                            " " + operatorReverse[filter.type];
                    }
                case undefined:
                    if (typeof filter === "string") {
                        return "'" + filter.replace(/'/g, "''") + "'";
                    } else if (typeof filter === "number") {
                        return String(filter);
                    }
                default:
                    throw new Error("Can't encode: " + filter.CLASS_NAME + " " + filter);
            }
        },

        CLASS_NAME: "OpenLayers.Format.CQL"

    });
})();

