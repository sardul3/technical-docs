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
      ],
      sidebar: [
        {
          text: 'Bootcamp',
          items: [
            { text: 'Intro to API', link: '/intro-to-api' },
          ]
        },
        {
          text: 'Rest API',
          items: [
            { text: 'Idempotency', link: '/idempotency' },
            { text: 'eTags in APIs', link: '/eTags' },
            { text: 'Caching and Filtering', link: '/caching-and-filtering' },
            { text: 'HATEOAS', link: '/hateoas' },
            { text: 'Rate Limiting and Throttling', link: '/rate-limiting-and-throttling' },
          ]
        },
        {
          text: 'Temporal',
          items: [
            { text: 'Temporal with Spring Boot', link: '/temporal-with-springboot' },
          ]
        },
        {
          text: 'TDD with Java',
          items: [
            { text: 'Getting Started', link: '/tdd-with-java/getting-started' },
            { text: 'Best Practices', link: '/tdd-with-java/best-practices' },
          ]
        },
        {
          text: 'Kubernetes',
          items: [
            { text: 'Setup Local K8', link: '/kubernetes-setup' },
            { text: 'Deploy Apps on K8', link: '/deploy-apps-on-k8' },
          ]
        },
        {
          text: 'Others',
          items: [
            { text: 'Neovim', link: '/neovim' },
            { text: 'SSH and Server Access', link: '/ssh-server-access' },
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
      lineNumbers: true,
      toc: {
        level: [1, 2, 3]
      }
    }
  };
