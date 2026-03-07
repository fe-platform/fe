import { Rule } from '../types.ts';

export const json: Rule[] = [
    { category: 'property', pattern: /"[^"]*"(?=\s*:)/g },
    { category: 'string', pattern: /(?<=:\s*)"[^"]*"/g },
    { category: 'boolean', pattern: /\b(true|false)\b/g },
    { category: 'constant', pattern: /\bnull\b/g },
    { category: 'number', pattern: /\b-?\d+(\.\d+)?([eE][+-]?\d+)?\b/g },
    { category: 'operator', pattern: /[:{},\[\]]/g },
    { category: 'comment', pattern: /\/\/.*|\/\*[\s\S]*?\*\//g }
];
