import { jsonrepair } from 'jsonrepair';
import type { AiSuggestion } from '../types';

/**
 * Find a balanced `{ ... }` slice starting at `start`, respecting JSON string rules.
 */
function findBalancedObject(text: string, start: number): [number, number] | null {
  if (text[start] !== '{') {
    return null;
  }
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (c === '\\') {
        escape = true;
        continue;
      }
      if (c === '"') {
        inString = false;
      }
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === '{') {
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0) {
        return [start, i + 1];
      }
    }
  }
  return null;
}

function stripCodeFences(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, '');
  s = s.replace(/\s*```\s*$/i, '');
  return s.trim();
}

/**
 * Try to fix common Copilot issues: unescaped " inside string values is not fixable safely.
 * Replace curly/smart quotes that sometimes break JSON.
 */
function normalizeQuotesForParse(s: string): string {
  return s
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
}

/**
 * Extract every candidate JSON object substring from messy chat output.
 */
function collectJsonCandidates(raw: string): string[] {
  const cleaned = stripCodeFences(raw);
  const candidates: string[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] !== '{') {
      continue;
    }
    const bounds = findBalancedObject(cleaned, i);
    if (!bounds) {
      continue;
    }
    candidates.push(cleaned.slice(bounds[0], bounds[1]));
    i = bounds[1] - 1;
  }
  return candidates;
}

function suggestionFromParsed(parsed: unknown): AiSuggestion | null {
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }
  const o = parsed as Record<string, unknown>;
  const title = typeof o.title === 'string' ? o.title.trim() : undefined;
  const description = typeof o.description === 'string' ? o.description : undefined;
  const acceptanceCriteria = Array.isArray(o.acceptanceCriteria)
    ? o.acceptanceCriteria.filter((x): x is string => typeof x === 'string')
    : undefined;
  const testScenarios = Array.isArray(o.testScenarios)
    ? o.testScenarios.filter((x): x is string => typeof x === 'string')
    : undefined;

  const hasBody =
    (description && description.trim().length > 0) ||
    (acceptanceCriteria && acceptanceCriteria.length > 0) ||
    (testScenarios && testScenarios.length > 0) ||
    (title && title.length > 0);

  if (!hasBody) {
    return null;
  }

  return {
    title: title && title.length > 0 ? title : undefined,
    description,
    acceptanceCriteria,
    testScenarios
  };
}

/**
 * Copilot often emits `"description": "text with "quotes" inside"` which is invalid JSON.
 * Escape inner `"` until we see the real closing quote before `,"acceptanceCriteria"` (or next key).
 */
function repairStringField(
  jsonStr: string,
  field: 'description' | 'title',
  nextKeyPattern: RegExp
): string {
  const m = new RegExp(`"${field}"\\s*:\\s*"`).exec(jsonStr);
  if (!m) {
    return jsonStr;
  }
  const valueStart = m.index + m[0].length;
  let i = valueStart;
  let buf = '';
  while (i < jsonStr.length) {
    const c = jsonStr[i];
    if (c === '\\') {
      buf += jsonStr.slice(i, Math.min(i + 2, jsonStr.length));
      i += 2;
      continue;
    }
    if (c === '"') {
      const tail = jsonStr.slice(i + 1);
      if (nextKeyPattern.test(tail)) {
        return jsonStr.slice(0, valueStart) + buf + jsonStr.slice(i);
      }
      buf += '\\"';
      i += 1;
      continue;
    }
    buf += c;
    i += 1;
  }
  return jsonStr;
}

function tryRepairUnescapedInnerQuotes(jsonStr: string): string {
  let s = repairStringField(jsonStr, 'title', /^\s*,\s*"description"/);
  s = repairStringField(s, 'description', /^\s*,\s*"acceptanceCriteria"/);
  return s;
}

function tryJsonRepair(jsonStr: string): string | null {
  try {
    return jsonrepair(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Parse PO Tools PBI JSON from Copilot Chat output (may include "GitHub", markdown, trailing junk).
 */
export function parsePbiSuggestionFromText(raw: string): AiSuggestion | null {
  if (!raw || !raw.trim()) {
    return null;
  }

  const variants = [raw, normalizeQuotesForParse(raw)];
  for (const variant of variants) {
    const candidates = collectJsonCandidates(variant);
    for (let jsonStr of candidates) {
      const attempts = [
        jsonStr,
        tryRepairUnescapedInnerQuotes(jsonStr),
        tryJsonRepair(jsonStr),
        tryJsonRepair(tryRepairUnescapedInnerQuotes(jsonStr))
      ];
      for (const attempt of attempts) {
        if (!attempt) {
          continue;
        }
        try {
          const parsed = JSON.parse(attempt);
          const suggestion = suggestionFromParsed(parsed);
          if (suggestion) {
            return suggestion;
          }
        } catch {
          // try next
        }
      }
    }
  }

  return null;
}
