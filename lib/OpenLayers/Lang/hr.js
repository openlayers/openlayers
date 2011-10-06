/* Translators (2009 onwards):
 *  - Mvrban
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["hr"]
 * Dictionary for Hrvatski.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["hr"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Nepodržani zahtjev ${statusText}",

    'Permalink': "Permalink",

    'Overlays': "Overlays",

    'Base Layer': "Osnovna karta",

    'noFID': "Ne mogu ažurirati značajku za koju ne postoji FID.",

    'browserNotSupported': "Vaš preglednik ne podržava vektorsko renderiranje. Trenutno podržani rendereri su: ${renderers}",

    'commitSuccess': "WFS Transakcija: USPJEŠNA ${response}",

    'commitFailed': "WFS Transakcija: NEUSPJEŠNA ${response}",

    'Scale = 1 : ${scaleDenom}': "Mjerilo = 1 : ${scaleDenom}",

    'methodDeprecated': "Ova metoda nije odobrena i biti će maknuta u 3.0. Koristite ${newMethod}."

});
