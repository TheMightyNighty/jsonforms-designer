/**
 * Self-hosted Monaco-Instanz (bundler-agnostisch).
 *
 * Lebt bewusst im Lazy-Chunk des CodeModePanel: `monaco-editor` (~4 MB)
 * wird erst geladen, wenn der Code-Modus tatsächlich geöffnet wird — das
 * Initial-Bundle bleibt schlank. Da dieses Modul im selben Chunk wie der
 * `<Editor>` ausgewertet wird, ist `loader.config` garantiert vor dem
 * ersten Mount gelaufen (kein Lade-Race, kein CDN-Fallback).
 *
 * Die Worker-Umgebung (`self.MonacoEnvironment`) stellt der Host bereit,
 * weil Worker-Bundling bundlerspezifisch ist — Vite-Rezept siehe
 * packages/app/src/monacoSetup.ts.
 */
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

loader.config({ monaco });
