/**
 * @module
 * Core type definitions for @fe-platform/syntax-highlighter.
 */

/**
 * Supported token categories for syntax highlighting.
 * These correspond to the `::highlight(hl-<category>)` pseudo-elements.
 */
export type Category = 
    | 'keyword' 
    | 'string' 
    | 'comment' 
    | 'type' 
    | 'number' 
    | 'operator' 
    | 'function' 
    | 'property' 
    | 'variable' 
    | 'argument'
    | 'constant'
    | 'boolean';

/**
 * A rule for tokenizing a specific category of text.
 */
export interface Rule {
    /** The category to assign to matched text. */
    category: Category;
    /** The regular expression to match. Should have the 'g' flag. */
    pattern: RegExp;
}

/**
 * A set of rules defining a language grammar.
 */
export type LanguageRules = Rule[];
