import { makeJsonRequest } from './bgg';

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
  date: string;
}

export const getUserPosts = async (userId: string): Promise<ListEntry[]> => {
  const entries = await makeJsonRequest<BGGListItem[]>('listitems', {
    author: userId,
    domain: 'boardgame',
  });

  return entries.map((entry) => ({
    id: entry.id,
    listId: entry.listid,
    link: `https://boardgamegeek.com${entry.href}`,
    gameId: entry.item.id,
    date: entry.postdate,
  }));
};
