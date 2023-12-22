import { str, num, bool, bind, assign, ident } from '../builders';
import { interpret } from '../interpreter';
import { compile } from '../compiler';
import type * as T from '../values';
import { ValueType } from '../values';
import type { Expression } from '../syntax';

describe('interpreter', () => {
  function run(program: Expression) {
    const compiled = compile(program);
    const { value } = interpret(compiled);

    return value;
  }

  it('can evaluate literal strings', () => {
    const value = run(str('hello world'));

    expect(value).toEqual<T.StringValue>({
      type: ValueType.String,
      value: 'hello world',
    });
  });

  it('can evaluate literal numbers', () => {
    const value = run(num(5));

    expect(value).toEqual<T.NumberValue>({
      type: ValueType.Number,
      value: 5,
    });
  });

  it('can evaluate booleans', () => {
    expect(run(bool(true))).toEqual<T.BooleanValue>({
      type: ValueType.Boolean,
      value: true,
    });

    expect(run(bool(false))).toEqual<T.BooleanValue>({
      type: ValueType.Boolean,
      value: false,
    });
  });

  it('can resolve identifiers where the value is in scope', () => {
    const program = bind(
      [assign(ident('msg'), str('hello world'))],
      ident('msg'),
    );

    expect(run(program)).toEqual<T.StringValue>({
      type: ValueType.String,
      value: 'hello world',
    });
  });

  it('can resolve identifiers from an outer scope', () => {
    const program = bind(
      [assign(ident('x'), num(1))],
      bind([assign(ident('y'), num(2))], ident('x')),
    );

    expect(run(program)).toEqual<T.NumberValue>({
      type: ValueType.Number,
      value: 1,
    });
  });

  it('can resolve identifiers defined in the same binding', () => {
    const program = bind(
      [assign(ident('x'), num(1)), assign(ident('y'), ident('x'))],
      ident('y'),
    );

    expect(run(program)).toEqual<T.NumberValue>({
      type: ValueType.Number,
      value: 1,
    });
  });

  it('can override identifiers from the outer scope', () => {
    const program = bind(
      [assign(ident('x'), num(1))],
      bind([assign(ident('x'), num(2))], ident('x')),
    );

    expect(run(program)).toEqual<T.NumberValue>({
      type: ValueType.Number,
      value: 2,
    });
  });
});
