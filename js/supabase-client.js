/**
 * supabase-client.js
 * Initializes the Supabase client and exposes it as window.SupabaseClient.
 *
 * SETUP: Replace the placeholder values below with your actual project credentials.
 * Find them in your Supabase dashboard under Settings > API.
 */

// eslint-disable-next-line no-unused-vars
var SUPABASE_URL = 'YOUR_SUPABASE_URL';
var SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// The Supabase JS SDK v2 is loaded via CDN and exposes `supabase` as a global.
// In demo mode (credentials not yet set), SupabaseClient is a no-op stub.
if (typeof supabase !== 'undefined' && !SUPABASE_URL.includes('YOUR_SUPABASE_URL')) {
  const { createClient } = supabase;
  window.SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  // ── DEMO MODE ──────────────────────────────────────────────────────────────
  // Test credentials: test@test.com / test
  // Session is kept in sessionStorage; uploaded photos are stored in localStorage.
  // ---------------------------------------------------------------------------

  const DEMO_EMAIL    = 'test@test.com';
  const DEMO_PASSWORD = 'test';
  const SESSION_KEY   = 'demo_session';
  const PHOTOS_KEY    = 'demo_photos';

  function getDemoSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
  }

  // Helpers used by upload.js and gallery.js via window.DemoStore
  window.DemoStore = {
    getPhotos(gallery) {
      try {
        const all = JSON.parse(localStorage.getItem(PHOTOS_KEY) || '[]');
        return gallery ? all.filter(p => p.gallery === gallery) : all;
      } catch { return []; }
    },
    addPhoto(photo) {
      const all = this.getPhotos();
      all.push(photo);
      localStorage.setItem(PHOTOS_KEY, JSON.stringify(all));
    },
    deletePhoto(id) {
      const all = this.getPhotos().filter(p => p.id !== id);
      localStorage.setItem(PHOTOS_KEY, JSON.stringify(all));
    }
  };

  window.SupabaseClient = {
    auth: {
      getSession: async () => {
        const session = getDemoSession();
        return { data: { session } };
      },
      signInWithPassword: async ({ email, password }) => {
        if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
          const session = { user: { email }, demo: true };
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
          return { data: { session }, error: null };
        }
        return { data: null, error: { message: 'Invalid credentials. Use test@test.com / test' } };
      },
      signOut: async () => {
        sessionStorage.removeItem(SESSION_KEY);
      }
    },
    // These are no-ops in demo mode; upload.js detects demo mode and uses DemoStore directly
    from: () => ({
      select: () => ({ eq: () => ({ order: () => ({ range: async () => ({ data: [], error: null }) }) }) }),
      insert: async () => ({ data: null, error: null }),
      update: () => ({ eq: async () => ({ data: null, error: null }) }),
      delete: () => ({ eq: async () => ({ data: null, error: null }) })
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: async () => ({ data: null, error: null })
      })
    }
  };
}
