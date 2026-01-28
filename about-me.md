---
layout: home
aside: false
---
<style>
  .about-hero-row {
    display: grid;
    grid-template-columns: 35% 1fr;
    gap: 1.25rem;
    min-height: 545px;
    align-items: stretch;
  }
  .about-hero-row .about-intro-cell {
    min-height: 545px;
  }
  .about-hero-row .about-spotify-cell {
    min-height: 545px;
  }
  .about-hero-row .about-intro-cell .about-intro-inner {
    height: 100%;
    min-height: 545px;
    display: flex;
  }
  .about-hero-row .about-spotify-cell .about-spotify-inner {
    height: 100%;
    min-height: 545px;
    display: flex;
  }
  @media (max-width: 768px) {
    .about-hero-row {
      grid-template-columns: 1fr;
      min-height: 0;
    }
    .about-hero-row .about-intro-cell,
    .about-hero-row .about-spotify-cell {
      min-height: 0;
    }
    .about-hero-row .about-intro-cell .about-intro-inner {
      min-height: 0;
      height: auto;
    }
    .about-hero-row .about-spotify-cell .about-spotify-inner {
      min-height: 0;
      height: 400px;
    }
  }
</style>

<div class="about-hero-row rounded-xl overflow-hidden">
  <div class="about-intro-cell">
    <div class="about-intro-inner w-full">
      <PortfolioHeader />
    </div>
  </div>
  <div class="about-spotify-cell">
    <div class="about-spotify-inner w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 shadow-sm">
      <iframe
        class="w-full h-full flex-1"
        style="min-height: 545px;"
        src="https://open.spotify.com/embed/playlist/5YeV7f0dEAoj1F4YYIzyy7?utm_source=generator"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy">
      </iframe>
    </div>
  </div>
</div>

<div class="mt-8 py-2 rounded-2xl bg-gray-50/70 dark:bg-transparent">
  <PortfolioContainer />
</div>
