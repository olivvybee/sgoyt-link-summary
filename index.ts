import path from 'path';
import fs from 'fs';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import _orderBy from 'lodash/orderBy';
import clipboard from 'clipboardy';

import { findNewLists } from './findNewLists';
import { getUserPostsInList } from './getUserPostsInList';
import { getBaseGamesForExpansion } from './getBaseGamesForExpansion';

interface Data {
  firstKnownThreadForUser?: string;
  lastThreadPostId?: string;
  listIds?: string[];
}

const buildForumCode = (entryLinks: string[]) =>
  `
[heading][/heading]
[size=9]Previous plays of this game:[/size]
[size=8]${entryLinks.join('[c] • [/c]')}[/size]
`.trim();

interface RunArgs {
  username: string;
  gameId: string;
}

const run = async ({ username, gameId }: RunArgs) => {
  const dataPath = path.resolve('.', 'data.json');
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, '{}');
  }

  const dataFile = fs.readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(dataFile) as Data;

  const newLists = await findNewLists(data.lastThreadPostId);
  data.lastThreadPostId = newLists.newLastPostId;
  data.listIds = (data.listIds || []).concat(newLists.listIds);

  const { listIds, firstKnownThreadForUser } = data;

  const firstKnownIndex = firstKnownThreadForUser
    ? listIds.indexOf(firstKnownThreadForUser)
    : 0;
  const listsToCheck = listIds.slice(firstKnownIndex);

  const userEntries = (
    await Promise.all(
      listsToCheck.map((id) => getUserPostsInList(username, id))
    )
  ).flat();

  const sortedEntries = _orderBy(userEntries, 'date', ['desc']);

  const earliestEntry = sortedEntries.at(-1);
  if (earliestEntry) {
    data.firstKnownThreadForUser = earliestEntry.listId;
  }

  const baseGamesForEntry = await getBaseGamesForExpansion(gameId);

  const entriesForGame = sortedEntries.filter(
    (entry) =>
      entry.gameId === gameId || // Entries that match this exact game
      entry.expansionFor.includes(gameId) || // Entries which are expansions for this game
      entry.expansionFor.some(
        (expansionFor) => baseGamesForEntry.includes(expansionFor) // Entries which are expansions for the same base game as this
      )
  );

  const entryLinks = entriesForGame.map((entry) => {
    const date = new Date(entry.date).toLocaleString('en-gb', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `[url=${entry.link}]${date}[/url]`;
  });

  const count = entryLinks.length;
  console.log(`Found ${count} previous ${count === 1 ? 'play' : 'plays'}.`);

  const output = buildForumCode(entryLinks);

  clipboard.writeSync(output);

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
};

const argv = yargs(hideBin(process.argv))
  .option('username', {
    alias: 'u',
    type: 'string',
    description: 'BGG username to find entries for',
  })
  .option('game', {
    alias: 'g',
    type: 'string',
    description: 'BGG ID of the game to find entries for',
  })
  .demandOption('username')
  .demandOption('game')
  .parseSync();

const matchUrl = argv.game.match(
  /boardgamegeek\.com\/boardgame(expansion)?\/(\d+)/
);
const gameId = matchUrl ? matchUrl[2] : argv.game;

run({ username: argv.username, gameId });
