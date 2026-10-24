/**
 * upload-audio.mjs
 * ─────────────────────────────────────────────────────────────────
 * Uploads all audio files from dist/audio/moods/ to Supabase Storage.
 * Run once: node upload-audio.mjs
 *
 * Requirements:
 *  1. A Supabase bucket named "audio" must exist with Public access enabled.
 *     Dashboard → Storage → New bucket → Name: "audio" → Public: ON
 *  2. Your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be in .env
 *
 * Usage:
 *   node upload-audio.mjs
 * ─────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load .env manually (no dotenv dependency needed)
const envFile = readFileSync(new URL('.env', import.meta.url), 'utf-8');
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('=').map(s => s.trim()))
);

const SUPABASE_URL = env['VITE_SUPABASE_URL'];
const SUPABASE_KEY = env['VITE_SUPABASE_ANON_KEY'];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = join(__dirname, 'dist', 'audio', 'moods');

const MIME = {
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

async function uploadAll() {
  console.log(`\n🎵  Uploading audio files to Supabase Storage...\n`);

  const moodFolders = readdirSync(AUDIO_DIR).filter(f =>
    statSync(join(AUDIO_DIR, f)).isDirectory()
  );

  let uploaded = 0;
  let failed = 0;

  for (const mood of moodFolders) {
    const moodPath = join(AUDIO_DIR, mood);
    const files = readdirSync(moodPath).filter(f => MIME[extname(f).toLowerCase()]);

    for (const file of files) {
      const filePath = join(moodPath, file);
      const storagePath = `moods/${mood}/${file}`;
      const contentType = MIME[extname(file).toLowerCase()];
      const fileBuffer = readFileSync(filePath);

      process.stdout.write(`  Uploading ${storagePath} (${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB)... `);

      const { error } = await supabase.storage
        .from('audio')
        .upload(storagePath, fileBuffer, {
          contentType,
          upsert: true,          // overwrite if already exists
          cacheControl: '31536000', // 1 year cache
        });

      if (error) {
        console.log(`❌  ${error.message}`);
        failed++;
      } else {
        console.log(`✅`);
        uploaded++;
      }
    }
  }

  console.log(`\n✨  Done: ${uploaded} uploaded, ${failed} failed.\n`);

  if (uploaded > 0) {
    console.log(`📋  Your public base URL:\n    ${SUPABASE_URL}/storage/v1/object/public/audio/\n`);
  }
}

uploadAll().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
