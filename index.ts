import path from 'path';
import fs from 'fs';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import _orderBy from 'lodash/orderBy';
import clipboard from 'clipboardy';

import { findNewLists } from './findNewLists';
import { getBaseGamesForExpansion } from './getBaseGamesForExpansion';
import { getUser } from './getUser';
import { getUserPosts } from './getUserPosts';

interface DateAdjustment {
  entryId: string;
  date: string;
}

interface Data {
  username?: string;
  lastThreadPostId?: string;
  listIds?: string[];
}

const buildForumCode = (entryLinks: string[]) =>
  `
[heading][/heading]
[size=9]Previous plays of this game:[/size]
[size=8]${entryLinks.join('[c] • [/c]')}[/size]
`.trim();

const getDataPath = () => path.resolve('.', 'data.json');

const loadData = () => {
  const dataPath = path.resolve('.', 'data.json');
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify({}));
  }

  const dataFile = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(dataFile) as Data;
};

const saveData = (newData: Data) => {
  const dataPath = getDataPath();
  fs.writeFileSync(dataPath, JSON.stringify(newData, null, 2));
};

interface RunArgs {
  username?: string;
  gameId: string;
}

const run = async ({ username, gameId }: RunArgs) => {
  const data = loadData();

  if (username) {
    data.username = username;
  } else {
    if (!data.username) {
      console.error('Please provide a username using the `-u` option.');
      process.exit(1);
    }
  }

  const user = await getUser(data.username);
  console.log(user);
  const posts = await getUserPosts(user.id);

  const adjustmentsPath = path.resolve('.', 'dateAdjustments.json');
  if (!fs.existsSync(adjustmentsPath)) {
    fs.writeFileSync(adjustmentsPath, JSON.stringify([]));
  }

  const adjustmentsFile = fs.readFileSync(adjustmentsPath, 'utf-8');
  const dateAdjustments = JSON.parse(adjustmentsFile) as DateAdjustment[];

  const newLists = await findNewLists(data.lastThreadPostId);
  data.lastThreadPostId = newLists.newLastPostId;
  data.listIds = (data.listIds || []).concat(newLists.listIds);

  saveData(data);

  const { listIds } = data;

  const sortedEntries = _orderBy(posts, 'date', ['desc']);

  const baseGamesForGameId = await getBaseGamesForExpansion(gameId);

  const entriesForGame = sortedEntries
    .filter((entry) => listIds.includes(entry.listId)) // Only include SGOYT lists
    .filter(
      (entry) =>
        entry.gameId === gameId || // Entries that match this exact game
        baseGamesForGameId.includes(entry.gameId) || // Entries for the base game for which this is an expansion
        entry.expansionFor.includes(gameId) || // Entries which are expansions for this game
        entry.expansionFor.some(
          (expansionFor) => baseGamesForGameId.includes(expansionFor) // Entries which are expansions for the same base game as this
        )
    );

  const entryLinks = entriesForGame.map((entry) => {
    const entryDate =
      dateAdjustments.find((adjustment) => adjustment.entryId === entry.id)
        ?.date || entry.date;

    const date = new Date(entryDate).toLocaleString('en-gb', {
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

  saveData(data);
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
  .demandOption('game')
  .parseSync();

const matchUrl = argv.game.match(
  /boardgamegeek\.com\/boardgame(expansion)?\/(\d+)/
);
const gameId = matchUrl ? matchUrl[2] : argv.game;

run({ username: argv.username, gameId });
