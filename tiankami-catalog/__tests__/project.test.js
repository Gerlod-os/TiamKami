/**
 * Дополнительные тесты: slugify, normalizeGames, extractLinksFromCopyRow, storage.
 * Запуск: npx vitest __tests__/project.test.js
 */

import { describe, it, expect } from "vitest";
import { slugify, uniqueSlug } from "../src/utils/slugify.js";
import {
  normalizeGames,
  extractLinksFromCopyRow,
} from "../src/utils/normalize.js";
import { safeGet, safeSet } from "../src/utils/storage.js";

describe("slugify", () => {
  it("должен приводить к нижнему регистру и заменять пробелы на дефисы", () => {
    expect(slugify("Risk of Rain 2")).toBe("risk-of-rain-2");
  });

  it("должен удалять спецсимволы", () => {
    expect(slugify("Hades II!")).toBe("hades-ii");
  });

  it("должен поддерживать кириллицу", () => {
    expect(slugify("Слава Рогаликам")).toBe("слава-рогаликам");
  });

  it("должен убирать лишние и краевые дефисы", () => {
    expect(slugify("--The  --Binds  of-- Isaac--")).toBe("the-binds-of-isaac");
  });
});

describe("uniqueSlug", () => {
  it("должен возвращать слаг как есть, если он не занят", () => {
    expect(uniqueSlug("hades", new Set(["risk-of-rain"]))).toBe("hades");
  });

  it("должен добавлять -2 при коллизии", () => {
    expect(uniqueSlug("hades", new Set(["hades"]))).toBe("hades-2");
  });

  it("должен инкрементировать суффикс до свободного", () => {
    expect(uniqueSlug("hades", new Set(["hades", "hades-2", "hades-3"]))).toBe(
      "hades-4",
    );
  });
});

describe("normalizeGames", () => {
  const header = [
    "Название",
    "Картинка",
    "Жанр",
    "Особенности",
    "Сеттинг",
    "Сложность",
    "Часы",
    "Статус",
    "Прогресс",
    "Оценка",
    "Дата выхода",
    "Когда играл",
    "Примечания",
    "YouTube",
    "МИ",
    "Выпуск МИ",
  ];

  it("должен возвращать пустой массив при недостаточных данных", () => {
    expect(normalizeGames([])).toEqual([]);
    expect(normalizeGames([["только заголовок"]])).toEqual([]);
  });

  it("должен генерировать уникальные слаги для игр с одинаковым названием", () => {
    const rows = [
      header,
      [
        "Hades",
        "",
        "Action",
        "",
        "",
        "",
        "",
        "Пройдено",
        "",
        "9",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [
        "Hades",
        "",
        "Roguelike",
        "",
        "",
        "",
        "",
        "В процессе",
        "",
        "8",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
    ];
    const result = normalizeGames(rows);
    expect(result).toHaveLength(2);
    expect(result[0].slug).not.toBe(result[1].slug);
    // Оба слага должны иметь общий префикс hades (один из них с -2)
    const slugs = result.map((g) => g.slug);
    expect(slugs).toContain("hades");
    expect(slugs).toContain("hades-2");
  });

  it("должен сортировать игры по названию (ru)", () => {
    const rows = [
      header,
      [
        "Zeta",
        "",
        "Action",
        "",
        "",
        "",
        "",
        "Пройдено",
        "",
        "9",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [
        "Alpha",
        "",
        "Action",
        "",
        "",
        "",
        "",
        "Пройдено",
        "",
        "8",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
    ];
    const result = normalizeGames(rows);
    expect(result.map((g) => g.title)).toEqual(["Alpha", "Zeta"]);
  });
});

describe("extractLinksFromCopyRow", () => {
  it("должен извлекать steamAppId, youtube и miVideo из строки", () => {
    const row = new Array(21).fill("");
    row[0] = "Risk of Rain 2";
    row[18] = "https://store.steampowered.com/app/632360/Risk_of_Rain_2/";
    row[19] = '=HYPERLINK("https://youtu.be/abc123";"Прохождение")';
    row[20] = "https://example.com/mi";

    const result = extractLinksFromCopyRow(row);
    expect(result).not.toBeNull();
    expect(result.title).toBe("Risk of Rain 2");
    expect(result.entry.steamAppId).toBe("632360");
    expect(result.entry.youtube).toBe("https://youtu.be/abc123");
    expect(result.entry.miVideo).toBe("https://example.com/mi");
  });

  it("должен возвращать null, если ссылок нет", () => {
    const row = new Array(21).fill("");
    row[0] = "Обычная игра";
    expect(extractLinksFromCopyRow(row)).toBeNull();
  });

  it("должен возвращать null для пустого названия", () => {
    expect(extractLinksFromCopyRow([])).toBeNull();
  });
});

describe("storage (safeGet/safeSet в node-окружении)", () => {
  it("не должен выбрасывать исключение при отсутствии localStorage", () => {
    expect(() => safeSet("key", "value")).not.toThrow();
    expect(safeGet("key")).toBe(null);
  });
});
