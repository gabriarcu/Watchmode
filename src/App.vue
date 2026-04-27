<template>
  <div id="app">
    <nav class="navbar glass-panel">
      <div class="container nav-container">
        <router-link to="/" class="logo">
          <h1>Watch<span>Finder</span></h1>
        </router-link>
        <div class="search-container">
          <input 
            type="text" 
            v-model="searchQuery" 
            @input="handleSearch"
            placeholder="Cerca un film o serie TV..." 
            class="search-bar"
          />
          <div class="search-results glass-panel" v-if="searchResults.length > 0 && searchQuery">
            <div 
              v-for="result in searchResults" 
              :key="result.id" 
              class="search-item"
              @click="goToDetail(result.id)"
            >
              <img :src="result.image_url" alt="poster" v-if="result.image_url"/>
              <div class="search-info">
                <h4>{{ result.name }}</h4>
                <p>{{ result.year }} • {{ result.type }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="nav-links">
          <router-link to="/explore">Esplora</router-link>
          <router-link to="/upcoming">Prossime Uscite</router-link>
          <div class="api-status" :class="{ 'warning': percentage > 80, 'danger': percentage > 95 }">
            <span class="status-dot"></span> API: {{ apiStatus.quotaUsed }} / {{ apiStatus.quota }}
          </div>
        </div>
      </div>
    </nav>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script>
import watchmodeAPI, { apiStatus } from './services/watchmode';

export default {
  name: 'App',
  data() {
    return {
      searchQuery: '',
      searchResults: [],
      searchTimeout: null,
      apiStatus
    };
  },
  computed: {
    percentage() {
      if (this.apiStatus.quota === 0) return 0;
      return (this.apiStatus.quotaUsed / this.apiStatus.quota) * 100;
    }
  },
  async created() {
    // Inizializza lo stato all'avvio
    await watchmodeAPI.getStatus();
  },
  methods: {
    handleSearch() {
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
      
      if (!this.searchQuery) {
        this.searchResults = [];
        return;
      }

      this.searchTimeout = setTimeout(async () => {
        try {
          const res = await watchmodeAPI.autocompleteSearch(this.searchQuery);
          this.searchResults = res.results || [];
        } catch (error) {
          console.error("Errore ricerca", error);
        }
      }, 300);
    },
    goToDetail(id) {
      this.searchQuery = '';
      this.searchResults = [];
      this.$router.push({ name: 'TitleDetail', params: { id } });
    }
  }
}
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 1rem 0;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: none;
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.logo h1 {
  font-size: 1.5rem;
  color: var(--text-main);
}

.logo h1 span {
  color: var(--primary-color);
}

.search-container {
  flex-grow: 1;
  max-width: 500px;
  position: relative;
}

.search-bar {
  width: 100%;
  padding: 0.8rem 1.2rem;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(0,0,0,0.2);
  color: white;
  outline: none;
  transition: var(--transition);
}

.search-bar:focus {
  border-color: var(--primary-color);
  background: rgba(0,0,0,0.4);
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
  border-radius: var(--border-radius);
  display: flex;
  flex-direction: column;
}

.search-item {
  display: flex;
  padding: 10px;
  gap: 15px;
  cursor: pointer;
  transition: background 0.2s;
}

.search-item:hover {
  background: rgba(255,255,255,0.1);
}

.search-item img {
  width: 40px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.search-info h4 {
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.search-info p {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-links a {
  font-weight: 600;
  transition: var(--transition);
}

.nav-links a:hover, .nav-links a.router-link-active {
  color: var(--primary-color);
}

.api-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-family: monospace;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
  color: var(--text-muted);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #10b981; /* Verde */
  box-shadow: 0 0 8px #10b981;
}

.api-status.warning .status-dot {
  background-color: #f59e0b; /* Giallo */
  box-shadow: 0 0 8px #f59e0b;
}

.api-status.danger .status-dot {
  background-color: #ef4444; /* Rosso */
  box-shadow: 0 0 8px #ef4444;
}

main {
  min-height: calc(100vh - 70px);
}
</style>
