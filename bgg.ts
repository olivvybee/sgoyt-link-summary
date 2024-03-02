import { XMLParser } from 'fast-xml-parser';
import { sleep } from './sleep';

const BASE_URL_V2 = 'https://www.boardgamegeek.com/xmlapi2';
const BASE_URL_V1 = 'https://www.boardgamegeek.com/xmlapi';
const JSON_BASE_URL = 'https://api.geekdo.com/api';

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

export const makeJsonRequest = async <T>(
  path: string,
  params: Record<string, string>
): Promise<T> => {
  const queryParams = new URLSearchParams(params);
  const url = `${JSON_BASE_URL}/${path}?${queryParams.toString()}`;

  const response = await fetch(url);
  const json = await response.json();

  const pageData = json.data;

  const perPage = json.pagination.perPage;
  const total = json.pagination.total;
  const numPages = Math.ceil(total / perPage);

  for (let page = 2; page <= numPages; page++) {
    const pageQueryParams = new URLSearchParams({
      ...params,
      page: page.toString(),
    });
    const pageUrl = `${JSON_BASE_URL}/${path}?${pageQueryParams.toString()}`;

    const pageResponse = await fetch(pageUrl);
    const pageJson = await pageResponse.json();
    pageData.push(pageJson.data);
  }

  return pageData.flat();
};
