// Добавляет ?v=<версия> к ссылкам на css, js, шрифты и фото внутри _site,
// чтобы клиент после деплоя не взял старые файлы из кэша.
//
// Запуск: SITE_VERSION=<sha> node scripts/stamp-assets.mjs
// Скрипт работает только с собранной копией в _site, исходники не меняет.

import { readFileSync, writeFileSync } from 'node:fs';

const raw = (process.env.SITE_VERSION || '').trim();
if (!raw) {
  console.error('SITE_VERSION is empty');
  process.exit(1);
}

const version = raw.slice(0, 7);
const files = ['_site/index.html', '_site/css/fonts.css', '_site/css/style.css'];

// Локальные пути к ассетам в атрибутах href/src и в url(...).
const ref = /(["'(])((?:\.\.\/)?(?:assets|css|js)\/[^"'()?#]+?\.(?:css|js|jpe?g|png|svg|webp|woff2))(["')])/g;

let total = 0;

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  let count = 0;

  const stamped = source.replace(ref, (match, before, path, after) => {
    count += 1;
    return `${before}${path}?v=${version}${after}`;
  });

  writeFileSync(file, stamped);
  total += count;
  console.log(`${file}: ${count} refs`);
}

// Ноль означает, что регулярка не нашла ни одной ссылки: сборку лучше остановить,
// чем отдать страницу без версий. Пустой style.css допустим, сейчас в нём нет url().
if (total === 0) {
  console.error('no asset references found, check the regex and _site contents');
  process.exit(1);
}

console.log(`version ${version}, ${total} refs stamped`);
