/**
 * Editor-Version aus package.json — wird im Header angezeigt, damit der
 * Support die Frage „Welche Version läuft bei Ihnen?" beantworten kann.
 */
import pkg from '../package.json';

export const EDITOR_VERSION: string = pkg.version;
