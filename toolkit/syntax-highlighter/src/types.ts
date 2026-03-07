/** Token category — maps to a `::highlight(hl-<category>)` CSS pseudo-element. */
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

/** A single tokenization rule. `pattern` must have the `g` flag. */
export interface Rule {
    category: Category;
    pattern: RegExp;
}

export type LanguageRules = Rule[];
