'use strict';

// Autodesk Forge configuration
module.exports = {
  // set environment variables or hard-code here
  credentials: {
    client_id: process.env.FORGE_CLIENT_ID,
    client_secret: process.env.FORGE_CLIENT_SECRET
  },

  // Required scopes for your application on server-side
  scopeInternal: ['bucket:create', 'bucket:read', 'data:read', 'data:create', 'data:write'],
  // Required scope of the token sent to the client
  scopePublic: ['viewables:read']
};