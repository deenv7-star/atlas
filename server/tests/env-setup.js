/**
 * Preload for `node --import` so server/config/env.js parses in CI without a real .env.
 */
process.env.DATABASE_URL ??= 'postgresql://mock:mock@127.0.0.1:5432/mock';
process.env.JWT_SECRET ??= 'test_jwt_secret_minimum_32_chars_long!!';
