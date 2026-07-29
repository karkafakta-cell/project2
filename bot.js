const { Client, GatewayIntentBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js'); // DIKOREKSI: Menggunakan package resmi

// === CONFIG KONEKSI DATABASE & DISCORD ===
const URL_SUPABASE = "https://fxlshljhaejcwszdikvy.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4bHNobGpoYWVqY3dzemRpa3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTA3MjEsImV4cCI6MjEwMDc2NjcyMX0.6mwiW4cyQ00UZYWCNLJOzpILVGMgn6FjvStB1JGowU4";
const TOKEN_BOT_DISCORD = "MTUzMTg0MzMyOTMwODg4NTE3Mg.G6yDnc.iIVWbBcpTlmu3gaI-RdWoZSOD2N94vBc0AuN54"; 

// Inisialisasi Supabase Client
const supabase = createClient(URL_SUPABASE, ANON_KEY);
const objekWaktuVC = new Map(); // Untuk mencatat waktu mulai masuk VC

// Inisialisasi Bot Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers // DIKOREKSI: Wajib ada untuk mendeteksi member baru join
    ]
});

client.once('ready', () => {
    console.log(`⚡ Bot Pelacak Rapot & Member [${client.user.tag}] sudah online!`);
});

// ================= ALUR 1: OTOMATIS MASUK WEB PAS JOIN DISCORD =================
client.on('guildMemberAdd', async (member) => {
    console.log(`👾 Ada member baru join server DC: ${member.user.username}`);

    const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 }) 
        || `https://dicebear.com{encodeURIComponent(member.user.username)}`;

    const kumpulanBioAcak = [
        "Join basecamp otomatis lewat jalur Discord 🎮",
        "Pungut aku bwng😭",
        "Lose streak mulu, tapi masih main💪",
        "Tidur cuma teori, mnding push rank🖥️"
    ];
    const bioOtomatis = kumpulanBioAcak[Math.floor(Math.random() * kumpulanBioAcak.length)];

    // Masukkan/Update data ke tabel utama website Anda 'discord_squad'
    const { error } = await supabase
        .from('discord_squad')
        .upsert({
            discord_id: member.id, 
            nama_member: member.user.username,
            avatar_url: avatarUrl,
            jabatan: "Member Biasa",
            gender: "-",
            role: "Flexible (All Role)",
            game_favorit: "Belum memilih game",
            status_bio: bioOtomatis
        }, { onConflict: 'nama_member' });

    if (error) console.error("❌ Gagal daftar member baru ke Supabase:", error.message);
});

// ================= ALUR 2: TRACKING CHAT / YAPPING =================
client.on('messageCreate', async (message) => {
    if (message.author.bot) return; // Abaikan pesan dari bot lain

    // Memicu fungsi RPC di Supabase untuk nambah hitungan chat
    const { error } = await supabase.rpc('tambah_yapping', { 
        user_id: message.author.id, 
        user_name: message.author.username 
    });
    
    if (error) console.error("❌ Gagal update yapping chat:", error.message);
});

// ================= ALUR 3: TRACKING TIME VOICE CHANNEL & AFK =================
client.on('voiceStateUpdate', async (oldState, newState) => {
    const userId = newState.id;
    const username = newState.member ? newState.member.user.username : "Unknown";

    // 1. KONDISI: Baru Masuk Voice Channel
    if (!oldState.channelId && newState.channelId) {
        objekWaktuVC.set(userId, Date.now());
    }

    // 2. KONDISI: Keluar dari Voice Channel atau Pindah Channel
    if (oldState.channelId && (!newState.channelId || oldState.channelId !== newState.channelId)) {
        const waktuMasuk = objekWaktuVC.get(userId);
        
        if (waktuMasuk) {
            const durasiMilidetik = Date.now() - waktuMasuk;
            const durasiMenit = Math.floor(durasiMilidetik / 60000); // Ubah ke satuan menit
            objekWaktuVC.delete(userId);

            if (durasiMenit > 0) {
                // Cek apakah saluran lama adalah Saluran khusus AFK di Discord-mu
                const isAfkChannel = oldState.channel && oldState.channel.name.toLowerCase().includes('afk');
                
                if (isAfkChannel) {
                    // Simpan ke kolom menit_afk via RPC Supabase
                    await supabase.rpc('tambah_menit_afk', { user_id: userId, user_name: username, jumlah_menit: durasiMenit });
                } else {
                    // Simpan ke kolom menit_di_voice aktif via RPC Supabase
                    await supabase.rpc('tambah_menit_vc', { user_id: userId, user_name: username, jumlah_menit: durasiMenit });
                }
            }
        }

        // Jika dia pindah ke channel baru (bukan keluar total), catat waktu mulai barunya lagi
        if (newState.channelId) {
            objekWaktuVC.set(userId, Date.now());
        }
    }
});

client.login(TOKEN_BOT_DISCORD);
