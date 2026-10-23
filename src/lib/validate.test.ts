// FILE: lib/validate.test.ts
import { describe, expect, it } from '@jest/globals';
import { cleanName, validateEmail, validateName, validateNewPassword } from './validate';

describe('form rules', () => {
  it('accepts real names from many places and refuses symbols', () => {
    for (const ok of ['Ada', 'Mary-Jane', "O'Neil", 'José', 'Chukwuemeka', 'St. John', 'Nguyễn']) {
      expect(validateName(ok, 'first')).toBeNull();
    }
    expect(validateName('  ', 'last')).toBe('Enter your last name.');
    expect(validateName('Ada1', 'first')).not.toBeNull();
    expect(validateName('<b>', 'first')).not.toBeNull();
    expect(validateName('A'.repeat(51), 'first')).not.toBeNull();
    expect(cleanName('  Mary   Jane ')).toBe('Mary Jane');
  });

  it('checks email and password length', () => {
    expect(validateEmail('ada@example.com')).toBeNull();
    expect(validateEmail('ada@example')).not.toBeNull();
    expect(validateNewPassword('1234567')).not.toBeNull();
    expect(validateNewPassword('12345678')).toBeNull();
  });
});
