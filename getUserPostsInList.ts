import { makeRequest } from './bgg';
import { getBaseGamesForExpansion } from './getBaseGamesForExpansion';

const PATH = 'geeklist';

interface BGGListEntry {
  body: string;
  id: string;
  objecttype: string;
  subtype: string;
  objectid: string;
  objectname: string;
  username: string;
  postdate: string;
  editdate: string;
  thumbs: string;
  imageid: string;
}

interface BGGListResponse {
  geeklist: {
    postdate: string;
    postdate_timestamp: number;
    editdate: string;
    editdate_timestamp: number;
    thumbs: number;
    numitems: number;
    username: string;
    title: string;
    description: string;
    item: BGGListEntry[];
    id: string;
  };
}

interface ListEntry {
  id: string;
  listId: string;
  link: string;
  gameId: string;
  expansionFor: string[];
  date: string;
}

export const getUserPostsInList = async (
  username: string,
  listId: string
): Promise<ListEntry[]> => {
  const path = `${PATH}/${listId}`;

  const response = await makeRequest<BGGListResponse>(
    path,
    {},
    ['geeklist.item'],
    true
  );

  const entries = response.geeklist.item;

  return Promise.all(
    entries
      .filter(
        (entry) => entry.username.toLowerCase() === username.toLowerCase()
      )
      .map(async (entry) => {
        const baseGameIds = await getBaseGamesForExpansion(entry.objectid);

        return {
          id: entry.id,
          listId,
          link: makeEntryLink(listId, entry.id),
          gameId: entry.objectid,
          expansionFor: baseGameIds,
          date: new Date(entry.postdate).toISOString(),
        };
      })
  );
};

const makeEntryLink = (listId: string, entryId: string) =>
  `https://boardgamegeek.com/geeklist/${listId}/?itemid=${entryId}#${entryId}`;
