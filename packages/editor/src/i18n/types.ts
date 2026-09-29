/** Übersetzungs-Interface — alle Werte string, nicht Literale */
export interface EditorTranslations {
  header: {
    title: string;
    undo: string;
    redo: string;
    template: string;
    copySchema: string;
    codeModeOn: string;
    codeModeOff: string;
    testModeOn: string;
    testModeOff: string;
    exportImport: string;
    metadaten: string;
    zeilennummern: string;
    sprache: string;
    weitere: string;
    menue: {
      datei: string;
      bearbeiten: string;
      ansicht: string;
      formular: string;
      hilfe: string;
    };
    hilfe: {
      anleitung: string;
      anleitungTitel: string;
      anleitungEinleitung: string;
      schritte: string[];
      tastatur: string;
      tastaturTitel: string;
      kuerzel: Array<{ taste: string; was: string }>;
      tipp: string;
      tippTitel: string;
      tipps: string[];
      naechsterTipp: string;
      beimStart: string;
      ueber: string;
      ueberTitel: string;
      version: string;
      lizenz: string;
      lizenzen: string;
      lizenzenTitel: string;
      lizenzenEinleitung: string;
      komponente: string;
      wofuer: string;
    };
    ablage: {
      menue: string;
      oeffnenDatei: string;
      speichern: string;
      speichernUnter: string;
      zuletzt: string;
      dateiFehler: string;
      gespeichert: string;
      neu: string;
      oeffnen: string;
      oeffnenTitel: string;
      speichernAls: string;
      umbenennen: string;
      loeschen: string;
      loeschenTitel: string;
      loeschenFrage: string;
      leer: string;
      name: string;
      uebernehmen: string;
      unbenannt: string;
    };
    qualitaet: {
      titel: string;
      alsButton: string;
      ohneBefund: string;
      fehler: string;
      hinweise: string;
      /** Textvorlagen je Prüfregel; Platzhalter in der Form {name}. */
      regeln: Record<string, string>;
    };
    ausprobieren: string;
    bearbeiten: string;
    status: {
      entwurf: string;
      speichert: string;
      geradeEben: string;
      gespeichertVor: string;
      fehler: string;
      sekunden: string;
      minuten: string;
      stunden: string;
    };
  };
  bereiche: {
    palette: string;
    arbeitsflaeche: string;
    eigenschaften: string;
  };
  /**
   * Feldtyp-Texte je Katalog-id (ADR 0007). Der Katalog in `field-types/`
   * kennt keine Sprache; jede id dort braucht hier einen Eintrag, und ein
   * Test hält beide Kataloge deckungsgleich.
   */
  feldtypen: Record<
    string,
    { name: string; label: string; beschreibung: string }
  >;
  erweiterungen: {
    vonUrl: string;
    urlPlatzhalter: string;
    laden: string;
    ladeFehler: {
      nichtErreichbar: string;
      keinJson: string;
      unbrauchbar: string;
    };
    menue: string;
    titel: string;
    einleitung: string;
    leer: string;
    hinzufuegen: string;
    entfernen: string;
    aktiv: string;
    keinJson: string;
    unbrauchbar: string;
  };
  metadaten: {
    titel: string;
    formularTitel: string;
    formularTitelHinweis: string;
    beschreibung: string;
    beschreibungHinweis: string;
    urn: string;
    urnPlatzhalter: string;
    urnHinweis: string;
    urnFehler: string;
    urnVorschlag: string;
    abschnittHerausgeber: string;
    herausgeber: string;
    herausgeberPlatzhalter: string;
    herausgeberHinweis: string;
    rechtsgrundlage: string;
    rechtsgrundlagePlatzhalter: string;
    rechtsgrundlageHinweis: string;
    abschnittVersion: string;
    version: string;
    versionPlatzhalter: string;
    versionHinweis: string;
    gueltigAb: string;
    sprache: string;
    sprachen: { de: string; en: string };
  };
  palette: {
    feldTooltip: string;
    feldHinzufuegen: string;
    groups: {
      eingabe: string;
      auswahl: string;
      struktur: string;
      layout: string;
      opencode: string;
    };
    validators: string;
    uiBausteine: string;
    suche: string;
    suchergebnisse: string;
    weitereFeldtypen: string;
    bausteineLeer: string;
    bausteineFehler: string;
    fimSucheHinweis: string;
    tabs: {
      bausteine: string;
      fim: string;
      einzelfelder: string;
    };
    fim: {
      title: string;
      datenfeldgruppen: string;
      datenfelder: string;
      suche: string;
      sucheHint: string;
      sucheMinLength: string;
      keineTreffer: string;
      quelle: string;
    };
  };
  editor: {
    dropHint: string;
    dropHere: string;
    ablegen: string;
    spalte: string;
    feldHierher: string;
    mehrstufig: string;
    seite: string;
    neuerTab: string;
    leer: {
      bereich: string;
      titel: string;
      tastatur: string;
    };
    geraet: {
      desktop: string;
      handy: string;
      hinweis: string;
    };
  };
  properties: {
    feldtypUnbekannt: string;
    emptyHint: string;
    label: string;
    description: string;
    placeholder: string;
    required: string;
    options: string;
    validatoren: string;
    tabs: {
      inhalt: string;
      pruefung: string;
      bedingungen: string;
      uebersetzung: string;
    };
    feldtypWechseln: string;
    vorschlag: {
      text: string;
      uebernehmen: string;
      ignorieren: string;
    };
    feldtypWechselHinweis: string;
    feldtypGleicheAntwort: string;
    feldtypAndereAntwort: string;
    wechsel: {
      titel: string;
      einleitung: string;
      andereAntwort: string;
      optionen: string;
      pruefungen: string;
      bedingungen: string;
      abbrechen: string;
      bestaetigen: string;
    };
    bedingung: {
      titel: string;
      aktivieren: string;
      keineFelder: string;
      nurAnzeigen: string;
      ausblenden: string;
      sperren: string;
      wenn: string;
      istGleich: string;
      istNichtGleich: string;
      wert: string;
    };
    keineValidatoren: string;
    keinePassendenValidatoren: string;
    feldtyp: string;
    textElement: string;
    gruppe: string;
    spaltenLayout: string;
    textInhalt: string;
    gruppenTitle: string;
  };
  dialog: {
    ofmHinweis: string;
    ofmFehlend: string;
    ofmHerunterladen: string;
    ofmFussnote: string;
    xdfHinweis: string;
    xdfHerunterladen: string;
    xdfFussnote: string;
    migrationHinweis: string;
    speichern: string;
    templateTitle: string;
    templateLoad: string;
    cancel: string;
    close: string;
    exportTitle: string;
    schemaTab: string;
    uiSchemaTab: string;
    importTab: string;
    importHint: string;
    importError: string;
    invalidJson: string;
    selectFile: string;
    download: string;
  };
  mobile: { fields: string; editor: string; properties: string };
  preview: { noContent: string };
  actions: {
    kopieLabel: string;
    duplicate: string;
    remove: string;
    rename: string;
    release: string;
    deleteContainer: string;
  };
}
