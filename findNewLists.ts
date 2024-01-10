import { makeRequest } from './bgg';
import { notUndefined } from './notUndefined';

const PATH = 'thread';
const THREAD_ID = '986303';

interface BGGThreadPost {
  subject: string;
  body: string;
  id: string;
  username: string;
  link: string;
  postdate: string;
  editdate: string;
  numedits: string;
}

interface BGGThreadResponse {
  thread: {
    subject: string;
    articles: {
      article: BGGThreadPost[];
    };
    id: string;
    numarticles: string;
    link: string;
  };
}

export const findNewLists = async (lastPostId?: string) => {
  const params = {
    id: THREAD_ID,
    ...(lastPostId ? { minarticleid: lastPostId } : {}),
  };

  const response = await makeRequest<BGGThreadResponse>(PATH, params, [
    'thread.articles.article',
  ]);

  const posts = response.thread.articles.article || [];
  const listIds = posts
    .filter((post) => post.id !== lastPostId)
    .map(getLinkFromPost)
    .filter(notUndefined);

  const newLastPostId = posts.at(-1)!.id;

  return { listIds, newLastPostId };
};

const getLinkFromPost = (post: BGGThreadPost) => {
  const match = post.body.match(/boardgamegeek\.com\/geeklist\/(\d+)/);
  if (!match) {
    return undefined;
  }
  return match[1];
};
