import { Rule } from '../types.ts';

export const ts: Rule[] = [
    { category: 'comment', pattern: /\/\/.*|\/\*[\s\S]*?\*\//g },
    { category: 'string', pattern: /"(?:\\.|[^\\"])*"|'(?:\\.|[^\\'])*'|`(?:\\.|[^\\`])*`/g },
    { category: 'keyword', pattern: /\b(break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|function|if|import|in|instanceof|new|return|super|switch|this|throw|true|try|typeof|var|while|with|as|implements|interface|let|package|private|protected|public|static|yield|constructor|declare|get|is|module|namespace|readonly|require|set|type|from|of|satisfies|await|async|abstract|asserts|infer|keyof|readonly|using|override)\b/g },
    { category: 'type', pattern: /\b(string|number|boolean|symbol|bigint|any|unknown|never|void|undefined|null)\b|\b[A-Z]\w*\b/g },
    { category: 'number', pattern: /\b(0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+|\d[\d_]*)\b/g },
    { category: 'function', pattern: /\b\w+(?=\s*\()/g },
    { category: 'property', pattern: /(?<=\.)\w+\b|\w+(?=\s*:)/g },
    { category: 'operator', pattern: /=>|\+\+|--|\+=|-=|\*=|(?<!\/)\/=|%=|<<=|>>=|>>>=|&=|\^=|\|=|&&=|\|\|=|\?\?=|==|!=|===|!==|<=|>=|&&|\|\||\?\?|\?|:|[+\-*%&|^~<>!]=?|\.\.\.|\.(?!\d)/g }
];
