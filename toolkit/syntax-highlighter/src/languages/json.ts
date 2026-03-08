import type { Rule } from '../types.ts';

export const json: Rule[] = [
    { category: 'comment', pattern: /\/\/.*|\/\*[\s\S]*?\*\//g },
    { category: 'property', pattern: /"(?:\\.|[^\\"])*"(?=\s*:)/g },
    { category: 'string', pattern: /"(?:\\.|[^\\"])*"/g },
    { category: 'boolean', pattern: /\b(true|false)\b/g },
    { category: 'constant', pattern: /\bnull\b/g },
    { category: 'number', pattern: /\b-?\d+(\.\d+)?([eE][+-]?\d+)?\b/g },
    { category: 'operator', pattern: /[:{},\[\]]/g }
];
