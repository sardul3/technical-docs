---
layout: page
---
<script setup>
import {
  VPTeamPage,
  VPTeamPageTitle,
  VPTeamMembers
} from 'vitepress/theme'

const members = [

    {
    avatar: 'https://avatars.githubusercontent.com/u/15206322?v=4',
    name: 'Sagar Poudel',
    title: 'Creator',
    links: [
      { icon: 'github', link: 'https://github.com/sardul3' },
    ]
  },

]
</script>

<VPTeamPage>
  <VPTeamPageTitle>
    <template #title>
      Our Team
    </template>
  </VPTeamPageTitle>
  <VPTeamMembers
    :members="members"
  />
</VPTeamPage>
