export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\wа-яёА-Я\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Генерирует уникальную версию слага, добавляя суффикс при коллизии.
 * @param {string} slug
 * @param {Set<string>} usedSlugs — уже занятые слаги
 * @returns {string}
 */
export function uniqueSlug(slug, usedSlugs) {
  if (!usedSlugs.has(slug)) return slug;
  let i = 2;
  const base = slug;
  while (usedSlugs.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}
