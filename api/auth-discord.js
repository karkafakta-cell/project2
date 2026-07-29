export default async function handler(req, res) {
    // 1. Pelayan mengambil "Kupon Makan" (Token) yang dikirim oleh Frontend dari nota (Header)
    const tokenDariFrontend = req.headers.authorization;

    // Jika frontend lupa membawa token, langsung beri tahu bahwa pesanan ditolak
    if (!tokenDariFrontend) {
        return res.status(400).json({ error: "Token tidak ditemukan di header" });
    }

    try {
        // 2. Pelayan berjalan ke "Dapur Utama" (Discord API) membawa Kupon Makan tersebut
        const responDiscord = await fetch("https://discord.com/api/users/@me", {
            headers: {
                // Meneruskan token akses yang tadi dibawa dari frontend
                Authorization: tokenDariFrontend 
            }
        });

        // Ubah makanan dari dapur menjadi format yang siap disajikan (JSON)
        const dataUser = await responDiscord.json();

        // 3. Pelayan kembali ke mejamu di frontend dan menyajikan datanya
        return res.status(200).json(dataUser);

    } catch (err) {
        // Jika di tengah jalan dapur Discord error atau mati, pelayan lapor ke frontend
        console.error("Dapur Discord Error:", err);
        return res.status(500).json({ error: "Gagal mengambil data dari Discord" });
    }
}
