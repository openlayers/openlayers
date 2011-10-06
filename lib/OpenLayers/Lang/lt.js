/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["lt"]
 * Dictionary for Lithuanian.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang['lt'] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Neapdorota užklausa gražino ${statusText}",

    'Permalink': "Pastovi nuoroda",

    'Overlays': "Papildomi sluoksniai",

    'Base Layer': "Pagrindinis sluoksnis",

    'noFID': "Negaliu atnaujinti objekto, kuris neturi FID.",

    'browserNotSupported':
	"Jūsų naršyklė nemoka parodyti vektorių. Šiuo metu galima naudotis tokiais rodymo varikliais:\n{renderers}",

    'commitSuccess': "WFS Tranzakcija: PAVYKO ${response}",

    'commitFailed': "WFS Tranzakcija: ŽLUGO ${response}",

    'Scale = 1 : ${scaleDenom}': "Mastelis = 1 : ${scaleDenom}",
    
    //labels for the graticule control
    'W': 'V',
    'E': 'R',
    'N': 'Š',
    'S': 'P',
    'Graticule': 'Tinklelis',

    // console message
    'methodDeprecated':
	"Šis metodas yra pasenęs ir 3.0 versijoje bus pašalintas. " +
	"Prašome naudoti ${newMethod}.",

    // **** end ****
    'end': ''
    
});
