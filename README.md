# 📔 Daily Thoughts Diary

Un'applicazione full-stack moderna per gestire il tuo diario personale con funzionalità avanzate di analisi NLP, intelligenza artificiale per i tag, analisi del sentiment e statistiche dettagliate.

---

## 🎯 Obiettivo del Progetto

**Daily Thoughts Diary** nasce per offrire uno spazio personale e sicuro dove annotare pensieri, emozioni e momenti importanti della vita quotidiana. L'applicazione va oltre il semplice diario tradizionale, integrando tecnologie di **Natural Language Processing** per aiutarti a:

- 📝 Scrivere e organizzare pensieri in modo strutturato
- 🧠 Comprendere meglio le tue emozioni attraverso l'analisi del sentiment
- 🏷️ Categorizzare automaticamente i tuoi pensieri con tag intelligenti
- 📊 Visualizzare tendenze e pattern nel tempo
- 🔍 Ricercare facilmente tra le tue entry
- 🔒 Mantenere la privacy con autenticazione sicura

Ideale per chiunque voglia tenere traccia della propria crescita personale, gestire le emozioni o semplicemente avere un diario digitale intelligente.

---

## ✨ Funzionalità Principali

### Per l'Utente

#### 📖 Scrittura e Gestione Entry
- ✍️ **Rich Text Editor** con formattazione avanzata (bold, italic, liste, code blocks)
- 😊 **Mood Tracking**: Seleziona il tuo stato d'animo per ogni entry
- 📎 **Allegati Multimediali**: Carica immagini, audio, video e documenti
- 🗓️ **Calendario Interattivo**: Visualizza le tue entry nel tempo
- 🔍 **Ricerca Avanzata**: Filtra per data, mood, tag o contenuto

#### 🤖 Intelligenza Artificiale e NLP
- 🏷️ **Tag Automatici**: L'AI suggerisce tag rilevanti basati sul contenuto
- 💭 **Analisi del Sentiment**: Scopri se i tuoi pensieri sono positivi, negativi o neutri
- 🌐 **Rilevamento Automatico Lingua**: Supporto multilingua (EN, IT, ES, FR, DE)
- 👤 **Estrazione Entità**: Identifica persone, luoghi e organizzazioni menzionate
- 🔑 **Keyword Extraction**: Parole chiave estratte automaticamente

#### 📊 Statistiche e Insights
- 📈 **Dashboard Analitica**: Visualizza trend del tuo umore nel tempo
- 📅 **Grafici Interattivi**: Chart.js e Recharts per visualizzazioni accattivanti
- 📉 **Report Mensili**: Riepiloghi automatici delle tue entry
- 🎯 **Pattern Recognition**: Identifica abitudini e pattern ricorrenti

#### 🔐 Sicurezza e Privacy
- 🔑 **Autenticazione JWT** con refresh tokens
- 🔒 **Password Criptate** con bcrypt
- 👤 **Profilo Personale** con avatar customizzabile
- ⚙️ **Impostazioni Privacy**: Controllo completo sui tuoi dati

---

## 🛠️ Stack Tecnologico

### Frontend
| Tecnologia | Versione | Scopo |
|------------|----------|-------|
| **React** | 18.x | Framework UI |
| **TypeScript** | 5.x | Type safety |
| **Vite** | 5.x | Build tool veloce |
| **Tailwind CSS** | 3.x | Styling moderno |
| **Zustand** | 4.x | State management |
| **React Query** | 5.x | Data fetching & caching |
| **React Router** | 6.x | Routing |
| **Chart.js** | 4.x | Grafici e visualizzazioni |
| **Recharts** | 2.x | Grafici avanzati |
| **Framer Motion** | 11.x | Animazioni |
| **React Hook Form** | 7.x | Form management |
| **React Hot Toast** | 2.x | Notifiche |

### Backend
| Tecnologia | Versione | Scopo |
|------------|----------|-------|
| **Node.js** | 22.x | Runtime JavaScript |
| **Express** | 4.x | Web framework |
| **TypeScript** | 5.x | Type safety |
| **Prisma** | 6.x | ORM per database |
| **PostgreSQL** | 15.x | Database relazionale |
| **JWT** | 9.x | Autenticazione |
| **bcryptjs** | 2.x | Hashing password |

### NLP e AI
| Libreria | Scopo |
|----------|-------|
| **compromise** | NLP processing avanzato |
| **sentiment** | Analisi del sentiment |
| **franc** | Rilevamento lingua automatico |
| **stopword** | Rimozione stopwords |

### Utility e DevOps
| Tool | Scopo |
|------|-------|
| **Docker** | Containerizzazione |
| **Winston** | Logging strutturato |
| **Sharp** | Elaborazione immagini |
| **Multer** | Upload file |
| **Helmet** | Security headers |
| **Express Rate Limit** | Rate limiting |
| **node-cron** | Scheduled tasks |

---

## 📋 Prerequisiti

Prima di installare l'applicazione, assicurati di avere:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (incluso con Node.js)
- **PostgreSQL** >= 15 oppure **Docker** (raccomandato)
- **Git** per clonare il repository

---

## 🚀 Installazione

### Passo 1: Clona il Repository

```bash
git clone <repository-url>
cd daily-thoughts-diary
```

### Passo 2: Installa le Dipendenze

```bash
# Installa dipendenze per root, backend e frontend
npm install

# Le dipendenze verranno installate in:
# - /node_modules (root - per concurrently)
# - /backend/node_modules (backend)
# - /frontend/node_modules (frontend)
```

### Passo 3: Configura le Variabili d'Ambiente

#### Backend (.env)

```bash
cd backend
cp .env.example .env
```

Modifica `backend/.env` con i tuoi valori:

```env
# Database
DATABASE_URL="postgresql://diary_user:TUA_PASSWORD_SICURA@localhost:5432/daily_thoughts"

# JWT Secrets - GENERA VALORI SICURI!
JWT_SECRET="genera_con: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
JWT_REFRESH_SECRET="genera_con: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
JWT_EXPIRES_IN="7d"

# Session
SESSION_SECRET="genera_con: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""

# Server
PORT=5000
NODE_ENV=development

# SMTP (opzionale - per reset password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tua-email@gmail.com
SMTP_PASS=tua-app-password
SMTP_FROM="Daily Thoughts <noreply@dailythoughts.com>"

# Frontend URL
FRONTEND_URL=http://localhost:5173

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

#### Frontend (.env)

```bash
cd frontend
cp .env.example .env
```

Il file `frontend/.env` dovrebbe contenere:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME="Daily Thoughts Diary"
VITE_APP_VERSION=1.0.0
```

### Passo 4: Setup Database

#### Opzione A: Usa Docker (Raccomandato)

```bash
# Avvia PostgreSQL in Docker
docker run -d \
  --name daily-thoughts-db \
  -e POSTGRES_USER=diary_user \
  -e POSTGRES_PASSWORD=TUA_PASSWORD \
  -e POSTGRES_DB=daily_thoughts \
  -p 5432:5432 \
  -v postgres-data:/var/lib/postgresql/data \
  postgres:15-alpine
```

Oppure usa docker-compose:

```bash
docker-compose up -d postgres
```

#### Opzione B: PostgreSQL Locale

Installa PostgreSQL e crea il database:

```sql
CREATE DATABASE daily_thoughts;
CREATE USER diary_user WITH PASSWORD 'TUA_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE daily_thoughts TO diary_user;
```

### Passo 5: Esegui le Migrazioni Database

```bash
cd backend
npm run prisma:migrate
```

Questo comando:
- Crea tutte le tabelle nel database
- Applica le migrazioni Prisma
- Genera il Prisma Client

### Passo 6: (Opzionale) Popola il Database

```bash
cd backend
npm run prisma:seed
```

Crea dati di esempio per testare l'applicazione.

### Passo 7: Avvia l'Applicazione

#### Modalità Development (Frontend + Backend insieme)

```bash
# Dalla root del progetto
npm run dev
```

Questo avvia:
- **Backend** su `http://localhost:5000`
- **Frontend** su `http://localhost:5173`

#### Avvio Separato

```bash
# Backend
cd backend
npm run dev

# Frontend (in un altro terminale)
cd frontend
npm run dev
```

### Passo 8: Apri l'Applicazione

Apri il browser su:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)

🎉 **L'applicazione è pronta!** Crea un account e inizia a scrivere il tuo diario.

---

## ⚡ Avvio Rapido

```bash
# 1. Clona e installa
git clone <repository-url> && cd daily-thoughts-diary
npm install

# 2. Setup environment
cd backend && cp .env.example .env && cd ../frontend && cp .env.example .env && cd ..

# 3. Avvia PostgreSQL con Docker
docker run -d --name daily-thoughts-db \
  -e POSTGRES_USER=diary_user -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_DB=daily_thoughts -p 5432:5432 \
  postgres:15-alpine

# 4. Migrazioni
cd backend && npm run prisma:migrate && cd ..

# 5. Avvia tutto
npm run dev
```

Apri [http://localhost:5173](http://localhost:5173) e registrati!

---

## 📚 Documentazione Aggiuntiva

Per informazioni dettagliate, consulta:

- 📘 [**AVVIO_RAPIDO.md**](./AVVIO_RAPIDO.md) - Guida veloce per l'avvio
- 📗 [**API_DOCUMENTATION.md**](./API_DOCUMENTATION.md) - Documentazione completa delle API
- 📙 [**NLP_SYSTEM.md**](./NLP_SYSTEM.md) - Dettagli sul sistema NLP

---

## 🔧 Comandi Utili

### Development

```bash
npm run dev              # Avvia frontend + backend
npm run build           # Build per produzione
npm run lint            # Esegui linter
npm run format          # Formatta codice
```

### Database

```bash
cd backend
npm run prisma:studio   # Apri Prisma Studio (UI per il database)
npm run prisma:migrate  # Esegui migrazioni
npm run prisma:generate # Rigenera Prisma Client
npm run prisma:seed     # Popola database con dati di test
npm run prisma:reset    # Reset completo database
```

### Backup e Restore

```bash
cd backend
npm run backup          # Crea backup del database
npm run restore         # Ripristina backup
```

---

## 🐛 Troubleshooting

### Problema: Porta già in uso

**Errore**: `Error: listen EADDRINUSE: address already in use :::5000`

**Soluzione**:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Problema: Database connection refused

**Errore**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Soluzione**:
1. Verifica che PostgreSQL sia in esecuzione:
   ```bash
   docker ps  # Se usi Docker
   pg_isready -h localhost -p 5432  # Se usi PostgreSQL locale
   ```
2. Controlla `DATABASE_URL` in `backend/.env`
3. Prova a riavviare il container Docker:
   ```bash
   docker restart daily-thoughts-db
   ```

### Problema: Prisma Client non trovato

**Errore**: `Error: @prisma/client did not initialize yet`

**Soluzione**:
```bash
cd backend
npm run prisma:generate
```

### Problema: Frontend pagina bianca

**Soluzione**:
1. Pulisci la cache del browser (Ctrl+Shift+Delete)
2. Riavvia Vite:
   ```bash
   cd frontend
   rm -rf node_modules/.vite
   npm run dev
   ```
3. Controlla la console del browser (F12) per errori

### Problema: Token non valido / redirect al login

**Soluzione**:
1. Apri DevTools (F12) → Application → Local Storage
2. Elimina "auth-storage"
3. Ricarica la pagina
4. Fai nuovamente login

---

## 🚀 Deployment

### Docker Compose (Produzione)

```bash
# Build e avvia tutti i servizi
docker-compose up -d

# L'app sarà disponibile su http://localhost
```

### Build Manuale

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build

# Avvia in produzione
cd backend
npm start
```

---

## 🤝 Contributing

Contributi, issues e feature requests sono benvenuti!

1. Fork il progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit le tue modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

---

## 📝 Licenza

Questo progetto è distribuito sotto licenza **MIT**. Vedi il file `LICENSE` per maggiori informazioni.

---

## 🙏 Riconoscimenti

Grazie alle seguenti librerie e progetti open-source che hanno reso possibile questa applicazione:

- [React](https://reactjs.org/)
- [Prisma](https://www.prisma.io/)
- [compromise](https://github.com/spencermountain/compromise)
- [Tailwind CSS](https://tailwindcss.com/)
- E molte altre (vedi package.json)

---

## 📧 Contatti

Per domande o supporto, apri una issue su GitHub.

---

**Buon diario! 📔✨**
