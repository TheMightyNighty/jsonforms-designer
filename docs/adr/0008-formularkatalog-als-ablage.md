# ADR 0008: Formularkatalog als Ablage

**Status:** Akzeptiert (2026-10)
**Kontext:** packages/editor — `katalog/`, `core/util/jsonFormsExport.ts`; packages/app

## Kontext

Der Designer soll Formulare nicht nur im Browser ablegen, sondern in
einem Formularkatalog, aus dem ein Portal sie ausliefert (erster
Anwendungsfall: die Verwaltungs-Service-Plattform als Ersatz für LUCOM
LIP). Der Katalog versioniert Formulare: Ein Entwurf wird von einer
zweiten Person freigegeben (Vier-Augen-Prinzip) und ist danach
unveränderlich.

ADR 0006 hat dafür die Schnittstelle vorbereitet: Ein Persistenz-Adapter
kann eine `FormularAblage` mitbringen. `HttpFieldStateService` bringt
bewusst keine mit, weil Ablage und Berechtigung am Fachverfahren hängen.

## Entscheidung

Ein eigenes Modul `katalog/` im Editor-Paket mit
`KatalogFieldStateService`: Persistenz-Adapter samt Ablage gegen die
Redaktions-API des Katalogs.

- **Kennung = id, Titel = Name.** Die Kennung wird aus dem Titel
  abgeleitet (`kennungAusTitel`); ist sie vergeben, folgt ein Zähler.
- **Der Auto-Save schreibt den Entwurf**, und zwar Schema, das
  JSONForms-UI-Schema (`buildJsonFormsUiSchema`) und den Arbeitsstand
  des Editors. Das Portal braucht die ersten beiden, der Editor den
  dritten, um ein Formular verlustfrei wieder zu öffnen.
- **Nur echte Änderungen werden gespeichert, und nur mit
  Redaktionsrecht.** Der Editor speichert nach jedem Laden den geladenen
  Zustand. Gegen den Katalog legte schon das Ansehen einen Entwurf an,
  und die ansehende Person dürfte ihn wegen des Vier-Augen-Prinzips nicht
  mehr freigeben. Verglichen wird unabhängig von der Schlüsselreihenfolge
  und ohne den aktiven Reiter.
- **„Neues Formular“ legt nichts im Katalog an.** Angelegt wird
  ausdrücklich über „Im Katalog anlegen …“ in der Fußleiste, mit Titel;
  daraus entsteht die feste Kennung. Ein aus einer Datei geöffnetes
  Formular übernimmt die Ablage wie bisher sofort (Kern-Verhalten).
- **Löschen gibt es im Katalog nicht.** Freigegebene Versionen sind Belege
  für eingereichte Anträge; der Adapter meldet einen Fehler.
- **Freigabe als Fußleiste** (`erzeugeKatalogLeiste`) über den
  vorhandenen `footer`-Slot, nicht in der Befehlsleiste. Der Kern bleibt
  unberührt; die Leiste zeigt Stand, Speicherstatus und sperrt die
  Freigabe mit Begründung (kein Recht, kein Entwurf, Vier-Augen).
- **Kein OIDC im Editor-Paket.** Der Host übergibt eine Funktion, die ein
  Zugriffstoken liefert. Die Demo-App meldet sich mit `oidc-client-ts`
  an (PKCE, Token nur im Arbeitsspeicher), wenn der Build
  `VITE_KATALOG_API` und `VITE_OIDC_AUTHORITY` kennt.

Die Umwandlung in JSONForms-UI-Schema lag bisher privat in der Vorschau.
Sie liegt jetzt in `core/util/jsonFormsExport.ts`; die Vorschau nutzt sie
mit ihrem eigenen Element-Konverter.

## Konsequenzen

- Hosts mit einem Katalog bekommen Ablage, Auto-Save und Freigabe ohne
  eigenen Code; Hosts ohne Katalog merken nichts.
- Der Adapter ist an die Redaktions-API der VSP gebunden. Ein anderer
  Katalog braucht einen eigenen Adapter oder dieselbe API.
- Formulare ohne Arbeitsstand (z. B. per Datei in den Katalog gebracht)
  öffnet der Adapter über `fieldStateFromSchemas`; Reiter
  (Categorization) gehen dabei verloren, wie bei jedem Import.
- Offen: Der Export-Dialog baut sein UI-Schema weiterhin selbst und
  berücksichtigt keine Reiter. Er sollte auf `buildJsonFormsUiSchema`
  umgestellt werden.
- Offen: Der Editor kennt keinen Nur-Lesen-Modus. Ohne Redaktionsrecht
  lassen sich Felder ändern, die nicht gespeichert werden; die Fußleiste
  weist darauf hin, die Speicheranzeige in der Kopfzeile meldet trotzdem
  „gespeichert“, weil der Adapter übersprungene Speichervorgänge nicht
  von erfolgreichen unterscheiden kann.
- Offen: Die Fußleiste nennt bei fremden Entwürfen die Kennung (`sub`)
  der bearbeitenden Person, keinen Namen; der Katalog speichert nur sie.
