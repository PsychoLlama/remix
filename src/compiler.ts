import type { Expression, Location } from './syntax';

/** Processes the program AST into a form that can be executed. */
export function compile(program: Expression): CompilerOutput {
  return {
    errors: [],
    warnings: [],
    program,
  };
}

export interface CompilerOutput {
  errors: Array<CompilerMessage>;
  warnings: Array<CompilerMessage>;
  program: Expression;
}

export interface CompilerMessage {
  message: string;
  location: Location;
}
