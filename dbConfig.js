var connectionString = process.env.DATABASE_URL || 'postgres://postgres:hotlap@localhost:32768/postgres';
module.exports = connectionString;