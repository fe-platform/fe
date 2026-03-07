import { Rule } from '../types.ts';

export const html: Rule[] = [
    { category: 'comment', pattern: /<!--[\s\S]*?-->/g },
    { category: 'keyword', pattern: /<!DOCTYPE\b[^>]*>/gi },
    // Tags
    { category: 'function', pattern: /<\/?[a-z0-9-]+/gi },
    // Attributes
    { category: 'property', pattern: /\b[a-z0-9-]+(?=\s*=\s*)/gi },
    // Attribute values
    { category: 'string', pattern: /="[^"]*"|='[^']*'/g },
    // Brackets
    { category: 'operator', pattern: /[<>]/g }
];
