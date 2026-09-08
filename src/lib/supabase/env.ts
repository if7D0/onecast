/** Ambil kredensial publik Supabase. Gagal cepat dengan pesan jelas bila belum diisi. */
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Konfigurasi Supabase belum lengkap: isi NEXT_PUBLIC_SUPABASE_URL dan " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY di .env (lihat .env.example)."
    );
  }
  return { url, anon };
}
