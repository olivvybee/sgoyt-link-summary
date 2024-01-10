import { XMLParser } from 'fast-xml-parser';
import { sleep } from './sleep';

const BASE_URL_V2 = 'https://www.boardgamegeek.com/xmlapi2';
const BASE_URL_V1 = 'https://www.boardgamegeek.com/xmlapi';

export const makeRequest = async <T>(
  path: string,
  params: Record<string, string>,
  arrayPaths: string[] = [],
  useV1Api = false
): Promise<T> => {
  const baseUrl = useV1Api ? BASE_URL_V1 : BASE_URL_V2;

  const queryParams = new URLSearchParams(params);
  const url = `${baseUrl}/${path}?${queryParams.toString()}`;

  let response = await fetch(url);

  let attempts = 1;
  while (response.status === 202 && attempts < 6) {
    const delay = 1000 * Math.pow(2, attempts);
    console.log(`Waiting for ${delay} ms due to 202 response...`);
    await sleep(delay);
    response = await fetch(url);
    attempts += 1;
  }

  const body = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    ignoreDeclaration: true,
    isArray: (tagName, jPath, isLeafNode, isAttribute) =>
      arrayPaths.includes(jPath),
  });
  const parsedResponse = parser.parse(body);

  return parsedResponse;
};
