<template>
  <div class="title-detail" v-if="title">
    <!-- Backdrop Background -->
    <div 
      class="backdrop" 
      :style="{ backgroundImage: `url(${title.backdrop || title.poster})` }"
    >
      <div class="backdrop-overlay"></div>
    </div>

    <div class="container detail-content">
      <div class="poster-container">
        <img :src="title.poster" :alt="title.title" class="main-poster" />
      </div>
      
      <div class="info-container">
        <h1 class="title">{{ title.title }}</h1>
        <div class="meta">
          <span class="year">{{ title.year }}</span>
          <span class="type">{{ title.type === 'movie' ? 'Film' : 'Serie TV' }}</span>
          <span class="rating" v-if="title.user_rating">⭐ {{ title.user_rating }} / 10</span>
        </div>
        
        <p class="plot">{{ title.plot_overview }}</p>

        <!-- Sezione Cruciale: Dove Guardarlo -->
        <div class="watch-section glass-panel">
          <h2>Dove Guardarlo</h2>
          
          <div v-if="hasSources">
            <!-- Abbonamento (sub) -->
            <div class="source-group" v-if="groupedSources.sub.length">
              <h3>In Abbonamento</h3>
              <div class="source-list">
                <a 
                  v-for="source in groupedSources.sub" 
                  :key="source.source_id" 
                  :href="source.web_url" 
                  target="_blank"
                  class="source-item"
                >
                  <span>{{ source.name }}</span>
                </a>
              </div>
            </div>

            <!-- Gratis (free) -->
            <div class="source-group" v-if="groupedSources.free.length">
              <h3>Gratis</h3>
              <div class="source-list">
                <a 
                  v-for="source in groupedSources.free" 
                  :key="source.source_id" 
                  :href="source.web_url" 
                  target="_blank"
                  class="source-item"
                >
                  <span>{{ source.name }}</span>
                </a>
              </div>
            </div>

            <!-- Noleggio (rent) -->
            <div class="source-group" v-if="groupedSources.rent.length">
              <h3>A Noleggio</h3>
              <div class="source-list">
                <a 
                  v-for="source in groupedSources.rent" 
                  :key="source.source_id" 
                  :href="source.web_url" 
                  target="_blank"
                  class="source-item"
                >
                  <span>{{ source.name }}</span>
                </a>
              </div>
            </div>
            
            <!-- Acquisto (buy) -->
            <div class="source-group" v-if="groupedSources.buy.length">
              <h3>Acquisto</h3>
              <div class="source-list">
                <a 
                  v-for="source in groupedSources.buy" 
                  :key="source.source_id" 
                  :href="source.web_url" 
                  target="_blank"
                  class="source-item"
                >
                  <span>{{ source.name }}</span>
                </a>
              </div>
            </div>

          </div>
          <div v-else class="no-sources">
            <p>Attualmente non disponibile in streaming nella tua regione.</p>
          </div>
        </div>
        
        <!-- Sezione Trailer -->
        <div class="trailer-section glass-panel" v-if="youtubeEmbedUrl">
          <h2>Trailer</h2>
          <div class="video-container">
            <iframe 
              :src="youtubeEmbedUrl" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen>
            </iframe>
          </div>
        </div>

        <!-- Sezione Cast -->
        <div class="cast-section glass-panel" v-if="actors && actors.length">
          <h2>Cast Principale</h2>
          <div class="cast-scroll">
            <div 
              class="cast-member" 
              v-for="member in actors" 
              :key="member.person_id"
              @click="goToPerson(member.person_id)"
            >
              <img :src="member.headshot_url" :alt="member.full_name" v-if="member.headshot_url && member.headshot_url !== 'null'" />
              <div class="cast-avatar-placeholder" v-else>
                <span>👤</span>
              </div>
              <div class="cast-info">
                <strong>{{ member.full_name }}</strong>
                <span>{{ member.role || 'Attore' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="loading-state container" v-else>
    Caricamento dettagli...
  </div>
</template>

<script>
import watchmodeAPI from '../services/watchmode';

export default {
  name: 'TitleDetail',
  data() {
    return {
      title: null,
      groupedSources: {
        sub: [],
        rent: [],
        buy: [],
        free: []
      }
    };
  },
  computed: {
    hasSources() {
      return this.groupedSources.sub.length > 0 ||
             this.groupedSources.rent.length > 0 ||
             this.groupedSources.buy.length > 0 ||
             this.groupedSources.free.length > 0;
    },
    actors() {
      if (!this.title || !this.title.cast) return [];
      // Filtra solo gli attori (type === 'Cast') e mostra i primi 15
      return this.title.cast.filter(m => m.type === 'Cast').slice(0, 15);
    },
    youtubeEmbedUrl() {
      if (this.title && this.title.trailer && this.title.trailer.includes('youtube.com/watch?v=')) {
        return this.title.trailer.replace('watch?v=', 'embed/');
      }
      return null;
    }
  },
  async created() {
    await this.fetchDetails();
  },
  watch: {
    '$route.params.id': 'fetchDetails'
  },
  methods: {
    async fetchDetails() {
      const id = this.$route.params.id;
      if (!id) return;
      
      try {
        const res = await watchmodeAPI.getTitleDetails(id);
        this.title = res;
        this.groupSources(res.sources || []);
      } catch (error) {
        console.error("Errore recupero dettagli", error);
      }
    },
    groupSources(sources) {
      // Resetta i gruppi
      this.groupedSources = { sub: [], rent: [], buy: [], free: [] };
      
      // Filtra duplicati mantenendo solo uno per piattaforma (mac OS e web)
      const uniqueSources = [];
      const map = new Map();
      for (const item of sources) {
          if(!map.has(item.name)){
              map.set(item.name, true);
              uniqueSources.push(item);
          }
      }

      uniqueSources.forEach(source => {
        if (source.type === 'sub') this.groupedSources.sub.push(source);
        else if (source.type === 'rent') this.groupedSources.rent.push(source);
        else if (source.type === 'buy') this.groupedSources.buy.push(source);
        else if (source.type === 'free') this.groupedSources.free.push(source);
      });
    },
    goToPerson(personId) {
      this.$router.push({ name: 'PersonDetail', params: { id: personId } });
    }
  }
}
</script>

<style scoped>
.title-detail {
  position: relative;
  min-height: calc(100vh - 70px);
}

.backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60vh;
  background-size: cover;
  background-position: center;
  z-index: -1;
}

.backdrop-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(11, 15, 25, 0.4) 0%, rgba(11, 15, 25, 1) 100%);
  backdrop-filter: blur(5px);
}

.detail-content {
  display: flex;
  gap: 40px;
  padding-top: 10vh;
  padding-bottom: 60px;
}

.poster-container {
  flex-shrink: 0;
  width: 300px;
}

.main-poster {
  width: 100%;
  border-radius: var(--border-radius);
  box-shadow: 0 20px 40px rgba(0,0,0,0.6);
}

.info-container {
  flex-grow: 1;
}

.title {
  font-size: 3rem;
  margin-bottom: 10px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
}

.meta {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  font-size: 1.1rem;
  color: var(--text-muted);
}

.rating {
  color: #fbbf24;
  font-weight: 600;
}

.plot {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 40px;
  max-width: 800px;
}

.watch-section {
  padding: 30px;
  margin-top: 20px;
  max-width: 800px;
}

.watch-section h2 {
  font-size: 1.8rem;
  margin-bottom: 25px;
  color: var(--primary-color);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding-bottom: 10px;
}

.source-group {
  margin-bottom: 25px;
}

.source-group h3 {
  font-size: 1.2rem;
  margin-bottom: 15px;
  color: var(--text-main);
}

.source-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.source-item {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 10px 20px;
  border-radius: 30px;
  font-weight: 600;
  transition: var(--transition);
}

.source-item:hover {
  background: var(--primary-color);
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.no-sources {
  color: var(--text-muted);
  font-style: italic;
}

.loading-state {
  text-align: center;
  padding: 100px;
  font-size: 1.2rem;
  color: var(--text-muted);
}

.trailer-section, .cast-section {
  padding: 30px;
  margin-top: 20px;
  max-width: 800px;
}

.trailer-section h2, .cast-section h2 {
  font-size: 1.8rem;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding-bottom: 10px;
}

.video-container {
  width: 100%;
  max-width: 640px; /* Limita la larghezza massima su desktop */
  aspect-ratio: 16 / 9; /* Layout responsivo moderno */
}

.video-container iframe {
  width: 100%;
  height: 100%;
  border-radius: var(--border-radius);
}

.cast-scroll {
  display: flex;
  overflow-x: auto;
  gap: 15px;
  padding-bottom: 15px;
}

.cast-member {
  min-width: 120px;
  max-width: 120px;
  cursor: pointer;
  transition: transform 0.2s;
}

.cast-member:hover {
  transform: translateY(-5px);
}

.cast-member img, .cast-avatar-placeholder {
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
  border-radius: var(--border-radius);
  margin-bottom: 10px;
  background: var(--surface-color);
}

.cast-avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: var(--text-muted);
}

.cast-info strong {
  display: block;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cast-info span {
  display: block;
  font-size: 0.8rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .detail-content {
    flex-direction: column;
    align-items: center;
    padding-top: 5vh;
  }
  
  .poster-container {
    width: 200px;
  }
  
  .title {
    font-size: 2rem;
    text-align: center;
  }
  
  .meta {
    justify-content: center;
  }
  
  .plot {
    text-align: center;
  }
}
</style>
