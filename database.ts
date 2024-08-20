import { config as loadEnv } from 'dotenv';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  get,
  set,
  push,
  query,
  equalTo,
  orderByChild,
} from 'firebase/database';

import { Entry, Game } from './types';

loadEnv();

const firebase = initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  projectId: process.env.FIREBASE_PROJECT_ID,
  appId: process.env.FIREBASE_APP_ID,
  databaseURL: process.env.FIREBASE_DB_URL,
});

const db = getDatabase(firebase);

const GAMES_PATH = 'games';
const ENTRIES_PATH = 'entries';
const LISTS_PATH = 'lists';
const LAST_LIST_POST_ID_PATH = 'last_list_post_id';

export const closeConnection = async () => {
  await deleteApp(firebase);
};

const getValue = async <T>(path: string): Promise<T | undefined> => {
  const dbRef = ref(db, path);
  const result = await get(dbRef);
  return result.val() ?? undefined;
};

const setValue = async <T>(path: string, value: T) => {
  const dbRef = ref(db, path);
  await set(dbRef, value);
};

const getArray = async <T>(path: string): Promise<T[]> => {
  const data = await getValue<{ [key: string]: T }>(path);
  return data ? Object.values(data) : [];
};

const getFilteredArray = async <T, V extends string | number | boolean | null>(
  path: string,
  filterBy: string,
  value: V
) => {
  const dbRef = ref(db, path);
  const filterQuery = query(dbRef, orderByChild(filterBy), equalTo(value));
  const result = await get(filterQuery);
  const array = result.val() as { [key: string]: T } | null;
  return array ? Object.values(array) : [];
};

const addItemToArray = async <T>(path: string, value: T) => {
  const dbRef = ref(db, path);
  const newRef = push(dbRef);
  await set(newRef, value);
};

export const addList = async (id: string) => {
  await addItemToArray(LISTS_PATH, id);
};

export const addLists = async (ids: string[]) => {
  for (let id of ids) {
    await addList(id);
  }
};

export const getAllLists = async () => {
  return getArray<string>(LISTS_PATH);
};

export const setLastListPostId = async (id: string) => {
  await setValue(LAST_LIST_POST_ID_PATH, id);
};

export const getLastListPostId = async () => {
  return getValue<string>(LAST_LIST_POST_ID_PATH);
};

export const addGame = async (game: Game) => {
  const path = `${GAMES_PATH}/${game.id}`;
  await setValue(path, game);
};

export const addGames = async (games: Game[]) => {
  for (let game of games) {
    await addGame(game);
  }
};

export const getAllGames = async () => {
  return getArray<Game>(GAMES_PATH);
};

export const getGame = async (id: string) => {
  const path = `${GAMES_PATH}/${id}`;
  return getValue<Game>(path);
};

export const getMatchingGames = async (id: string) => {
  const allGames = await getAllGames();

  const exactMatch = allGames.find((game) => game.id === id);

  const expansionsForGame = allGames.filter((game) =>
    game.expansionFor?.includes(game.id)
  );

  return [exactMatch, ...expansionsForGame];
};

export const addEntry = async (entry: Entry) => {
  const path = `${ENTRIES_PATH}/${entry.id}`;
  await setValue(path, entry);
};

export const addEntries = async (entries: Entry[]) => {
  for (let entry of entries) {
    await addEntry(entry);
  }
};

export const getEntriesWithGameId = async (id: string) => {
  return getFilteredArray(ENTRIES_PATH, 'game', id);
};

export const getAllEntries = async () => {
  return getArray<Entry>(ENTRIES_PATH);
};
