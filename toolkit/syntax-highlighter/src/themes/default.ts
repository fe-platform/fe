/**
 * @module
 * Default automatic theme for @feo/fe-syntax-highlighter.
 */
import { lightTheme } from './light.ts';
import { darkTheme } from './dark.ts';

/**
 * A CSS theme that automatically switches between light and dark modes
 * based on the user's system preferences (`prefers-color-scheme`).
 */
export const autoTheme: string = `
  @media (prefers-color-scheme: light) {
    ${lightTheme}
  }
  @media (prefers-color-scheme: dark) {
    ${darkTheme}
  }
`;
