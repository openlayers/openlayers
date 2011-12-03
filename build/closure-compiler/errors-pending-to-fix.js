// ********************************************
// This source file serves *ONLY* to avoid some compilation errors when the 
//      compiler uses the flag:
//          --jscomp_error undefinedVars
//
// In this source are declared all undefined variables pending to fix. This 
//      temporarily prevents undefined variable error for these names.
//
// NOTE: The compiler does not include externs files like this in the 
//      compilation result.
// ********************************************

/* Ticket: #2971 */ 
// ../lib/OpenLayers/Layer/KaMapCache.js:91: ERROR - variable DEFAULT_FORMAT is undefined
var DEFAULT_FORMAT;
//  ../lib/OpenLayers/Layer/KaMapCache.js:121: ERROR - variable paramsString is undefined
var paramsString;

/* Ticket: http://code.google.com/p/xmlhttprequest/issues/detail?id=34 */ 
// ../lib/OpenLayers/Request/XMLHttpRequest.js:252: ERROR - variable oRequest is undefined
var oRequest;
