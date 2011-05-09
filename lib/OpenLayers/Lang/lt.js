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

    'permalink': "Pastovi nuoroda",

    'overlays': "Papildomi sluoksniai",

    'baseLayer': "Pagrindinis sluoksnis",

    'sameProjection':
	"Apžvalginis žemėlapis veikia tik tada, kai jis yra tos pačios projekcijos kaip ir pagrindinis",

    'readNotImplemented': "Skaitymas nėra įgyvendintas.",

    'writeNotImplemented': "Rašymas nėra įgyvendintas.",

    'noFID': "Negaliu atnaujinti objekto, kuris neturi FID.",

    'errorLoadingGML': "Klaida užkraunant GML failą ${url}",

    'browserNotSupported':
	"Jūsų naršyklė nemoka parodyti vektorių. Šiuo metu galima naudotis tokiais rodymo varikliais:\n{renderers}",

    'componentShouldBe': "addFeatures : komponentas turi būti ${geomType}",

    // console message
    'getFeatureError':
	"getFeatureFromEvent buvo iškviestas sluoksniui, kuris neturi priskirto paišymo variklio. Tai paprastai nutinka, kai jūs pašalinate sluoksnį, bet paliekate su juo susijusį [handler]",

    'commitSuccess': "WFS Tranzakcija: PAVYKO ${response}",

    'commitFailed': "WFS Tranzakcija: ŽLUGO ${response}",

    'scale': "Mastelis = 1 : ${scaleDenom}",
    
    //labels for the graticule control
    'W': 'V',
    'E': 'R',
    'N': 'Š',
    'S': 'P',
    'graticule': 'Tinklelis',

    // console message
    'layerAlreadyAdded':
        "Bandėte pridėti prie žemėlapio sluoksnį ${layerName}, tačiau jis jau yra pridėtas",

    // console message
    'methodDeprecated':
	"Šis metodas yra pasenęs ir 3.0 versijoje bus pašalintas. " +
	"Prašome naudoti ${newMethod}.",

    // console message
    'boundsAddError': "Add funkcijai reikia pateikti tiek x, tiek y reikšmes.",

    // console message
    'lonlatAddError': "Add funkcijai reikia pateikti tiek lon, tiek lat reikšmes",

    // console message
    'pixelAddError': "Add funkcijai būtina perduoti tiek x, tiek y reikšmes.",

    // console message
    'unsupportedGeometryType': "Nepalaikomas geometrijos tipas: ${geomType}",

    // console message
    'pagePositionFailed':
        "OpenLayers.Util.pagePosition žlugo: elementas su id ${elemId} gali būti neteisingoje vietoje.",

    // **** end ****
    'end': ''
    
});
