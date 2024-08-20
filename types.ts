export interface Game {
  id: string;
  name: string;
  expansionFor?: string[];
}

export interface Entry {
  id: string;
  date: string;
  game: string;
  link: string;
}
