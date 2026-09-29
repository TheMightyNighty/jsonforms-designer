// Matcher von jest-dom (toBeVisible, toHaveValue …) für Vitest registrieren.
// Der `/vitest`-Einstieg erweitert Vitests Assertion-Typen; der alte,
// jest-orientierte Einstieg tat das nicht mehr, seit Vitest 5 seine
// Typen umgestellt hat.
import '@testing-library/jest-dom/vitest';
