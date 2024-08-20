import _chunk from 'lodash/chunk';

import { Game } from './types';
import { makeRequest } from './bgg';

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

export interface BGGGame {
  id: string;
  image: string;
  thumbnail: string;
  name: BGGGameName[];
  link: BGGGameLink[];
}

export interface BGGGamesResponse {
  items: {
    item?: BGGGame[];
  };
}

const ARRAY_PATHS = ['items.item.name'];

export const getGameInfo = async (gameIds: string[]): Promise<Game[]> => {
  const games: Game[] = [];
  const chunks = _chunk(gameIds, 20);

  for (let chunk of chunks) {
    const params = {
      id: chunk.join(','),
      thing: 'boardgame',
    };

    const response = await makeRequest<BGGGamesResponse>(
      'thing',
      params,
      ARRAY_PATHS
    );

    if (!response) {
      throw new Error('No data returned from BGG');
    }

    games.push(
      ...(response.items.item?.map((game) => ({
        id: game.id,
        name: game.name.find((name) => name.type === 'primary')!.value,
        image: game.image,
        expansionFor: game.link
          .filter(
            (link) =>
              link.type === 'boardgameexpansion' && link.inbound === 'true'
          )
          .map((link) => link.id),
      })) || [])
    );
  }

  return games;
};
