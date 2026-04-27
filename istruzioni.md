# Guida Passo Passo: Sviluppo del Portale WatchFinder

Benvenuti in questa guida dedicata agli studenti di informatica. In questo tutorial, ricostruiremo **WatchFinder**, un'applicazione Single Page (SPA) in Vue.js. L'obiettivo dell'app è permettere agli utenti di cercare film o serie TV e scoprire su quali piattaforme di streaming (Netflix, Prime Video, ecc.) sono disponibili, utilizzando le API di **Watchmode**.

Seguite ogni passaggio per implementare le varie funzionalità, dal setup iniziale all'ottimizzazione delle chiamate API.

---

## Struttura del Progetto (Project Tree)
Prima di iniziare a scrivere il codice, diamo un'occhiata a come saranno organizzati i file all'interno della cartella del progetto:

```text
Watchmode/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── router/
│   │   └── index.js
│   ├── services/
│   │   └── watchmode.js
│   ├── views/
│   │   ├── Explore.vue
│   │   ├── Home.vue
│   │   ├── PersonDetail.vue
│   │   ├── TitleDetail.vue
│   │   └── Upcoming.vue
│   ├── App.vue
│   └── main.js
├── package.json
└── vue.config.js
```

---

## Passo 1: Configurazione del Servizio API

Il primo passo consiste nel creare un modulo centralizzato per comunicare con il backend di Watchmode. Useremo la libreria `axios` per effettuare le chiamate HTTP.

**File:** `src/services/watchmode.js`

```javascript
import axios from 'axios';
import { reactive } from 'vue';

// Definiamo le costanti principali
const API_KEY = 'LA TUA API KEY';
const BASE_URL = 'https://api.watchmode.com/v1';

// Creiamo un'istanza personalizzata di Axios
const watchmodeAPI = axios.create({
  baseURL: BASE_URL,
});

// STATO GLOBALE: Creiamo un oggetto reattivo per tracciare quante chiamate API ci restano.
// Watchmode impone un limite mensile (quota).
export const apiStatus = reactive({
  quota: 2500,
  quotaUsed: 0
});

// INTERCEPTOR DELLE RICHIESTE: Prima che ogni chiamata parta, 
// iniettiamo automaticamente l'API Key nei parametri dell'URL.
watchmodeAPI.interceptors.request.use((config) => {
  config.params = config.params || {};
  config.params.apiKey = API_KEY;
  return config;
});

// INTERCEPTOR DELLE RISPOSTE: Quando riceviamo una risposta dal server,
// leggiamo gli header HTTP nascosti per aggiornare la nostra quota API in tempo reale.
watchmodeAPI.interceptors.response.use((response) => {
  if (response.headers['x-account-quota-used']) {
    apiStatus.quota = parseInt(response.headers['x-account-quota']);
    apiStatus.quotaUsed = parseInt(response.headers['x-account-quota-used']);
  }
  return response;
});

// Esportiamo un oggetto con i metodi specifici per le nostre schermate
export default {
  // Ricerca rapida (Autocomplete)
  async autocompleteSearch(search_value) {
    const response = await watchmodeAPI.get('/autocomplete-search/', {
      params: { search_value, search_type: 1 }
    });
    return response.data;
  },

  // Dettagli di un film/serie TV per l'Italia (IT)
  async getTitleDetails(titleId, region = 'IT') {
    const response = await watchmodeAPI.get(`/title/${titleId}/details/`, {
      // Chiediamo di aggiungere alla risposta sia i link streaming (sources) sia il cast
      params: { append_to_response: 'sources,cast-crew', regions: region }
    });
    return response.data;
  },

  // ... altri metodi (listTitles, getUpcomingReleases, getPersonDetails)
};
```

---

## Passo 2: Barra di Ricerca con Debouncing (Autocomplete)

Nella barra di navigazione (`App.vue`) vogliamo inserire un campo di ricerca che suggerisca i titoli mentre l'utente digita. Per non esaurire la quota API ad ogni singola lettera digitata, useremo una tecnica chiamata **Debouncing**.

**File:** `src/App.vue`

```vue
<template>
  <nav class="navbar">
    <!-- Barra di ricerca connessa a searchQuery tramite v-model -->
    <input 
      type="text" 
      v-model="searchQuery" 
      @input="handleSearch"
      placeholder="Cerca un film o serie TV..." 
    />
    
    <!-- Mostra i risultati solo se ci sono -->
    <div class="search-results" v-if="searchResults.length > 0 && searchQuery">
      <div v-for="result in searchResults" :key="result.id" @click="goToDetail(result.id)">
        {{ result.name }} ({{ result.year }})
      </div>
    </div>
  </nav>
</template>

<script>
import watchmodeAPI from './services/watchmode';

export default {
  data() {
    return {
      searchQuery: '',
      searchResults: [],
      searchTimeout: null // Variabile per memorizzare il timer del debounce
    };
  },
  methods: {
    handleSearch() {
      // 1. CANCELLA IL TIMER PRECEDENTE
      // Se l'utente preme un tasto prima che il timer sia scaduto, azzeriamo l'attesa.
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
      
      if (!this.searchQuery) {
        this.searchResults = [];
        return;
      }

      // 2. CREA UN NUOVO TIMER
      // La chiamata API partirà SOLO se l'utente smette di digitare per 300ms.
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
      // Pulisce la barra di ricerca e naviga alla pagina dei dettagli
      this.searchQuery = '';
      this.searchResults = [];
      this.$router.push({ name: 'TitleDetail', params: { id } });
    }
  }
}
</script>
```

---

## Passo 3: La Home Page e l'estrazione Dati

Creiamo la pagina iniziale. Qui vogliamo mostrare le "Ultime Uscite". Dobbiamo mappare i dati ricevuti dall'API per adattarli alle nostre esigenze (es. estrarre solo l'anno da una data completa).

**File:** `src/views/Home.vue`

```vue
<script>
import watchmodeAPI from '../services/watchmode';

export default {
  data() {
    return { popularTitles: [] };
  },
  // Il Lifecycle Hook created() viene eseguito all'avvio del componente
  async created() {
    try {
      const res = await watchmodeAPI.getUpcomingReleases();
      const releases = res.releases || res || [];
      
      // Mappiamo i primi 12 risultati. 
      // Questa trasformazione adatta i dati grezzi del backend per la nostra Interfaccia (UI).
      this.popularTitles = releases.slice(0, 12).map(r => ({
        id: r.id,
        title: r.title,
        poster_url: r.poster_url,
        // Estraiamo l'anno dalla data "YYYY-MM-DD" usando split('-')
        year: r.source_release_date ? r.source_release_date.split('-')[0] : 'Novità'
      }));
    } catch (error) {
      console.error("Errore nel caricamento dei titoli", error);
    }
  }
}
</script>
```

---

## Passo 4: La Pagina dei Dettagli (Il Core dell'App)

Questa è la schermata più importante, dove spieghiamo in quale piattaforma vedere il film selezionato.

**File:** `src/views/TitleDetail.vue`

### A. Osservare i cambiamenti dell'URL
Dato che siamo in una Single Page Application (SPA), se un utente è nella pagina di "Batman" e cerca "Superman", l'URL cambierà, ma il componente è lo stesso. Dobbiamo "ascoltare" questo cambio.

```javascript
watch: {
  // Quando il parametro :id nell'URL cambia, invochiamo di nuovo il metodo fetchDetails
  '$route.params.id': 'fetchDetails'
},
methods: {
  async fetchDetails() {
    const id = this.$route.params.id; // Recupera l'ID del film dall'URL (es. /title/1234)
    if (!id) return;
    
    const res = await watchmodeAPI.getTitleDetails(id);
    this.title = res;
    // ... raggruppa le fonti e gestisci il trailer ...
  }
}
```

### B. Algoritmo di Filtraggio Piattaforme (Streaming, Noleggio, ecc.)
L'API ci restituisce un array mischiato con tutte le piattaforme. Spesso ci sono duplicati (es. "Netflix web" e "Netflix macOS"). Dobbiamo ripulire e organizzare i dati.

```javascript
groupSources(sources) {
  // 1. Inizializziamo le categorie
  this.groupedSources = { sub: [], rent: [], buy: [], free: [] };
  
  // 2. Rimuoviamo i duplicati usando una Map
  const uniqueSources = [];
  const map = new Map();
  for (const item of sources) {
      if(!map.has(item.name)){ // Se è la prima volta che incontriamo questa piattaforma
          map.set(item.name, true); // La registriamo
          uniqueSources.push(item); // E la teniamo
      }
  }

  // 3. Distribuiamo i dati puliti nei rispettivi array tramite il campo "type"
  uniqueSources.forEach(source => {
    if (source.type === 'sub') this.groupedSources.sub.push(source);         // Abbonamento (Netflix)
    else if (source.type === 'rent') this.groupedSources.rent.push(source);   // Noleggio (Chili)
    else if (source.type === 'buy') this.groupedSources.buy.push(source);     // Acquisto
    else if (source.type === 'free') this.groupedSources.free.push(source);   // Gratis con Pubblicità (Pluto TV)
  });
}
```

### C. Incorporare il Trailer YouTube
Se riceviamo un URL del tipo `https://www.youtube.com/watch?v=12345`, l'elemento `<iframe>` del browser lo bloccherà. Dobbiamo trasformarlo in un URL `embed`.

```javascript
computed: {
  youtubeEmbedUrl() {
    if (this.title && this.title.trailer && this.title.trailer.includes('watch?v=')) {
      // Sostituisce la stringa per creare il link da incorporamento
      return this.title.trailer.replace('watch?v=', 'embed/');
    }
    return null;
  }
}
```

---

## Passo 5: La Pagina Esplora e la gestione del Rate Limiting (Throttling)

Nella pagina **Esplora**, riceviamo una lista di ID di film, ma senza le loro locandine! L'unico modo per ottenere le locandine è chiamare l'API dei dettagli per **ogni singolo film**.
Se lo facciamo contemporaneamente per 20 film, l'API restituirà **Errore 429 - Too Many Requests** (Limite di chiamate superato). Dobbiamo usare il **Throttling**.

**File:** `src/views/Explore.vue`

```javascript
async applyFilters() {
  // ... ottiene l'elenco dei titoli (es. 20 risultati) ...
  this.titles = res.titles || [];

  // Usiamo un ciclo for-of perché permette di mettere "in pausa" il codice usando 'await'
  for (const title of this.titles) {
    try {
      // Recupera il dettaglio per estrarre la foto (poster)
      const detail = await watchmodeAPI.getTitleDetails(title.id);
      if (detail && detail.poster) {
        title.poster_url = detail.poster;
      }
      
      // IL TRUCCO (Throttling): Costringiamo il ciclo a fermarsi per 250 millisecondi 
      // prima di procedere al film successivo. Questo limita l'app a 4 richieste al secondo, 
      // rispettando le regole del server Watchmode.
      await new Promise(resolve => setTimeout(resolve, 250));
      
    } catch (e) {
      console.error("Impossibile caricare locandina", e);
    }
  }
}
```

---

## Conclusione del Progetto

Seguendo questi passaggi avrete implementato:
1. Una comunicazione API strutturata.
2. Tecniche avanzate di performance frontend come il **Debouncing** per le caselle di testo.
3. Manipolazione avanzata di Array e Map per il filtraggio e la deduplicazione dei dati in tempo reale.
4. Strategie di mitigazione del limite API come il **Throttling** basato su promesse.

**Esercizio per voi:** Nella pagina "Prossime Uscite" (`Upcoming.vue`), provate a implementare il formato di data Europeo completo sfruttando l'oggetto nativo `Date` di JavaScript: `new Date(data).toLocaleDateString('it-IT')`. Buon coding!
