import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layout } from '../src/render.mjs';
import { hyphenPoints } from '../src/hyphenate.mjs';

const S = '­';

test('round-trip: diagramar e reconstruir o texto, linhas dentro da largura', () => {
  const text = `O enxame 🐝 coordena tarefas com com${S}pro${S}mis${S}so e re${S}si${S}li${S}ên${S}cia 🚀 sem lí${S}der`;
  const letters = text.split(S).join('').replace(/ /g, '');
  for (const width of [8, 10, 14, 20, 60]) {
    for (const hyphenate of [false, true]) {
      const lines = layout(text, { width, hyphenate });
      for (const ln of lines) assert.ok([...ln].length <= width, JSON.stringify({ ln, width }));
      const rebuilt = lines.map((ln) => (hyphenate ? ln.replace(/-$/, '') : ln)).join('').replace(/ /g, '');
      assert.equal(rebuilt, letters, JSON.stringify({ width, hyphenate }));
    }
  }
});

test('justificação distribui os espaços que sobram', () => {
  assert.deepEqual(layout('a bb c dd ee', { width: 11, align: 'justify' }), ['a  bb  c dd', 'ee']);
});

test('pontos de hifenização de uma palavra com vários hífens suaves', () => {
  assert.deepEqual(hyphenPoints(`in${S}for${S}ma${S}ção`), [2, 5, 7]);
});
