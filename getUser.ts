import { makeRequest } from './bgg';

interface BGGUser {
  id: string;
  name: string;
  firstname: string;
  lastname: string;
  avatarlink: { value: string };
}

interface BGGUserResponse {
  user: BGGUser;
}

export const getUser = async (username: string) => {
  const response = await makeRequest<BGGUserResponse>('user', {
    name: username,
  });
  return response.user;
};
