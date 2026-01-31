Local / Atlas MongoDB connection guide

Steps to get the backend connected to MongoDB:

1) Install dependencies
   cd backend
   npm install

2) Make a .env by copying `.env.example` and adjusting values
   cp .env.example .env
   # on Windows (PowerShell): copy .env.example .env

3) Run a local MongoDB (choose one):
   - Docker (recommended for dev):
     docker run -d --name mongo -p 27017:27017 -e MONGO_INITDB_DATABASE=senthil_electricals mongo:6.0

   - Local install: follow https://www.mongodb.com/docs/manual/installation/

4) Or use MongoDB Atlas (cloud):
   - Create a free cluster at https://www.mongodb.com/cloud/atlas
   - Configure Network Access (allow your IP) or 0.0.0.0/0 for quick testing
   - Create a database user and copy the connection string
   - Paste into your `.env` as MONGO_URI

5) Run backend in dev mode (nodemon):
   npm run dev

6) Verify connection and health endpoint
   - Open http://localhost:5000/health -> returns { ok: true, state: 1 } when connected

Notes
- The backend now reads MONGO_URI from env and retries connection on failure.
- Use secure credentials for production and don't commit .env files to version control.
