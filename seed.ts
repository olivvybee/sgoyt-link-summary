import _uniq from 'lodash/uniq';
import _orderBy from 'lodash/orderBy';

import {
  getLastListPostId,
  setLastListPostId,
  addLists,
  getAllLists,
  closeConnection,
  getGame,
  getAllGames,
  addGames,
  getAllEntries,
  addEntries,
} from './database';
import { findNewLists } from './findNewLists';
import { getUser } from './getUser';
import { getUserPosts } from './getUserPosts';
import { getGameInfo } from './getGameInfo';
import { Entry } from './types';

const username = process.env.BGG_USERNAME;
if (!username) {
  throw new Error('process.env.BGG_USERNAME is not set.');
}

const lastListPostId = await getLastListPostId();
const { listIds: newListIds, newLastPostId } = await findNewLists(
  lastListPostId
);
await setLastListPostId(newLastPostId);
await addLists(newListIds);

const user = await getUser(username);
const posts = await getUserPosts(user.id);

const knownGames = await getAllGames();
const newGames = posts
  .map((post) => post.gameId)
  .filter((id) => !knownGames.some((knownGame) => knownGame.id === id));
const uniqueNewGames = _uniq(newGames);

const newGameData = await getGameInfo(uniqueNewGames);
await addGames(newGameData);

const lists = await getAllLists();

const existingEntries = await getAllEntries();
const newPosts = posts
  .filter((post) => lists.includes(post.listId))
  .filter((post) => !existingEntries.some((entry) => entry.id === post.id));
const newEntries: Entry[] = newPosts.map((post) => ({
  id: post.id,
  date: post.date,
  game: post.gameId,
  link: post.link,
}));
await addEntries(newEntries);

closeConnection();
