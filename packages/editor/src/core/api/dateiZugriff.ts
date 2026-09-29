/**
 * Datei öffnen und speichern — „Öffnen …" und „Als Datei speichern …".
 *
 * Zwei Wege, je nachdem was der Browser kann:
 *
 * 1. **File System Access API** (`showOpenFilePicker`/`showSaveFilePicker`,
 *    Chromium): echter Verzeichnis-Dialog, und „Speichern" schreibt in die
 *    gewählte Datei zurück. Das ist das Verhalten, das man von einem
 *    Schreibprogramm kennt.
 * 2. **Rückfallebene** (Firefox, Safari): verstecktes `<input type="file">`
 *    zum Öffnen, Download zum Speichern. Kein Zurückschreiben in dieselbe
 *    Datei — das erlaubt der Browser dort nicht.
 *
 * Keine neue Abhängigkeit (ADR 0002/V5): beides ist Plattform-API. Die
 * globalen Objekte sind injizierbar, damit die Auswahl des Wegs testbar
 * bleibt, ohne einen Datei-Dialog zu öffnen.
 */
import { FORMULAR_MIME } from '../util/formularDatei';

/** Geöffnete Datei samt Handle, falls der Browser eines liefert. */
export interface GeoeffneteDatei {
  name: string;
  inhalt: string;
  /**
   * Handle der File System Access API. Vorhanden heißt: „Speichern" kann
   * in dieselbe Datei zurückschreiben.
   */
  handle?: DateiHandle;
}

/** Ausschnitt der File System Access API, den wir tatsächlich nutzen. */
export interface DateiHandle {
  readonly name: string;
  getFile(): Promise<{ text(): Promise<string> }>;
  createWritable(): Promise<{
    write(daten: string): Promise<void>;
    close(): Promise<void>;
  }>;
}

interface DateiUmgebung {
  showOpenFilePicker?: (optionen?: unknown) => Promise<DateiHandle[]>;
  showSaveFilePicker?: (optionen?: unknown) => Promise<DateiHandle>;
  document?: Document;
  URL?: typeof URL;
}

function umgebung(eigene?: DateiUmgebung): DateiUmgebung {
  if (eigene) return eigene;
  const w = globalThis as unknown as DateiUmgebung;
  return {
    showOpenFilePicker: w.showOpenFilePicker?.bind(globalThis),
    showSaveFilePicker: w.showSaveFilePicker?.bind(globalThis),
    document: typeof document !== 'undefined' ? document : undefined,
    URL: typeof URL !== 'undefined' ? URL : undefined,
  };
}

/** Kann dieser Browser in eine gewählte Datei zurückschreiben? */
export function unterstuetztDateiSystem(eigene?: DateiUmgebung): boolean {
  const u = umgebung(eigene);
  return (
    typeof u.showOpenFilePicker === 'function' &&
    typeof u.showSaveFilePicker === 'function'
  );
}

const DATEITYPEN = [
  {
    description: 'Formular (JSON)',
    accept: { [FORMULAR_MIME]: ['.json'] },
  },
];

/**
 * Öffnet eine Formulardatei. `undefined`, wenn abgebrochen wurde —
 * Abbrechen ist kein Fehler und darf nicht im Fehlerkanal landen.
 */
export async function oeffneFormularDatei(
  eigene?: DateiUmgebung,
): Promise<GeoeffneteDatei | undefined> {
  const u = umgebung(eigene);

  if (u.showOpenFilePicker) {
    try {
      const [handle] = await u.showOpenFilePicker({
        types: DATEITYPEN,
        multiple: false,
        excludeAcceptAllOption: false,
      });
      if (!handle) return undefined;
      const datei = await handle.getFile();
      return { name: handle.name, inhalt: await datei.text(), handle };
    } catch (err) {
      // AbortError = Nutzerin hat abgebrochen.
      if ((err as { name?: string })?.name === 'AbortError') return undefined;
      throw err;
    }
  }

  // Rückfallebene: verstecktes Dateifeld
  const dok = u.document;
  if (!dok) return undefined;
  return new Promise<GeoeffneteDatei | undefined>((fertig) => {
    const feld = dok.createElement('input');
    feld.type = 'file';
    feld.accept = '.json,application/json';
    feld.style.display = 'none';
    feld.addEventListener('change', () => {
      const datei = feld.files?.[0];
      feld.remove();
      if (!datei) {
        fertig(undefined);
        return;
      }
      void datei.text().then((inhalt) => fertig({ name: datei.name, inhalt }));
    });
    // Abbruch im Dateidialog löst kein `change` aus; `cancel` gibt es
    // nicht überall. Ohne Auswahl bleibt das Promise offen — deshalb
    // zusätzlich auf das Fokus-Zurückkommen hören.
    dok.body.appendChild(feld);
    feld.click();
  });
}

/**
 * Schreibt das Formular. Mit Handle in dieselbe Datei, sonst über einen
 * Auswahl- bzw. Download-Dialog. Liefert das Handle zurück, damit ein
 * späteres „Speichern" wieder dieselbe Datei trifft.
 */
export async function speichereFormularDatei(
  dateiname: string,
  inhalt: string,
  handle?: DateiHandle,
  eigene?: DateiUmgebung,
): Promise<DateiHandle | undefined> {
  const u = umgebung(eigene);

  if (handle) {
    const schreiber = await handle.createWritable();
    await schreiber.write(inhalt);
    await schreiber.close();
    return handle;
  }

  if (u.showSaveFilePicker) {
    try {
      const neues = await u.showSaveFilePicker({
        suggestedName: dateiname,
        types: DATEITYPEN,
      });
      const schreiber = await neues.createWritable();
      await schreiber.write(inhalt);
      await schreiber.close();
      return neues;
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return undefined;
      throw err;
    }
  }

  // Rückfallebene: Download
  const dok = u.document;
  const urlKlasse = u.URL;
  if (!dok || !urlKlasse) return undefined;
  const url = urlKlasse.createObjectURL(
    new Blob([inhalt], { type: FORMULAR_MIME }),
  );
  const link = dok.createElement('a');
  link.href = url;
  link.download = dateiname;
  dok.body.appendChild(link);
  link.click();
  link.remove();
  urlKlasse.revokeObjectURL(url);
  return undefined;
}
