export default {
    title: 'Dev Docs',
    lastUpdated: true,
    base: 'technical-docs',
    themeConfig: {
      logo: '/logo.png',
      socialLinks: [
        { icon: 'github', link: 'https://github.com/sardul3' },
        { icon: 'linkedin', link: 'https://www.linkedin.com/in/sagar-poud/' }
      ],
      nav: [
        { text: 'Team', link: '/team' },
  
      ],     
      sidebar: [
        {
          text: 'Rest API',
          items: [
            { text: 'Idempotency', link: '/idempotency' },
            { text: 'eTags in APIs',  link: '/eTags' },
            { text: 'Caching and Filtering', link: '/caching-and-filtering' },
            { text: 'HATEOAS', link: '/hateoas' },
            { text: 'Rate Limiting and Throttling', link: '/rate-limiting-and-throttling' },
          ]
        },
        {
          text: 'Temporal',
          items: [
            { text: 'Temporal with Spring Boot', link: ' /temporal-with-springboot' },
          ]
        },
        {
          text: 'TDD with Java',
          items: [
          ]
        },
        {
          text: 'Kubernetes',
          items: [
            { text: 'Setup Local K8', link: ' /kubernetes-setup' },
            
          ]
        },
        {
          text: 'Others',
          items: [
            { text: 'Neovim', link: ' /neovim' },
            { text: 'SSH and Server Access', link: '/ssh-server-access' },
          ]
        }
      ],
  
      lastUpdated: {
        text: 'Updated at',
        formatOptions: {
          dateStyle: 'full',
          timeStyle: 'medium'
        }
      },
      
      search: {
        provider: 'local'
    }
    },
  
  
  }
