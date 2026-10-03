/**
 * Anmeldung am Formularkatalog (OIDC Authorization Code Flow mit PKCE).
 *
 * Aktiv nur, wenn der Build `VITE_KATALOG_API` und `VITE_OIDC_AUTHORITY`
 * kennt; sonst arbeitet der Designer wie bisher im Browser-Speicher.
 *
 * Tokens liegen nur im Arbeitsspeicher der Seite. Nach einem Neuladen
 * meldet die bestehende Keycloak-Sitzung die Person ohne Passwort wieder
 * an; ein im Browser abgelegtes Token könnte ein eingeschleustes Skript
 * dagegen dauerhaft auslesen.
 */
import {
  InMemoryWebStorage,
  UserManager,
  WebStorageStateStore,
} from 'oidc-client-ts';

export interface KatalogKonfig {
  api: string;
  authority: string;
  clientId: string;
}

export function katalogKonfig(): KatalogKonfig | undefined {
  const api = import.meta.env.VITE_KATALOG_API as string | undefined;
  const authority = import.meta.env.VITE_OIDC_AUTHORITY as string | undefined;
  if (!api || !authority) return undefined;
  return {
    api,
    authority,
    clientId:
      (import.meta.env.VITE_OIDC_CLIENT_ID as string | undefined) ??
      'vsp-designer',
  };
}

function absolut(adresse: string): string {
  return new URL(adresse, window.location.origin).toString();
}

/**
 * Meldet an und liefert eine Funktion, die ein gültiges Zugriffstoken
 * holt. Ohne Anmeldung leitet die Seite zu Keycloak um; das zurückgegebene
 * Promise erfüllt sich dann nicht mehr.
 */
export async function anmelden(
  konfig: KatalogKonfig,
): Promise<() => Promise<string>> {
  const rueckkehr = window.location.origin + window.location.pathname;
  const manager = new UserManager({
    authority: absolut(konfig.authority),
    client_id: konfig.clientId,
    redirect_uri: rueckkehr,
    post_logout_redirect_uri: rueckkehr,
    response_type: 'code',
    scope: 'openid',
    userStore: new WebStorageStateStore({ store: new InMemoryWebStorage() }),
    automaticSilentRenew: false,
  });

  const params = new URLSearchParams(window.location.search);
  if (params.has('code') && params.has('state')) {
    await manager.signinCallback();
    window.history.replaceState(null, '', rueckkehr);
  }

  const user = await manager.getUser();
  if (!user || user.expired) {
    await manager.signinRedirect();
    return new Promise(() => undefined);
  }

  return async () => {
    let aktuell = await manager.getUser();
    if (!aktuell || (aktuell.expires_in ?? 0) < 30) {
      aktuell = await manager.signinSilent();
    }
    if (!aktuell) throw new Error('Anmeldung abgelaufen');
    return aktuell.access_token;
  };
}
