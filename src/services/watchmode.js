import axios from 'axios';
import { reactive } from 'vue';

const API_KEY = 'LA TUA KEY';
const BASE_URL = 'https://api.watchmode.com/v1';

const watchmodeAPI = axios.create({
  baseURL: BASE_URL,
});

export const apiStatus = reactive({
  quota: 2500,
  quotaUsed: 0
});

// Interceptor per aggiungere sempre l'API key ai parametri di richiesta
watchmodeAPI.interceptors.request.use((config) => {
  config.params = config.params || {};
  config.params.apiKey = API_KEY;
  return config;
});

// Interceptor per estrarre la quota aggiornata da ogni risposta
watchmodeAPI.interceptors.response.use((response) => {
  if (response.headers['x-account-quota-used']) {
    apiStatus.quota = parseInt(response.headers['x-account-quota']);
    apiStatus.quotaUsed = parseInt(response.headers['x-account-quota-used']);
  }
  return response;
});

export default {
  /**
   * Cerca titoli tramite autocomplete (restituisce risultati rapidi mentre si digita)
   */
  async autocompleteSearch(search_value) {
    const response = await watchmodeAPI.get('/autocomplete-search/', {
      params: { search_value, search_type: 1 }
    });
    return response.data;
  },

  /**
   * Ottiene i dettagli completi del titolo, inclusi cast, crew e le fonti (streaming) in base alla nazione (es. IT)
   */
  async getTitleDetails(titleId, region = 'IT') {
    const response = await watchmodeAPI.get(`/title/${titleId}/details/`, {
      params: {
        append_to_response: 'sources,cast-crew',
        regions: region
      }
    });
    return response.data;
  },

  /**
   * Ricerca avanzata incrociando i filtri (generi, piattaforme, anni, voti, ecc.)
   */
  async listTitles(filters = {}, region = 'IT') {
    const response = await watchmodeAPI.get('/list-titles/', {
      params: {
        ...filters,
        regions: region
      }
    });
    return response.data;
  },

  /**
   * Ottiene le prossime uscite in streaming o cinema
   */
  async getUpcomingReleases(region = 'IT') {
    const response = await watchmodeAPI.get('/releases/', {
      params: {
        regions: region
      }
    });
    return response.data;
  },

  /**
   * Ottiene i dettagli di una persona (attore/regista), bio e filmografia
   */
  async getPersonDetails(personId) {
    const response = await watchmodeAPI.get(`/person/${personId}/details/`);
    return response.data;
  },

  /**
   * Ottiene lo status manuale (chiamata esplicita all'endpoint status)
   */
  async getStatus() {
    const response = await watchmodeAPI.get('/status/');
    if (response.data) {
      apiStatus.quota = response.data.quota;
      apiStatus.quotaUsed = response.data.quotaUsed;
    }
    return response.data;
  }
};
