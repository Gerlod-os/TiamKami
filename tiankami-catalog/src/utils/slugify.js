export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}