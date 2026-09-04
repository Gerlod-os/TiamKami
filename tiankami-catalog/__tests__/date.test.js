/**
 * Тесты для utils/date.js
 * Запуск: npx vitest __tests__/date.test.js
 */

import { describe, it, expect } from 'vitest';
import { parseRuDate } from '../src/utils/date.js';

describe('parseRuDate', () => {
  it('должен парсить корректную дату DD.MM.YYYY', () => {
    const result = parseRuDate('25.12.2023');
    expect(result).toBeInstanceOf(Date);
    expect(result.getUTCFullYear()).toBe(2023);
    expect(result.getUTCMonth()).toBe(11); // Декабрь (0-indexed)
    expect(result.getUTCDate()).toBe(25);
  });

  it('должен возвращать null для пустой строки', () => {
    expect(parseRuDate('')).toBe(null);
    expect(parseRuDate(null)).toBe(null);
    expect(parseRuDate(undefined)).toBe(null);
  });

  it('должен возвращать null для некорректного формата', () => {
    expect(parseRuDate('25/12/2023')).toBe(null);
    expect(parseRuDate('25.12.23')).toBe(null);
  });

  it('должен парсить ISO дату YYYY-MM-DD', () => {
    const result = parseRuDate('2023-12-25');
    expect(result).toBeInstanceOf(Date);
    expect(result.getUTCFullYear()).toBe(2023);
    expect(result.getUTCMonth()).toBe(11);
    expect(result.getUTCDate()).toBe(25);
  });

  it('должен возвращать null для несуществующей даты', () => {
    expect(parseRuDate('32.01.2023')).toBe(null);
    expect(parseRuDate('01.13.2023')).toBe(null);
  });

  it('должен обрабатывать пробелы вокруг даты', () => {
    const result = parseRuDate('  25.12.2023  ');
    expect(result).toBeInstanceOf(Date);
    expect(result.getUTCDate()).toBe(25);
  });
});
