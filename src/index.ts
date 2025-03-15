import { syscall } from './builders';
import { compile } from './compiler';
import { interpret } from './interpreter';
import { parseToAst } from './parser';
import { readFile } from 'fs/promises';
import { ValueType, type Value } from './values';

async function main(programFile: string) {
  if (typeof programFile !== 'string') {
    throw new Error('Please provide a path to a program file');
  }

  const file = await readFile(programFile, 'utf-8');
  const ast = parseToAst(file);
  const compiled = compile(ast, {
    bindings: new Map([
      [
        'add',
        syscall((args: Value[]): Value => {
          if (
            args[0].type !== ValueType.Number ||
            args[1].type !== ValueType.Number
          ) {
            throw new Error('Cannot add non-numbers');
          }

          return {
            type: ValueType.Number,
            value: args[0].value + args[1].value,
          };
        }),
      ],
    ]),

    context: new Map([
      [
        'print',
        syscall((args: Value[]): Value => {
          console.log(args[0]);
          return { type: ValueType.Tuple, elements: [] };
        }),
      ],
    ]),
  });

  interpret(compiled);
}

main(process.argv[2]);
