import { createApp } from '../server/dist/app.js';

// ESM entry so Vercel does not compile this file to CJS and require() the ESM server build.
export default createApp();
