/**
 * CellDL Error Recovery System
 *
 * Pattern detection for common mistakes and suggested fixes.
 * Provides "Did you mean...?" style suggestions and auto-fix capabilities.
 */

import type { IToken } from 'chevrotain';
import { ErrorCode, ErrorCodeType, SuggestedFix } from './types';
import {
  VALID_CELL_TYPES,
  VALID_COMPONENT_TYPES,
} from './messages';

// ============================================
// Levenshtein Distance for Typo Detection
// ============================================

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,       // deletion
        matrix[i]![j - 1]! + 1,       // insertion
        matrix[i - 1]![j - 1]! + cost // substitution
      );
    }
  }

  return matrix[a.length]![b.length]!;
}

/**
 * Find the closest match from a list of valid values
 */
export function findClosestMatch(
  input: string,
  validValues: string[],
  maxDistance = 2
): string | undefined {
  const lowerInput = input.toLowerCase();
  let closest: string | undefined;
  let minDistance = Infinity;

  for (const value of validValues) {
    const distance = levenshteinDistance(lowerInput, value.toLowerCase());
    if (distance < minDistance && distance <= maxDistance) {
      minDistance = distance;
      closest = value;
    }
  }

  return closest;
}

// ============================================
// Error Pattern Definitions
// ============================================

export interface ErrorPattern {
  /** Name of the pattern for debugging */
  name: string;
  /** Check if this pattern matches the current token sequence */
  matches: (tokens: IToken[], position: number, context: PatternContext) => boolean;
  /** Error code to assign */
  errorCode: ErrorCodeType;
  /** Generate the suggested fix */
  generateFix: (tokens: IToken[], position: number, context: PatternContext) => SuggestedFix | undefined;
  /** Generate recovery hint */
  generateHint: (tokens: IToken[], position: number, context: PatternContext) => string;
}

export interface PatternContext {
  /** Stack of braces/brackets/parens for balance checking */
  braceStack: Array<{ token: IToken; type: 'brace' | 'bracket' | 'paren' }>;
  /** Current grammar rule being parsed */
  ruleName?: string | undefined;
  /** Source text for context */
  source?: string | undefined;
}

// ============================================
// Pattern: Missing Closing Brace
// ============================================

const missingClosingBracePattern: ErrorPattern = {
  name: 'missingClosingBrace',

  matches: (tokens, _position, context) => {
    // Check if we're at end of input with unclosed braces
    if (_position >= tokens.length - 1) {
      const unclosedBraces = context.braceStack.filter((b) => b.type === 'brace');
      return unclosedBraces.length > 0;
    }
    return false;
  },

  errorCode: ErrorCode.MISSING_CLOSING_BRACE,

  generateFix: (tokens, _position, context) => {
    const lastToken = tokens[tokens.length - 1];
    if (!lastToken) return undefined;

    const unclosedCount = context.braceStack.filter((b) => b.type === 'brace').length;
    const closingBraces = '}'.repeat(unclosedCount);

    return {
      description: `Insert ${unclosedCount} closing brace${unclosedCount > 1 ? 's' : ''}`,
      replacement: '\n' + closingBraces,
      range: {
        startOffset: lastToken.endOffset ?? lastToken.startOffset + lastToken.image.length,
        endOffset: lastToken.endOffset ?? lastToken.startOffset + lastToken.image.length,
      },
    };
  },

  generateHint: (_tokens, _position, context) => {
    const unclosedBraces = context.braceStack.filter((b) => b.type === 'brace');
    if (unclosedBraces.length === 1 && unclosedBraces[0]) {
      return `Missing closing '}' for block opened at line ${unclosedBraces[0].token.startLine}`;
    }
    return `Missing ${unclosedBraces.length} closing '}' braces`;
  },
};

// ============================================
// Pattern: Missing Arrow in Flow
// ============================================

const missingArrowPattern: ErrorPattern = {
  name: 'missingArrow',

  matches: (tokens, position, context) => {
    // Check if we have two consecutive identifiers without an arrow in flow context
    if (context.ruleName !== 'flowStatement' && context.ruleName !== 'flowBlock') {
      return false;
    }

    const current = tokens[position];
    const next = tokens[position + 1];

    if (!current || !next) return false;

    // Two identifiers or strings in sequence
    const isId = (t: IToken) =>
      t.tokenType.name === 'Identifier' || t.tokenType.name === 'StringLiteral';

    return isId(current) && isId(next);
  },

  errorCode: ErrorCode.MISSING_ARROW,

  generateFix: (tokens, position) => {
    const current = tokens[position];
    if (!current) return undefined;

    const endOffset = current.endOffset ?? current.startOffset + current.image.length;

    return {
      description: "Insert '->' between flow source and target",
      replacement: ' -> ',
      range: {
        startOffset: endOffset,
        endOffset: endOffset,
      },
    };
  },

  generateHint: () => {
    return 'Use "->" to connect flow endpoints. Example: source -> destination';
  },
};

// ============================================
// Pattern: Missing Colon After Type
// ============================================

const missingColonAfterTypePattern: ErrorPattern = {
  name: 'missingColonAfterType',

  matches: (tokens, position) => {
    const current = tokens[position];
    const next = tokens[position + 1];

    if (!current || !next) return false;

    // "type" keyword followed by identifier (not colon)
    return (
      current.tokenType.name === 'Type' &&
      next.tokenType.name !== 'Colon' &&
      (next.tokenType.name === 'Identifier' ||
        VALID_CELL_TYPES.some((t) => next.tokenType.name.toLowerCase() === t))
    );
  },

  errorCode: ErrorCode.MISSING_COLON,

  generateFix: (tokens, position) => {
    const current = tokens[position];
    if (!current) return undefined;

    const endOffset = current.endOffset ?? current.startOffset + current.image.length;

    return {
      description: "Insert ':' after 'type'",
      replacement: ':',
      range: {
        startOffset: endOffset,
        endOffset: endOffset,
      },
    };
  },

  generateHint: () => {
    return "Expected ':' after 'type' keyword. Example: type:logic";
  },
};

// ============================================
// Pattern: Typo in Cell Type
// ============================================

const cellTypeTypoPattern: ErrorPattern = {
  name: 'cellTypeTypo',

  matches: (tokens, position, context) => {
    // Only check after 'type:' in cell context
    if (context.ruleName !== 'cellDefinition' && context.ruleName !== 'cellTypeValue') {
      return false;
    }

    const prev = tokens[position - 1];
    const current = tokens[position];

    if (!prev || !current) return false;

    // After a colon, check if identifier is close to a valid cell type
    if (prev.tokenType.name === 'Colon' && current.tokenType.name === 'Identifier') {
      const closest = findClosestMatch(current.image, VALID_CELL_TYPES);
      return closest !== undefined && closest !== current.image.toLowerCase();
    }

    return false;
  },

  errorCode: ErrorCode.INVALID_CELL_TYPE,

  generateFix: (tokens, position) => {
    const current = tokens[position];
    if (!current) return undefined;

    const closest = findClosestMatch(current.image, VALID_CELL_TYPES);
    if (!closest) return undefined;

    return {
      description: `Replace '${current.image}' with '${closest}'`,
      replacement: closest,
      range: {
        startOffset: current.startOffset,
        endOffset: current.endOffset ?? current.startOffset + current.image.length,
      },
    };
  },

  generateHint: (tokens, position) => {
    const current = tokens[position];
    if (!current) return `Invalid cell type. Valid types are: ${VALID_CELL_TYPES.join(', ')}`;

    const closest = findClosestMatch(current.image, VALID_CELL_TYPES);
    if (closest) {
      return `Did you mean '${closest}'? Valid cell types are: ${VALID_CELL_TYPES.join(', ')}`;
    }
    return `'${current.image}' is not a valid cell type. Valid types are: ${VALID_CELL_TYPES.join(', ')}`;
  },
};

// ============================================
// Pattern: Typo in Component Type
// ============================================

const componentTypeTypoPattern: ErrorPattern = {
  name: 'componentTypeTypo',

  matches: (tokens, position, context) => {
    if (
      context.ruleName !== 'componentDefinition' &&
      context.ruleName !== 'componentType' &&
      context.ruleName !== 'componentsBlock'
    ) {
      return false;
    }

    const current = tokens[position];
    if (!current || current.tokenType.name !== 'Identifier') return false;

    const closest = findClosestMatch(current.image, VALID_COMPONENT_TYPES);
    return closest !== undefined && closest !== current.image.toLowerCase();
  },

  errorCode: ErrorCode.INVALID_COMPONENT_TYPE,

  generateFix: (tokens, position) => {
    const current = tokens[position];
    if (!current) return undefined;

    const closest = findClosestMatch(current.image, VALID_COMPONENT_TYPES);
    if (!closest) return undefined;

    return {
      description: `Replace '${current.image}' with '${closest}'`,
      replacement: closest,
      range: {
        startOffset: current.startOffset,
        endOffset: current.endOffset ?? current.startOffset + current.image.length,
      },
    };
  },

  generateHint: (tokens, position) => {
    const current = tokens[position];
    if (!current) return `Invalid component type`;

    const closest = findClosestMatch(current.image, VALID_COMPONENT_TYPES);
    if (closest) {
      return `Did you mean '${closest}'?`;
    }
    return `'${current.image}' is not a valid component type`;
  },
};

// ============================================
// Pattern: Missing Port Number
// ============================================

const missingPortNumberPattern: ErrorPattern = {
  name: 'missingPortNumber',

  matches: (tokens, position) => {
    const current = tokens[position];
    const next = tokens[position + 1];

    if (!current) return false;

    // "port" keyword not followed by a number
    return (
      current.tokenType.name === 'Port' &&
      (!next || next.tokenType.name !== 'NumberLiteral')
    );
  },

  errorCode: ErrorCode.MISSING_NUMBER_LITERAL,

  generateFix: (tokens, position) => {
    const current = tokens[position];
    if (!current) return undefined;

    const endOffset = current.endOffset ?? current.startOffset + current.image.length;

    return {
      description: 'Insert port number',
      replacement: ' 8080',
      range: {
        startOffset: endOffset,
        endOffset: endOffset,
      },
    };
  },

  generateHint: () => {
    return 'Port requires a number. Example: port 8080';
  },
};

// ============================================
// Pattern: Missing Quotes Around Name
// ============================================

const missingQuotesPattern: ErrorPattern = {
  name: 'missingQuotes',

  matches: (tokens, position) => {
    const current = tokens[position];
    const next = tokens[position + 1];

    if (!current || !next) return false;

    // cell/external/user keyword followed by identifier (not string)
    const entityKeywords = ['Cell', 'External', 'User', 'Application'];
    return (
      entityKeywords.includes(current.tokenType.name) &&
      next.tokenType.name === 'Identifier'
    );
  },

  errorCode: ErrorCode.MISSING_STRING_LITERAL,

  generateFix: (tokens, position) => {
    const next = tokens[position + 1];
    if (!next) return undefined;

    return {
      description: `Wrap '${next.image}' in quotes`,
      replacement: `"${next.image}"`,
      range: {
        startOffset: next.startOffset,
        endOffset: next.endOffset ?? next.startOffset + next.image.length,
      },
    };
  },

  generateHint: (tokens, position) => {
    const current = tokens[position];
    const entityType = current?.tokenType.name?.toLowerCase() ?? 'entity';
    return `${entityType} names should be quoted. Example: ${entityType} "MyName" { }`;
  },
};

// ============================================
// All Patterns
// ============================================

export const errorPatterns: ErrorPattern[] = [
  missingClosingBracePattern,
  missingArrowPattern,
  missingColonAfterTypePattern,
  cellTypeTypoPattern,
  componentTypeTypoPattern,
  missingPortNumberPattern,
  missingQuotesPattern,
];

// ============================================
// Pattern Matching Functions
// ============================================

/**
 * Detect error patterns in token stream
 */
export function detectErrorPatterns(
  tokens: IToken[],
  errorPosition: number,
  ruleName?: string | undefined,
  source?: string | undefined
): {
  pattern: ErrorPattern;
  fix: SuggestedFix | undefined;
  hint: string;
}[] {
  const context = buildPatternContext(tokens, errorPosition, ruleName, source);
  const matches: { pattern: ErrorPattern; fix: SuggestedFix | undefined; hint: string }[] = [];

  for (const pattern of errorPatterns) {
    if (pattern.matches(tokens, errorPosition, context)) {
      matches.push({
        pattern,
        fix: pattern.generateFix(tokens, errorPosition, context),
        hint: pattern.generateHint(tokens, errorPosition, context),
      });
    }
  }

  return matches;
}

/**
 * Build context for pattern matching
 */
function buildPatternContext(
  tokens: IToken[],
  position: number,
  ruleName?: string,
  source?: string
): PatternContext {
  const braceStack: PatternContext['braceStack'] = [];

  // Scan tokens up to position to build brace stack
  for (let i = 0; i <= position && i < tokens.length; i++) {
    const token = tokens[i]!;
    const name = token.tokenType.name;

    if (name === 'LBrace') {
      braceStack.push({ token, type: 'brace' });
    } else if (name === 'RBrace') {
      const last = braceStack[braceStack.length - 1];
      if (last?.type === 'brace') {
        braceStack.pop();
      }
    } else if (name === 'LBracket') {
      braceStack.push({ token, type: 'bracket' });
    } else if (name === 'RBracket') {
      const last = braceStack[braceStack.length - 1];
      if (last?.type === 'bracket') {
        braceStack.pop();
      }
    } else if (name === 'LParen') {
      braceStack.push({ token, type: 'paren' });
    } else if (name === 'RParen') {
      const last = braceStack[braceStack.length - 1];
      if (last?.type === 'paren') {
        braceStack.pop();
      }
    }
  }

  return {
    braceStack,
    ruleName,
    source,
  };
}

/**
 * Get recovery hint for an error at a specific position
 */
export function getRecoveryHint(
  tokens: IToken[],
  errorPosition: number,
  ruleName?: string,
  source?: string
): string | undefined {
  const patterns = detectErrorPatterns(tokens, errorPosition, ruleName, source);

  if (patterns.length > 0) {
    return patterns[0]!.hint;
  }

  return undefined;
}

/**
 * Get suggested fix for an error at a specific position
 */
export function getSuggestedFix(
  tokens: IToken[],
  errorPosition: number,
  ruleName?: string,
  source?: string
): SuggestedFix | undefined {
  const patterns = detectErrorPatterns(tokens, errorPosition, ruleName, source);

  if (patterns.length > 0 && patterns[0]!.fix) {
    return patterns[0]!.fix;
  }

  return undefined;
}
