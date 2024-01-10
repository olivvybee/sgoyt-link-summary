import { makeRequest } from './bgg';

const PATH = 'thing';

export interface BGGGameName {
  type: string;
  sortindex: string;
  value: string;
}

export interface BGGGameLink {
  type: string;
  id: string;
  inbound?: string;
}

interface BGGGameResponse {
  items: {
    item: {
      id: string;
      name: BGGGameName[];
      link: BGGGameLink[];
      description: string;
      type: string;
    };
  };
}

export const getBaseGamesForExpansion = async (gameId: string) => {
  const params = {
    id: gameId,
    type: 'boardgame,boardgameexpansion',
  };

  const response = await makeRequest<BGGGameResponse>(PATH, params, [
    'items.item.name',
    'items.item.link',
  ]);

  return response.items.item.link
    .filter(
      (link) => link.type === 'boardgameexpansion' && link.inbound === 'true'
    )
    .map((link) => link.id);
};
