<template>
  <div class="person-detail container" v-if="person">
    <div class="person-header glass-panel">
      <div class="headshot-container">
        <img :src="person.headshot_url" :alt="person.full_name" class="headshot" v-if="person.headshot_url" />
        <div class="headshot-placeholder" v-else></div>
      </div>
      
      <div class="person-info">
        <h1 class="name">{{ person.full_name }}</h1>
        <div class="meta">
          <span class="profession" v-if="person.main_profession">{{ formatProfession(person.main_profession) }}</span>
          <span class="dob" v-if="person.date_of_birth">Nato il: {{ formatDate(person.date_of_birth) }}</span>
        </div>
      </div>
    </div>

    <div class="known-for-section">
      <h2>Conosciuto Per</h2>
      <div class="loading-state" v-if="isLoadingMovies">
        Caricamento filmografia...
      </div>
      
      <div class="grid" v-else-if="knownForTitles.length > 0">
        <div 
          class="poster-card" 
          v-for="title in knownForTitles" 
          :key="title.id"
          @click="goToDetail(title.id)"
        >
          <img :src="title.poster" alt="poster" v-if="title.poster" />
          <div class="poster-overlay">
            <h4>{{ title.title }}</h4>
            <p>{{ title.year }}</p>
          </div>
        </div>
      </div>
      <div class="empty-state" v-else>
        Nessun titolo trovato.
      </div>
    </div>
  </div>
  <div class="loading-state container" v-else>
    Caricamento dettagli persona...
  </div>
</template>

<script>
import watchmodeAPI from '../services/watchmode';

export default {
  name: 'PersonDetail',
  data() {
    return {
      person: null,
      knownForTitles: [],
      isLoadingMovies: false
    }
  },
  async created() {
    await this.fetchPerson();
  },
  watch: {
    '$route.params.id': 'fetchPerson'
  },
  methods: {
    async fetchPerson() {
      const id = this.$route.params.id;
      if (!id) return;
      
      try {
        this.person = await watchmodeAPI.getPersonDetails(id);
        
        if (this.person.known_for && this.person.known_for.length > 0) {
          this.fetchKnownFor(this.person.known_for);
        }
      } catch (error) {
        console.error("Errore recupero dettagli persona", error);
      }
    },
    async fetchKnownFor(titleIds) {
      this.isLoadingMovies = true;
      this.knownForTitles = [];
      
      // Prendiamo solo i primi 10 titoli per non esaurire le chiamate API
      const topIds = titleIds.slice(0, 10);
      
      for (const titleId of topIds) {
        try {
          const detail = await watchmodeAPI.getTitleDetails(titleId);
          if (detail) {
            this.knownForTitles.push(detail);
          }
          await new Promise(resolve => setTimeout(resolve, 250)); // Throttling
        } catch (e) {
          console.error("Errore caricamento titolo", titleId);
        }
      }
      this.isLoadingMovies = false;
    },
    formatDate(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('it-IT');
    },
    formatProfession(prof) {
      const professions = {
        'actor': 'Attore',
        'actress': 'Attrice',
        'director': 'Regista',
        'producer': 'Produttore',
        'writer': 'Sceneggiatore'
      };
      return professions[prof.toLowerCase()] || prof;
    },
    goToDetail(id) {
      this.$router.push({ name: 'TitleDetail', params: { id } });
    }
  }
}
</script>

<style scoped>
.person-detail {
  padding-top: 40px;
  padding-bottom: 60px;
}

.person-header {
  display: flex;
  gap: 30px;
  padding: 30px;
  margin-bottom: 40px;
  align-items: center;
}

.headshot-container {
  flex-shrink: 0;
  width: 200px;
}

.headshot {
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
  border-radius: var(--border-radius);
  box-shadow: 0 10px 20px rgba(0,0,0,0.5);
}

.headshot-placeholder {
  width: 100%;
  aspect-ratio: 2/3;
  background: rgba(255,255,255,0.05);
  border-radius: var(--border-radius);
}

.person-info {
  flex-grow: 1;
}

.name {
  font-size: 3rem;
  margin-bottom: 15px;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 1.1rem;
  color: var(--text-muted);
}

.profession {
  text-transform: capitalize;
  color: var(--primary-color);
  font-weight: 600;
}

.known-for-section h2 {
  font-size: 2rem;
  margin-bottom: 25px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding-bottom: 10px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
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

.loading-state, .empty-state {
  text-align: center;
  padding: 60px;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .person-header {
    flex-direction: column;
    text-align: center;
  }
}
</style>
