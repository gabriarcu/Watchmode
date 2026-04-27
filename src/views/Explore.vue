<template>
  <div class="explore container">
    <div class="explore-layout">
      <!-- Sidebar Filtri -->
      <aside class="filters-sidebar glass-panel">
        <h3>Filtri</h3>
        
        <div class="filter-group">
          <label>Tipo</label>
          <select v-model="filters.types" @change="applyFilters">
            <option value="">Tutti</option>
            <option value="movie">Film</option>
            <option value="tv_series">Serie TV</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Genere</label>
          <select v-model="filters.genres" @change="applyFilters">
            <option value="">Tutti i Generi</option>
            <!-- ID standard Watchmode -->
            <option value="1">Action</option>
            <option value="39">Animation</option>
            <option value="2">Adventure</option>
            <option value="4">Comedy</option>
            <option value="7">Drama</option>
            <option value="10">Fantasy</option>
            <option value="11">Horror</option>
            <option value="14">Romance</option>
            <option value="17">Thriller</option>
            <option value="15">Sci-Fi</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Anno (Minimo)</label>
          <input type="number" v-model="filters.release_date_start" @change="applyFilters" placeholder="es. 2018" />
        </div>

        <div class="filter-group">
          <label>Voto Minimo (0-100)</label>
          <input type="number" v-model="filters.user_rating_low" @change="applyFilters" placeholder="es. 70" />
        </div>

        <button class="btn btn-reset" @click="resetFilters">Resetta Filtri</button>
      </aside>

      <!-- Griglia Risultati -->
      <main class="results-area">
        <div class="results-header">
          <h2>Esplora</h2>
          <span>{{ titles.length }} risultati</span>
        </div>

        <div class="loading-state" v-if="isLoading">
          Ricerca in corso...
        </div>

        <div class="grid" v-else-if="titles.length > 0">
          <div 
            class="poster-card" 
            v-for="title in titles" 
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

        <div class="empty-state" v-else>
          Nessun titolo trovato con questi filtri.
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import watchmodeAPI from '../services/watchmode';

export default {
  name: 'ExploreView',
  data() {
    return {
      isLoading: false,
      titles: [],
      filters: {
        types: '',
        genres: '',
        release_date_start: '',
        user_rating_low: '',
        sort_by: 'popularity_desc',
        limit: 20
      }
    };
  },
  created() {
    this.applyFilters();
  },
  methods: {
    async applyFilters() {
      this.isLoading = true;
      try {
        const queryParams = { ...this.filters };
        // Pulizia parametri vuoti
        Object.keys(queryParams).forEach(key => {
          if (!queryParams[key]) delete queryParams[key];
        });

        const res = await watchmodeAPI.listTitles(queryParams);
        this.titles = res.titles || [];

        // L'API list-titles di Watchmode non restituisce le locandine di default.
        // Effettuiamo un fetch sequenziale per ogni titolo con un piccolo ritardo per non superare 
        // i limiti di frequenza (Rate Limit - Error 429) dell'API.
        for (const title of this.titles) {
          try {
            const detail = await watchmodeAPI.getTitleDetails(title.id);
            if (detail && detail.poster) {
              title.poster_url = detail.poster;
            }
            // Delay di 250ms tra una chiamata e l'altra (max 4 richieste al secondo)
            await new Promise(resolve => setTimeout(resolve, 250));
          } catch (e) {
            console.error("Impossibile caricare locandina per", title.id);
          }
        }

      } catch (error) {
        console.error("Errore durante il fetching dei titoli:", error);
      } finally {
        this.isLoading = false;
      }
    },
    resetFilters() {
      this.filters = {
        types: '',
        genres: '',
        release_date_start: '',
        user_rating_low: '',
        sort_by: 'popularity_desc',
        limit: 20
      };
      this.applyFilters();
    },
    goToDetail(id) {
      this.$router.push({ name: 'TitleDetail', params: { id } });
    }
  }
}
</script>

<style scoped>
.explore {
  padding-top: 40px;
  padding-bottom: 60px;
}

.explore-layout {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

.filters-sidebar {
  width: 280px;
  padding: 25px;
  flex-shrink: 0;
  position: sticky;
  top: 100px;
}

.filters-sidebar h3 {
  margin-bottom: 20px;
  font-size: 1.2rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding-bottom: 10px;
}

.filter-group {
  margin-bottom: 20px;
}

.filter-group label {
  display: block;
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.filter-group select,
.filter-group input {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  outline: none;
}

.filter-group select:focus,
.filter-group input:focus {
  border-color: var(--primary-color);
}

.btn-reset {
  width: 100%;
  background: transparent;
  border: 1px solid var(--text-muted);
  color: var(--text-muted);
}

.btn-reset:hover {
  background: rgba(255,255,255,0.1);
  color: white;
}

.results-area {
  flex-grow: 1;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.results-header span {
  color: var(--text-muted);
  font-size: 0.9rem;
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
  background: var(--surface-glass);
  border-radius: var(--border-radius);
}

@media (max-width: 768px) {
  .explore-layout {
    flex-direction: column;
  }
  .filters-sidebar {
    width: 100%;
    position: static;
  }
}
</style>
