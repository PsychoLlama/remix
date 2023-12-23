import type { Expression, Location } from './syntax';
import type { Value } from './values';

/** Processes the program AST into a form that can be executed. */
export function compile(
  program: Expression,
  { bindings = new Map() }: CompilerOptions = {},
): CompilerOutput {
  return {
    errors: [],
    warnings: [],
    program,
    bindings,
  };
}

export interface CompilerOptions {
  /** Variable bindings provided by the host platform. */
  bindings?: Map<string, Value>;
}

export interface CompilerOutput {
  errors: Array<CompilerMessage>;
  warnings: Array<CompilerMessage>;
  program: Expression;
  bindings: Map<string, Value>;
}

export interface CompilerMessage {
  message: string;
  location: Location;
}
