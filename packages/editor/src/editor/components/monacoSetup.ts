/**
 * Self-hosted Monaco-Instanz (bundler-agnostisch). Lebt im Lazy-Chunk des
 * CodeModePanel: Monaco lädt erst beim Öffnen des Code-Modus, und
 * `loader.config` ist garantiert vor dem ersten `<Editor>`-Mount gelaufen
 * (kein CDN-Fallback). Die Worker-Umgebung stellt der Host bereit
 * (packages/app/src/monacoSetup.ts).
 */
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

loader.config({ monaco });
