export default {
    title: 'Dev Docs',
    head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
    description: 'Comprehensive developer documentation for REST APIs, Temporal, Kubernetes, and more.',
    lastUpdated: true,
    themeConfig: {
      logo: '/logo.png',
      head: [
          ['meta', {property: 'google-site-verification', content: 'nsrpO5pPQPNLyq8-NFkQL4-frwYOaOhxfl54-7htVv0' }]
      ],
      socialLinks: [
        { icon: 'github', link: 'https://github.com/sardul3' },
        { icon: 'linkedin', link: 'https://www.linkedin.com/in/sagar-poud/' }
      ],
      nav: [
        { text: 'Team', link: '/team' },
        { text: 'About Me', link: '/about-me' },
      ],
      sidebar: [
        {
          text: 'Bootcamp',
          items: [
            { text: 'Intro to API', link: '/boot-camp/intro-to-api' },
            { text: 'Milestone #1', link: '/boot-camp/api-dev-mile1' },
            { text: 'Milestone #2', link: '/boot-camp/api-dev-mile2' },
            { text: 'Milestone #3', link: '/boot-camp/api-dev-mile3' },
          ]
        },
        {
          text: 'Rest API',
          items: [
            { text: 'Idempotency', link: '/rest-api/idempotency' },
            { text: 'eTags in APIs', link: '/rest-api/eTags' },
            { text: 'Caching and Filtering', link: '/rest-api/caching-and-filtering' },
            { text: 'HATEOAS', link: '/rest-api/hateoas' },
            { text: 'Rate Limiting and Throttling', link: '/rest-api/rate-limiting-and-throttling' },
          ]
        },
        {
          text: 'Temporal',
          items: [
            { text: 'Temporal with Spring Boot', link: '/temporal/temporal-with-springboot' },
          ]
        },
        {
          text: 'TDD with Java',
          items: [
            { text: 'Getting Started', link: '/tdd/getting-started' },
            { text: 'Best Practices', link: '/tdd/best-practices' },
          ]
        },
        {
          text: 'Kubernetes',
          items: [
            { text: 'Setup Local K8', link: '/k8/kubernetes-setup' },
            { text: 'Deploy Apps on K8', link: '/k8/deploy-apps-on-k8' },
          ]
        },
        {
          text: 'Others',
          items: [
            { text: 'Clean Code', link: '/others/clean-code' },
            { text: 'Data Intensive Design', link: '/others/data-intensive-design' },
            { text: 'Neovim', link: '/others/neovim' },
            { text: 'SSH and Server Access', link: '/others/ssh-server-access' },
          ]
        }
      ],
      footer: {
        message: 'Released under the MIT License.',
        copyright: 'Copyright © 2024 Sagar Poudel'
      },
      lastUpdated: {
        text: 'Updated at',
        formatOptions: {
          dateStyle: 'full',
          timeStyle: 'medium'
        }
      },
      editLink: {
        pattern: 'https://github.com/sardul3/technical-docs/blob/main/:path',
        text: 'Edit this page on GitHub'
      },
      search: {
        provider: 'local'
      },
      outline: {
        level: [2, 3],
        label: 'Table of Contents'
      },
      docFooter: {
        prev: 'Previous',
        next: 'Next'
      },
      darkModeSwitchLabel: 'Toggle Dark Mode',
      sidebarMenuLabel: 'Menu',
      returnToTopLabel: 'Return to Top'
    },
    markdown: {
      image: {
        lazyLoading: true
      },
      lineNumbers: true,
      toc: {
        level: [1, 2, 3]
      }
    },
    sitemap: {
      hostname: 'https://sardul3.com'
    }
  };
