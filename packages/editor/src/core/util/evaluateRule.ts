import { UISchemaRule } from '../../properties/fieldPropertiesActions';

/**
 * Wertet eine JSONForms-Rule (SHOW/HIDE/DISABLE) live gegen den aktuellen
 * Testen-Modus-Datenstand aus — reine Funktion, keine Redux-/JsonForms-Abhängigkeit.
 */
export function evaluateFieldVisibility(
  rule: UISchemaRule | null | undefined,
  data: Record<string, unknown>,
): { visible: boolean; enabled: boolean } {
  if (!rule) return { visible: true, enabled: true };

  const conditionKey = rule.condition.scope.replace(/^#\/properties\//, '');
  const value = data[conditionKey];
  const conditionSchema = rule.condition.schema;
  const matches =
    'const' in conditionSchema
      ? value === conditionSchema.const
      : (conditionSchema.enum ?? []).includes(value);

  if (rule.effect === 'SHOW') {
    return { visible: matches, enabled: true };
  }
  if (rule.effect === 'HIDE') {
    return { visible: !matches, enabled: true };
  }
  if (rule.effect === 'DISABLE') {
    return { visible: true, enabled: !matches };
  }
  return { visible: true, enabled: true };
}
