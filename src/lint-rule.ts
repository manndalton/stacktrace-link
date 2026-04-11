import { LintRule, LintIssue } from './lint';

export interface CustomRuleDefinition {
  id: string;
  description: string;
  pattern: string;
  message: string;
  severity: 'warning' | 'error';
}

export function buildRuleFromDefinition(def: CustomRuleDefinition): LintRule {
  const regex = new RegExp(def.pattern);
  return {
    id: def.id,
    description: def.description,
    check: (line: string, lineNumber: number): LintIssue | null => {
      if (regex.test(line)) {
        return { ruleId: def.id, message: def.message, line: lineNumber, severity: def.severity };
      }
      return null;
    }
  };
}

export function validateRuleDefinition(def: Partial<CustomRuleDefinition>): string[] {
  const errors: string[] = [];
  if (!def.id || typeof def.id !== 'string') errors.push('id is required and must be a string');
  if (!def.description) errors.push('description is required');
  if (!def.pattern) errors.push('pattern is required');
  else {
    try { new RegExp(def.pattern); }
    catch { errors.push('pattern is not a valid regular expression'); }
  }
  if (!def.message) errors.push('message is required');
  if (!def.severity || !['warning', 'error'].includes(def.severity)) {
    errors.push('severity must be "warning" or "error"');
  }
  return errors;
}

export function mergeRules(base: LintRule[], overrides: LintRule[]): LintRule[] {
  const map = new Map<string, LintRule>(base.map(r => [r.id, r]));
  for (const rule of overrides) map.set(rule.id, rule);
  return Array.from(map.values());
}
