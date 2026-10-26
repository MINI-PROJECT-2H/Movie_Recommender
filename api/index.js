/**
 * CineMatch - Vercel Serverless Function Handler
 * 
 * Adapts the Express API proxy server for execution on Vercel's serverless edge.
 * Incoming requests to /api/* are routed here via vercel.json.
 */

'use strict';

const app = require('../server');

module.exports = app;
