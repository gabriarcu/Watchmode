<template>
  <div class="upcoming container">
    <div class="header">
      <h2>Prossime Uscite</h2>
      <p>Scopri i titoli in arrivo nel tuo paese.</p>
    </div>

    <div class="loading-state" v-if="isLoading">
      Caricamento in corso...
    </div>

    <div class="grid" v-else-if="releases.length > 0">
      <div class="release-card glass-panel" v-for="release in releases" :key="release.id">
        <img :src="release.poster_url" alt="poster" v-if="release.poster_url" class="release-poster" />
        <div class="release-info">
          <h3>{{ release.title }}</h3>
          <p class="release-date">Data: {{ formatDate(release.source_release_date) }}</p>
          <p class="release-type">{{ release.type === 'movie' ? 'Film' : 'Serie TV' }}</p>
        </div>
      </div>
    </div>
    
    <div class="empty-state" v-else>
      Nessuna uscita imminente trovata.
    </div>
  </div>
</template>

<script>
import watchmodeAPI from '../services/watchmode';

export default {
  name: 'UpcomingView',
  data() {
    return {
      isLoading: false,
      releases: []
    }
  },
  async created() {
    this.isLoading = true;
    try {
      const res = await watchmodeAPI.getUpcomingReleases();
      // Watchmode releases endopint torna un array di uscite
      this.releases = res.releases || res || [];
    } catch (error) {
      console.error("Errore recupero uscite", error);
    } finally {
      this.isLoading = false;
    }
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return 'TBA';
      const d = new Date(dateString);
      return d.toLocaleDateString('it-IT');
    }
  }
}
</script>

<style scoped>
.upcoming {
  padding-top: 40px;
  padding-bottom: 60px;
}

.header {
  margin-bottom: 40px;
}

.header h2 {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.header p {
  color: var(--text-muted);
  font-size: 1.1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 25px;
}

.release-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: var(--transition);
}

.release-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.3);
}

.release-poster {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.release-info {
  padding: 20px;
}

.release-info h3 {
  font-size: 1.1rem;
  margin-bottom: 10px;
}

.release-date {
  color: var(--primary-color);
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.release-type {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 60px;
  color: var(--text-muted);
}
</style>
