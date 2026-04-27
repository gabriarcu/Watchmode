# 🍿 Watchmode - Cinema Discovery Portal

Un'applicazione Single Page (SPA) moderna e reattiva sviluppata in **Vue.js** per esplorare film, serie TV, attori e prossime uscite al cinema e in streaming, alimentata dalle API di [Watchmode](https://api.watchmode.com/).

## ✨ Funzionalità Principali

*   **Esplorazione Avanzata**: Ricerca di film e serie TV con filtri avanzati per genere, anno di uscita e valutazione degli utenti.
*   **Dettagli Completi**: Pagine di dettaglio per ogni titolo con locandine, trame, streaming provider disponibili in Italia, cast e troupe.
*   **Profili Attori/Registi**: Pagine dedicate per le personalità del cinema con biografia e filmografia completa.
*   **Prossime Uscite**: Sezione per scoprire quali titoli arriveranno presto al cinema o sulle piattaforme di streaming.
*   **Ricerca Intelligente**: Barra di ricerca globale con autocompletamento in tempo reale.
*   **Monitoraggio API**: Indicatore in tempo reale nella barra di navigazione che mostra la quota API rimanente per evitare blocchi.
*   **Design Premium**: Interfaccia utente scura con effetti *glassmorphism*, animazioni fluide e design completamente responsive per dispositivi mobili.

## 🛠 Stack Tecnologico

*   **Framework**: [Vue.js](https://vuejs.org/) (Vue 3 / Vue CLI)
*   **Routing**: [Vue Router](https://router.vuejs.org/)
*   **HTTP Client**: [Axios](https://axios-http.com/) per le richieste API
*   **Stile**: Vanilla CSS con variabili custom (CSS Tokens) per un design system coerente.

## 🚀 Setup del Progetto

### Prerequisiti
Assicurati di avere [Node.js](https://nodejs.org/) installato sul tuo sistema.

### Installazione Dipendenze
```bash
npm install
```

### Avvio Server di Sviluppo (Hot-Reload)
Avvia l'applicazione in ambiente di sviluppo (normalmente su `http://localhost:8080`):
```bash
npm run serve
```

### Compilazione e Minificazione per la Produzione
Crea una build ottimizzata pronta per il deployment nella cartella `dist`:
```bash
npm run build
```

### Linter
Esegui il linter per correggere errori di stile nel codice:
```bash
npm run lint
```

## 🔑 Configurazione API

Il progetto utilizza l'API di Watchmode. La chiave API è attualmente configurata in `src/services/watchmode.js`. 
*Nota: Se superi i limiti della quota gratuita (es. Errore 429 o 504), l'app gestisce automaticamente il throttling applicando ritardi strategici per il fetch multiplo delle locandine.*

## 📂 Struttura del Progetto

*   `src/components/` - Componenti UI riutilizzabili (Navbar, Search, Loader, ecc.)
*   `src/views/` - Le pagine principali dell'applicazione (Home, Explore, TitleDetail, PersonDetail, Upcoming)
*   `src/services/` - Logica di interfacciamento con l'API (configurazione Axios e chiamate endpoint)
*   `src/router/` - Configurazione delle rotte di Vue Router
*   `src/assets/` - Fogli di stile globali (es. `style.css`) e risorse statiche

## 📜 Note Educative
Questo progetto include anche un file `istruzioni.md` (in fase di redazione) studiato per spiegare le logiche architetturali e di codice dell'applicazione a scopo didattico.
