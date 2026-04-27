<template>
  <div class="home container">
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Scopri dove guardare i tuoi <span>film</span> e le tue <span>serie TV</span> preferite.</h1>
        <p class="hero-subtitle">Cerca un titolo, scopri in quale piattaforma è disponibile e inizia subito a guardarlo.</p>
        <router-link to="/explore" class="btn btn-large">Esplora il catalogo</router-link>
      </div>
    </section>

    <section class="trending-section">
      <h2>Aggiunti di Recente</h2>
      <div class="grid" v-if="popularTitles.length">
        <div 
          class="poster-card" 
          v-for="title in popularTitles" 
          :key="title.id"
          @click="goToDetail(title.id)"
        >
          <img :src="title.poster_url" alt="poster" v-if="title.poster_url" />
          <div class="poster-overlay">
            <h4>{{ title.title }}</h4>
            <p>{{ title.year }}</p>
          </div>
        </div>
      </div>
      <div v-else class="loading-state">
        Caricamento titoli...
      </div>
    </section>
  </div>
</template>

<script>
import watchmodeAPI from '../services/watchmode';

export default {
  name: 'HomeView',
  data() {
    return {
      popularTitles: []
    }
  },
  async created() {
    try {
      // L'endpoint list-titles sta avendo problemi di Timeout (504) lato server Watchmode.
      // Utilizziamo le "Ultime Aggiunte" (releases) come fallback per popolare l'Home Page istantaneamente.
      const res = await watchmodeAPI.getUpcomingReleases();
      
      const releases = res.releases || res || [];
      // Mappiamo i risultati per adattarli alla UI
      this.popularTitles = releases.slice(0, 12).map(r => ({
        id: r.id,
        title: r.title,
        poster_url: r.poster_url,
        year: r.source_release_date ? r.source_release_date.split('-')[0] : 'Novità'
      }));
    } catch (error) {
      console.error("Errore nel caricamento dei titoli", error);
      this.popularTitles = [];
    }
  },
  methods: {
    goToDetail(id) {
      this.$router.push({ name: 'TitleDetail', params: { id } });
    }
  }
}
</script>

<style scoped>
.home {
  padding-top: 40px;
  padding-bottom: 60px;
}

.hero-section {
  text-align: center;
  padding: 60px 0;
  margin-bottom: 40px;
  background: radial-gradient(circle at center, rgba(229, 9, 20, 0.15) 0%, rgba(11, 15, 25, 0) 70%);
}

.hero-title {
  font-size: 3.5rem;
  margin-bottom: 20px;
  line-height: 1.2;
}

.hero-title span {
  color: var(--primary-color);
}

.hero-subtitle {
  font-size: 1.2rem;
  color: var(--text-muted);
  margin-bottom: 30px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.btn-large {
  font-size: 1.1rem;
  padding: 1rem 2rem;
}

.trending-section h2 {
  margin-bottom: 20px;
  font-size: 2rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.poster-card {
  aspect-ratio: 2/3;
  background: var(--surface-color);
}

.poster-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px 10px 10px;
  background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
  opacity: 0;
  transition: var(--transition);
}

.poster-card:hover .poster-overlay {
  opacity: 1;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}
</style>
