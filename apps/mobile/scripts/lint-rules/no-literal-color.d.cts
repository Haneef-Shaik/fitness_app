import type { ESLint, Linter, Rule } from 'eslint';

export declare const rule: Rule.RuleModule;
export declare const plugin: ESLint.Plugin;
export declare const ruleId: 'fitlog-colors/no-literal-color';
export declare const colorGuardFiles: readonly string[];
export declare const colorGuardIgnores: readonly string[];
export declare function colorGuardConfig(): Linter.Config;
