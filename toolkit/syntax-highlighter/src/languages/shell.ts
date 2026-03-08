import type { Rule } from '../types.ts';

export const shell: Rule[] = [
    { category: 'comment', pattern: /#.*/g },
    { category: 'string', pattern: /"(?:\\.|[^\\"])*"|'[^']*'/g },
    // Command detection: line start, operators, subshells, or substitutions
    { 
        category: 'keyword', 
        pattern: /(?<=^\s*|[|&;]\s*|\$\(\s*|`\s*|\(\s*|\b(?:sudo|if|then|else|elif|do|while|until|case)\s+)[\w.-]+/gm 
    },
    // Variable assignment: VAR=
    { category: 'variable', pattern: /\b[\w.-]+(?==)/g },
    // Variable usage: $VAR or ${VAR}
    { category: 'variable', pattern: /\$[\w{}]+/g },
    // Flags/Options
    { category: 'type', pattern: /\s-\w+|--[\w-]+/g },
    // Control operators
    { category: 'operator', pattern: /[|&;<>!]/g },
    // Generic arguments (anything else)
    { category: 'argument', pattern: /<[^>]+>|[\w./@:()+-]+/g }
];
