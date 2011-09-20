/* Translators (2009 onwards):
 *  - Hamilton Abreu
 *  - Malafaya
 *  - Waldir
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["pt"]
 * Dictionary for Português.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["pt"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Servidor devolveu erro não contemplado ${statusText}",

    'Permalink': "Ligação permanente",

    'Overlays': "Sobreposições",

    'Base Layer': "Camada Base",

    'noFID': "Não é possível atualizar um elemento para a qual não há FID.",

    'browserNotSupported': "O seu navegador não suporta renderização vetorial. Actualmente os renderizadores suportados são:\n${renderers}",

    'minZoomLevelError': "A propriedade minZoomLevel só deve ser usada com as camadas descendentes da FixedZoomLevels. A verificação da propriedade por esta camada wfs é uma relíquia do passado. No entanto, não podemos removê-la sem correr o risco de afectar aplicações OL que dependam dela. Portanto, estamos a torná-la obsoleta -- a verificação minZoomLevel será removida na versão 3.0. Em vez dela, por favor, use as opções de resolução min/max descritas aqui: http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "Transacção WFS: SUCESSO ${response}",

    'commitFailed': "Transacção WFS: FALHOU ${response}",

    'googleWarning': "A Camada Google não foi correctamente carregada.\x3cbr\x3e\x3cbr\x3ePara deixar de receber esta mensagem, seleccione uma nova Camada-Base no \'\'switcher\'\' de camadas no canto superior direito.\x3cbr\x3e\x3cbr\x3eProvavelmente, isto acontece porque o \'\'script\'\' da biblioteca do Google Maps não foi incluído ou não contém a chave API correcta para o seu sítio.\x3cbr\x3e\x3cbr\x3eProgramadores: Para ajuda sobre como solucionar o problema \x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3eclique aqui\x3c/a\x3e .",

    'getLayerWarning': "A camada ${layerType} não foi correctamente carregada.\x3cbr\x3e\x3cbr\x3ePara desactivar esta mensagem, seleccione uma nova Camada-Base no \'\'switcher\'\' de camadas no canto superior direito.\x3cbr\x3e\x3cbr\x3eProvavelmente, isto acontece porque o \'\'script\'\' da biblioteca ${layerLib} não foi incluído correctamente.\x3cbr\x3e\x3cbr\x3eProgramadores: Para ajuda sobre como solucionar o problema \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3eclique aqui\x3c/a\x3e .",

    'Scale = 1 : ${scaleDenom}': "Escala = 1 : ${scaleDenom}",

    'W': "O",

    'E': "E",

    'N': "N",

    'S': "S",

    'reprojectDeprecated': "Está usando a opção \'reproject\' na camada ${layerName}. Esta opção é obsoleta: foi concebida para permitir a apresentação de dados sobre mapas-base comerciais, mas esta funcionalidade é agora suportada pelo Mercator Esférico. Mais informação está disponível em http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Este método foi declarado obsoleto e será removido na versão 3.0. Por favor, use ${newMethod} em vez disso."

});
