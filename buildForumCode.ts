import { Entry } from './types';

export const buildForumCode = (entries: Entry[]) => {
  const links = entries.map((entry) => {
    const date = new Date(entry.date).toLocaleString('en-gb', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return `[url=${entry.link}]${date}[/url]`;
  });

  return `
[heading][/heading]
[size=9]Previous plays of this game:[/size]
[size=8]${links.join('[c] [/c]')}[/size]
`.trim();
};
