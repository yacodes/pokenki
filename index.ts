#!/usr/bin/env node

import fs from 'fs';
import sqlite3 from 'sqlite3';
import { getTranslationInfo, getTranslationText } from 'lingva-scraper';

const VOCABULARY_PATH = '/home/ya/Public/Devices/Poke/KOReader/settings/vocabulary_builder.sqlite3';

const expandWord = (str: string): string => str.split('').join(' ');
const replaceVowels = (str: string): string => str.replace(/(a|e|i|o|u|y)/g, '_');

const db = new sqlite3.Database(VOCABULARY_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) return console.error(err);

  db.all('SELECT * FROM vocabulary;', async (err, items: { word: string }[]) => {
    if (err) return console.error(err);
    const words: string[] = [];
    for (let i = items.length - 1; i > 0; i--) {
      const source = items[i].word.toLowerCase();
      const [result, info] = [
        // @ts-expect-error Something wrong with typings in lingva-scraper package
        await getTranslationText('en', 'ru', source),
        // @ts-expect-error Something wrong with typings in lingva-scraper package
        await getTranslationInfo('en', 'ru', source),
      ];
      if (result) {
        const type = info?.extraTranslations[0]?.type || 'unknown'
        const updatedSource = type === 'verb' ? 'to ' + source : source;
        console.log(`${i}/${items.length - 1}: ${updatedSource} -> ${result}`);
        words.push(
          [updatedSource, result, type, replaceVowels(expandWord(updatedSource))].join(' = ')
        );
      }
    }
    fs.writeFileSync('/home/ya/Desktop/anki.en.csv', words.join('\n'));
  });
});
