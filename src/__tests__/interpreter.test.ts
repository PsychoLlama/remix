import { str, num, bool } from '../builders';
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
});
