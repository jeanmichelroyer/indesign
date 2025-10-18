// === Utilitaire de transformation ===
// Simule la commande "Redéfinir la mise à l’échelle à 100%"
function redefineScalingAs100(sel) {
    if (!sel) return;

    var img, p, orig, mx, pf, t;

    // Identifier le parent contenant l’image si sel est une image
    if (sel instanceof Image) {
        img = sel;
        p = img.parent;
    } else if (sel.hasOwnProperty('images') && sel.images.length > 0) {
        img = sel.images[0];
        p = sel;
    } else {
        p = sel;
    }

    if (!p || !p.isValid) return;

    const CS_REF = CoordinateSpaces.parentCoordinates;
    const CS_INN = CoordinateSpaces.innerCoordinates;
    const CS_PBD = CoordinateSpaces.pasteboardCoordinates;
    const BB_VIS = BoundingBoxLimits.OUTER_STROKE_BOUNDS;
    const WS_SCA = WhenScalingOptions.adjustScalingPercentage;
    const WS_RSZ = WhenScalingOptions.applyToContent;
    const MC_SCA = MatrixContent.scaleValues;

    try {
        // Point de référence central
        orig = p.resolve([AnchorPoint.centerAnchor, BB_VIS, CS_INN], CS_PBD)[0];

        // Backup de la matrice de transformation (mise à l’échelle actuelle)
        mx = p.transformValuesOf(CS_REF)[0];

        if (mx.horizontalScaleFactor == 1 && mx.verticalScaleFactor == 1) return;

        pf = app.transformPreferences;
        var backupScaling = pf.whenScaling;

        // 1. Réinitialiser la mise à l’échelle à 100 %
        pf.whenScaling = WS_SCA;
        p.transform(CS_REF, orig, [1, 0, 0, 1, 0, 0], MC_SCA);

        // 2. Rétablir la taille avec les valeurs de mise à l’échelle d’origine
        pf.whenScaling = WS_RSZ;
        p.transform(CS_REF, orig, mx, MC_SCA);

        pf.whenScaling = backupScaling; // Restaurer les préférences

    } catch (e) {
        $.writeln("Erreur sur l’objet : " + e.message);
    }
}

// === Script Principal ===
(function () {
    if (app.documents.length === 0) {
        alert("Aucun document ouvert.");
        return;
    }

    var doc = app.activeDocument;
    var sel = app.selection;
    var useSelection = sel.length > 0;

    // Tenter d'utiliser le menu natif si sélection
    var menuAction = app.menuActions.itemByName("$ID/RedefineScalingMenuString");

    if (useSelection) {
        // Si on a une sélection et que la commande est disponible, on l’utilise
        if (menuAction && menuAction.enabled) {
            menuAction.invoke();
            return;
        } else {
            // Sinon, fallback vers la version géométrique
            for (var i = 0; i < sel.length; i++) {
                redefineScalingAs100(sel[i]);
            }
            return;
        }
    }

    // Pas de sélection → on traite tout le document
    var allItems = [];
    for (var p = 0; p < doc.pages.length; p++) {
        allItems = allItems.concat(doc.pages[p].allPageItems);
    }

    app.doScript(function () {
        for (var i = 0; i < allItems.length; i++) {
            redefineScalingAs100(allItems[i]);
        }
    }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Redéfinir la mise à l’échelle à 100%");
})();
