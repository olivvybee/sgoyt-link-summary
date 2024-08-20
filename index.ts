import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import _orderBy from 'lodash/orderBy';
import clipboard from 'clipboardy';

import {
  addEntries,
  addLists,
  closeConnection,
  getAllEntries,
  getAllGames,
  getAllLists,
  getGame,
  getLastListPostId,
  setLastListPostId,
} from './database';
import { findNewLists } from './findNewLists';
import { getUser } from './getUser';
import { getUserPosts } from './getUserPosts';
import { getBaseGamesForExpansion } from './getBaseGamesForExpansion';
import { Entry } from './types';
import { buildForumCode } from './buildForumCode';

const username = process.env.BGG_USERNAME;
if (!username) {
  throw new Error('process.env.BGG_USERNAME is not set.');
}

const argv = yargs(hideBin(process.argv))
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

const gameData = await getGame(gameId);
if (!gameData) {
}

const lastListPostId = await getLastListPostId();
const { listIds: newListIds, newLastPostId } = await findNewLists(
  lastListPostId
);
await setLastListPostId(newLastPostId);
await addLists(newListIds);

const lists = await getAllLists();
const knownEntries = await getAllEntries();

const user = await getUser(username);
const posts = await getUserPosts(user.id);

const newPosts = posts
  .filter((post) => lists.includes(post.listId))
  .filter((post) => !knownEntries.some((entry) => entry.id === post.id));
const newEntries: Entry[] = newPosts.map((post) => ({
  id: post.id,
  date: post.date,
  game: post.gameId,
  link: post.link,
}));
await addEntries(newEntries);

const entries = [...knownEntries, ...newEntries];
const sortedEntries = _orderBy(entries, 'date', ['desc']);

const games = await getAllGames();

const thisGame = games.find((game) => game.id === gameId);

const baseGames = await getBaseGamesForExpansion(gameId);
const expansionsForThisGame = games
  .filter((game) => thisGame?.expansionFor?.includes(game.id))
  .map((game) => game.id);
const otherExpansionsForSameGame = games
  .filter((game) =>
    game.expansionFor?.some((expansionFor) => baseGames.includes(expansionFor))
  )
  .map((game) => game.id);

const matchingGameIds = [
  gameId,
  ...baseGames,
  ...expansionsForThisGame,
  ...otherExpansionsForSameGame,
];

const matchingEntries = sortedEntries.filter((entry) =>
  matchingGameIds.includes(entry.game)
);

const count = matchingEntries.length;
console.log(`Found ${count} previous ${count === 1 ? 'play' : 'plays'}.`);

if (count > 0) {
  const output = buildForumCode(matchingEntries);
  clipboard.writeSync(output);
}

closeConnection();
