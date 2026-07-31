export default async function handler(req, res) {
  // Hanya izinkan metode POST dari frontend script.js
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metode tidak diizinkan' });
  }

  const { code, redirect_uri } = req.body;

  // Membaca data kredensial dari Environment Variables Vercel
  const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  const GUILD_ID = process.env.DISCORD_GUILD_ID;

  try {
    // 1. Tukar 'code' dari frontend menjadi Access Token resmi dari Discord
    const responToken = await fetch('https://discord.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri,
      }).toString()
    });

    if (!responToken.ok) {
      const errorData = await responToken.json();
      console.error('Gagal tukar kode Discord:', errorData);
      return res.status(400).json({ error: 'Gagal menukarkan kode otorisasi Discord' });
    }

    const dataToken = await responToken.json();
    const accessToken = dataToken.access_token;

    // 2. Ambil data profil user (@me) dari Discord
    const responUser = await fetch('https://discord.com', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const userData = await responUser.json();

    // 3. EKSEKUSI UTAMA: Paksa user otomatis masuk ke server Discord squad mabar lu!
    try {
      await fetch(`https://discord.com{GUILD_ID}/members/${userData.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ access_token: accessToken })
      });
      console.log(`User ${userData.username} sukses dimasukkan ke server.`);
    } catch (joinError) {
      // Jika user sudah berada di server, Discord melempar status 204. Diabaikan saja karena aman.
      console.log("User mungkin sudah bergabung sebelumnya atau ada masalah hak akses bot.");
    }

    // Kembalikan data profil user ke frontend script.js
    return res.status(200).json({ user: userData });

  } catch (error) {
    console.error('OAuth Backend Error:', error);
    return res.status(500).json({ error: 'Gagal memproses autentikasi Discord' });
  }
}
