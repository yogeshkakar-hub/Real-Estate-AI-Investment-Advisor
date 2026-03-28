const knex = require('knex');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'advisor.db');

const db = knex({
  client: 'sqlite3',
  connection: { filename: DB_PATH },
  useNullAsDefault: true,
  pool: {
    afterCreate: (conn, cb) => {
      conn.run('PRAGMA foreign_keys = ON', cb);
      conn.run('PRAGMA journal_mode = WAL');
    }
  }
});

async function initDB() {
  // Users
  const hasUsers = await db.schema.hasTable('users');
  if (!hasUsers) {
    await db.schema.createTable('users', (t) => {
      t.increments('id').primary();
      t.string('name').notNullable();
      t.string('email').unique().notNullable();
      t.string('password').notNullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // Sessions
  const hasSessions = await db.schema.hasTable('sessions');
  if (!hasSessions) {
    await db.schema.createTable('sessions', (t) => {
      t.increments('id').primary();
      t.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      t.string('title').defaultTo('New Conversation');
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.timestamp('updated_at').defaultTo(db.fn.now());
    });
  }

  // Messages
  const hasMessages = await db.schema.hasTable('messages');
  if (!hasMessages) {
    await db.schema.createTable('messages', (t) => {
      t.increments('id').primary();
      t.integer('session_id').references('id').inTable('sessions').onDelete('CASCADE');
      t.enu('role', ['user', 'model']).notNullable();
      t.text('content').notNullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // Recommendations
  const hasRecs = await db.schema.hasTable('recommendations');
  if (!hasRecs) {
    await db.schema.createTable('recommendations', (t) => {
      t.increments('id').primary();
      t.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      t.text('input_json').notNullable();
      t.text('report').notNullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  console.log('✅ SQLite database initialized at:', DB_PATH);
}

module.exports = { db, initDB };
