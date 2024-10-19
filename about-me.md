---
layout: home
aside: false
---
<style>
  @media (max-width: 768px) {
    .responsive-container {
      display: block !important;
    }
    .responsive-cell {
      display: block !important;
      width: 100% !important;
      padding-right: 0 !important;
      margin-bottom: 20px;
    }
  }
</style>

<div class="responsive-container" style="display: table; width: 100%;">
  <div class="responsive-cell" style="display: table-cell; width: 35%; padding-right: 20px; height: 545px;">
    <PortfolioHeader />
  </div>
  <div class="responsive-cell" style="display: table-cell; width: 65%; vertical-align: top;">
    <iframe 
      style="border-radius:12px; width:100%; height:545px;" 
      src="https://open.spotify.com/embed/playlist/5YeV7f0dEAoj1F4YYIzyy7?utm_source=generator" 
      frameBorder="0" 
      allowfullscreen=""
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
      loading="lazy">
    </iframe>
  </div>
</div>

<div style="margin-top: 2rem;">
  <PortfolioContainer />
</div>
