const SUPABASE_URL = "https://lgpqawgnkpwpblpkxbbd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxncHFhd2dua3B3cGJscGt4YmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMzgxNTUsImV4cCI6MjA4NjkxNDE1NX0.LbHZGWCOvlNFc6dvo_l5jOizdEVXuGZJFbFCpuG6zKU";

let SUPABASE_CLIENT = null;

if (window.supabase && window.supabase.createClient && SUPABASE_URL && SUPABASE_ANON_KEY) {
  SUPABASE_CLIENT = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const auth = {
  async signUp(email, password, fullName) {
    if (!SUPABASE_CLIENT) throw new Error("Supabase not configured");
    const { data, error } = await SUPABASE_CLIENT.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    if (error) throw error;
    return data;
  },

  async signIn(email, password) {
    if (!SUPABASE_CLIENT) throw new Error("Supabase not configured");
    const { data, error } = await SUPABASE_CLIENT.auth.signInWithPassword({ email, password });
    if (error) throw error;
    localStorage.setItem('currentUser', JSON.stringify({
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.user_metadata?.full_name
    }));
    return data;
  },

  async signOut() {
    if (!SUPABASE_CLIENT) throw new Error("Supabase not configured");
    const { error } = await SUPABASE_CLIENT.auth.signOut();
    localStorage.removeItem('currentUser');
    if (error) throw error;
  },

  getCurrentUser() {
    if (!SUPABASE_CLIENT) return null;
    return SUPABASE_CLIENT.auth.getUser();
  },

  getStoredUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  },

  onAuthStateChange(callback) {
    if (!SUPABASE_CLIENT) return;
    return SUPABASE_CLIENT.auth.onAuthStateChange(callback);
  }
};

window.SUPABASE = SUPABASE_CLIENT;
window.AUTH = auth;
