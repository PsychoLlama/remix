import type { Expression, Location } from './syntax';
import type { Value } from './values';

/** Processes the program AST into a form that can be executed. */
export function compile(
  program: Expression,
  { bindings = new Map(), context = new Map() }: CompilerOptions = {},
): CompilerOutput {
  return {
    errors: [],
    warnings: [],
    program,
    bindings,
    context,
  };
}

export interface CompilerOptions {
  /** Lexical bindings (prelude) provided by the host platform. */
  bindings?: Map<string, Value>;

  /** Contextual bindings provided by the host platform. */
  context?: Map<string, Value>;
}

export interface CompilerOutput {
  errors: Array<CompilerMessage>;
  warnings: Array<CompilerMessage>;
  program: Expression;
  bindings: Map<string, Value>;
  context: Map<string, Value>;
}

export interface CompilerMessage {
  message: string;
  location: Location;
}
