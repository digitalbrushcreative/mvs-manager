const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'db', 'mvs.sqlite');
const SCHEMA_PATH = path.join(__dirname, '..', 'db', 'schema.sql');

// Ensure the parent directory exists — on Railway the DB lives under a mounted
// volume (e.g. /data/mvs.sqlite), and better-sqlite3 will not create the dir.
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));

module.exports = db;
