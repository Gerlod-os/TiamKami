/**
 * Тесты для utils/normalize.js
 * Запуск: npx vitest __tests__/normalize.test.js
 */

import { describe, it, expect } from 'vitest';
import { 
  normalizeStatus, 
  normalizeGameRow, 
  buildColIndex,
  isUrl,
  extractHyperlinkParts,
  isYouTubeUrl,
  extractSteamAppId,
  steamHeaderUrl,
  normalizeCollections,
  getAllSettings,
  getAllFeatures,
} from '../src/utils/normalize.js';

describe('normalizeStatus', () => {
  it('должен нормализовать "жду релиз" в "Жду релиза"', () => {
    expect(normalizeStatus('жду релиз')).toBe('Жду релиза');
  });

  it('должен нормализовать "пройдено" в "Пройдено"', () => {
    expect(normalizeStatus('пройдено')).toBe('Пройдено');
  });

  it('должен возвращать исходное значение для неизвестных статусов', () => {
    expect(normalizeStatus('Неизвестный статус')).toBe('Неизвестный статус');
  });

  it('должен обрабатывать пустые строки', () => {
    expect(normalizeStatus('')).toBe('');
    expect(normalizeStatus(null)).toBe('');
  });
});

describe('isUrl', () => {
  it('должен распознавать http ссылки', () => {
    expect(isUrl('https://example.com')).toBe(true);
    expect(isUrl('http://example.com')).toBe(true);
  });

  it('должен возвращать false для не-URL', () => {
    expect(isUrl('not a url')).toBe(false);
    expect(isUrl('')).toBe(false);
    expect(isUrl(null)).toBe(false);
  });
});

describe('extractHyperlinkParts', () => {
  it('должен извлекать URL и label из HYPERLINK формулы', () => {
    const result = extractHyperlinkParts('=HYPERLINK("https://test.com";"Test Label")');
    expect(result.url).toBe('https://test.com');
    expect(result.label).toBe('Test Label');
  });

  it('должен возвращать обычную строку как есть', () => {
    const result = extractHyperlinkParts('plain text');
    expect(result.url).toBe('plain text');
    expect(result.label).toBe('');
  });
});

describe('isYouTubeUrl', () => {
  it('должен распознавать YouTube ссылки', () => {
    expect(isYouTubeUrl('https://youtube.com/watch?v=abc123')).toBe(true);
    expect(isYouTubeUrl('https://youtu.be/abc123')).toBe(true);
    expect(isYouTubeUrl('https://www.youtube.com/')).toBe(true);
  });

  it('должен возвращать false для не-Youtube ссылок', () => {
    expect(isYouTubeUrl('https://twitch.tv')).toBe(false);
  });
});

describe('extractSteamAppId', () => {
  it('должен извлекать appid из Steam URL', () => {
    expect(extractSteamAppId('https://store.steampowered.com/app/632360/Risk_of_Rain_2/'))
      .toBe('632360');
  });

  it('должен возвращать null для не-Steam ссылок', () => {
    expect(extractSteamAppId('https://example.com')).toBe(null);
  });
});

describe('steamHeaderUrl', () => {
  it('должен генерировать правильный URL для обложки Steam', () => {
    expect(steamHeaderUrl('632360'))
      .toBe('https://cdn.cloudflare.steamstatic.com/steam/apps/632360/header.jpg');
  });
});

describe('buildColIndex', () => {
  it('должен строить индексы колонок из заголовков', () => {
    const header = ['Название', 'Жанр', 'Статус'];
    const result = buildColIndex(header);
    expect(result.title).toBe(0);
    expect(result.genre).toBe(1);
    expect(result.status).toBe(2);
  });
});

describe('normalizeGameRow', () => {
  it('должен создавать объект игры из строки данных', () => {
    const row = ['Game Title', 'image.jpg', 'RPG', '', '', '', '10h', 'Пройдено', '', '9', '', '', '', '', ''];
    const colIndex = {
      title: 0, image: 1, genre: 2, features: 3, setting: 4,
      complexity: 5, hours: 6, status: 7, progress: 8, rating: 9,
      releaseDate: 10, playedDate: 11, notes: 12, youtube: 13, hasMI: 14, miVideo: 15
    };
    const result = normalizeGameRow(row, colIndex);
    expect(result.title).toBe('Game Title');
    expect(result.genre).toBe('RPG');
    expect(result.hours).toBe('10h');
    expect(result.status).toBe('Пройдено');
    expect(result.rating).toBe('9');
  });

  it('должен возвращать null для пустого названия', () => {
    const row = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
    const colIndex = { title: 0 };
    expect(normalizeGameRow(row, colIndex)).toBe(null);
  });
});

describe('normalizeCollections', () => {
  it('должен парсить подборку с играми и рангами', () => {
    const rows = [
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
      ['', '', '', '', '', 'Risk of Rain 2', '1', 'Deep Rock Galactic', '2', ''],
      ['', '', '', '', '', '', '', 'Hades', '1', ''],
    ];
    const result = normalizeCollections(rows);
    expect(result.length).toBeGreaterThan(0);
  });

  it('должен возвращать пустой массив для недостаточных данных', () => {
    expect(normalizeCollections([])).toBe([]);
    expect(normalizeCollections([['only header']])).toBe([]);
  });

  it('должен пропускать "ЗОЛОТОЙ СПИСОК" — обнулять ранги', () => {
    const rows = [
      ['A', 'B', 'C', 'D', 'E'],
      ['', 'ЗОЛОТОЙ СПИСОК', 'Игра 1', '1', ''],
    ];
    const result = normalizeCollections(rows);
    const golden = result.find((c) => /золотой список/i.test(c.name));
    if (golden) {
      expect(golden.games[0].rank).toBe('');
    }
  });
});

describe('getAllSettings', () => {
  it('должен собирать уникальные сеттинги', () => {
    const games = [
      { title: 'A', setting: 'Фэнтези' },
      { title: 'B', setting: 'Sci-Fi' },
      { title: 'C', setting: 'Фэнтези' },
      { title: 'D', setting: '' },
    ];
    expect(getAllSettings(games)).toEqual(['Sci-Fi', 'Фэнтези']);
  });

  it('должен возвращать пустой массив для пустого списка', () => {
    expect(getAllSettings([])).toEqual([]);
  });

  it('должен trim и сортировать', () => {
    const games = [
      { title: 'A', setting: '  Sci-Fi  ' },
      { title: 'B', setting: 'Фэнтези' },
    ];
    expect(getAllSettings(games)).toEqual(['Sci-Fi', 'Фэнтези']);
  });
});

describe('getAllFeatures', () => {
  it('должен разбивать особенности по запятой', () => {
    const games = [
      { title: 'A', features: 'Кооп, PVE' },
      { title: 'B', features: 'PVE, Сложный' },
    ];
    expect(getAllFeatures(games)).toEqual(['Кооп', 'PVE', 'Сложный']);
  });

  it('должен возвращать пустой массив для пустого списка', () => {
    expect(getAllFeatures([])).toEqual([]);
  });

  it('должен игнорировать пустые строки после split', () => {
    const games = [
      { title: 'A', features: 'Кооп,, PVE, ' },
    ];
    expect(getAllFeatures(games)).toEqual(['Кооп', 'PVE']);
  });
});
