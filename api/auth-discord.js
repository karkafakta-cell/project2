export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metode tidak diizinkan' });
  }

  try {
    // PERBAIKAN UTAMA: Memastikan data JSON dibaca dengan aman oleh Vercel
    const bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { code, redirect_uri } = bodyData;

    const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
    const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
    const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    const GUILD_ID = process.env.DISCORD_GUILD_ID;

    // 1. Tukar 'code' menjadi Access Token resmi dari Discord
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
      console.error('Gagal tukar kode:', errorData);
      return res.status(400).json({ error: 'Gagal menukarkan kode Discord' });
    }

    const dataToken = await responToken.json();
    const accessToken = dataToken.access_token;

    // 2. Ambil data profil user dari Discord
    const responUser = await fetch('https://discord.com', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const userData = await responUser.json();

    // 3. EKSEKUSI UTAMA: Paksa user otomatis masuk ke server Discord mabar lu!
    try {
      await fetch(`https://discord.com{GUILD_ID}/members/${userData.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ access_token: accessToken })
      });
    } catch (joinError) {
      console.log("User mungkin sudah bergabung sebelumnya.");
    }

    // Kembalikan data profil user ke frontend script.js
    return res.status(200).json({ user: userData });

  } catch (error) {
    console.error('OAuth Backend Error:', error);
    return res.status(500).json({ error: 'Gagal memproses autentikasi Discord' });
  }
}
