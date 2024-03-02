import { makeJsonRequest } from './bgg';
import { getBaseGamesForExpansion } from './getBaseGamesForExpansion';

interface BGGListItem {
  type: string;
  id: string;
  listid: string;
  item: {
    type: string;
    id: string;
    name: string;
    href: string;
  };
  postdate: string;
  editdate: string;
  body: string;
  author: number;
  href: string;
}

interface ListEntry {
  id: string;
  listId: string;
  link: string;
  gameId: string;
  expansionFor: string[];
  date: string;
}

export const getUserPosts = async (userId: string): Promise<ListEntry[]> => {
  const entries = await makeJsonRequest<BGGListItem[]>('listitems', {
    author: userId,
    domain: 'boardgame',
  });

  return Promise.all(
    entries.map(async (entry) => {
      const baseGameIds = await getBaseGamesForExpansion(entry.item.id);
      return {
        id: entry.id,
        listId: entry.listid,
        link: `https://boardgamegeek.com${entry.href}`,
        gameId: entry.item.id,
        expansionFor: baseGameIds,
        date: entry.postdate,
      };
    })
  );
};
