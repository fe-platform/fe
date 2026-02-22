import type { Plugin, LoadContext } from '@docusaurus/types';

export default function themeBrutalist(context: LoadContext): Plugin {
  return {
    name: 'docusaurus-theme-brutalist',

    getClientModules() {
      return [require.resolve('./styles.css')];
    },

    injectHtmlTags() {
      return {
        headTags: [
          {
            tagName: 'link',
            attributes: {
              rel: 'stylesheet',
              href: 'https://cdn.jsdelivr.net/npm/computer-modern@0.1.3/cmu-serif.min.css',
            },
          },
          {
            tagName: 'link',
            attributes: {
              rel: 'preconnect',
              href: 'https://fonts.googleapis.com',
            },
          },
          {
            tagName: 'link',
            attributes: {
              rel: 'preconnect',
              href: 'https://fonts.gstatic.com',
              crossorigin: 'anonymous',
            },
          },
          {
            tagName: 'link',
            attributes: {
              rel: 'stylesheet',
              href: 'https://fonts.googleapis.com/css2?family=Google+Sans+Code:ital,wght@0,300..800;1,300..800&display=swap',
            },
          },
        ],
      };
    },
  };
}
