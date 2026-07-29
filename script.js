// === KONEKSI DATABASE SUPABASE & KONFIGURASI DISCORD ===
const URL_SUPABASE = "https://fxlshljhaejcwszdikvy.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4bHNobGpoYWVqY3dzemRpa3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTA3MjEsImV4cCI6MjEwMDc2NjcyMX0.6mwiW4cyQ00UZYWCNLJOzpILVGMgn6FjvStB1JGowU4";
const supabaseClient = supabase.createClient(URL_SUPABASE, ANON_KEY);

// MASUKKAN ID BERIKUT DI DEVELOPER PORTAL DISCORD KAMU
const DISCORD_CLIENT_ID = "1531843329308885172"; 
const SERVER_DISCORD_ID = "1531547009004208249"; 

let listMemberGlobal = [];
let dataDiscordOnline = []; // Menyimpan list ID member yang sedang online dari widget DC
let gamesTerpilih = [];
let rolesTerpilih = [];

// === KAMUS DATA ROLE BERDASARKAN GAME ===
const KAMUS_ROLE = {
    "Valorant": ["Duelist / Entry", "Sentinel / Anchor", "Initiator / Support", "Controller / Smoker"],
    "MLBB": ["EXP Laner / Fighter", "Gold Laner / Marksman", "Mid Laner/ Mage", "Jungler / Assassin", "Roamer / Tank / Support"],
    "Minecraft": ["PVP Fighter / Slayer", "Explorer / Gatherer", "Builder / Architect", "Redstoner / Engineer", "Farmer / Breeder", "Miner / Resource Collector"],
    "PUBG Mobile": ["Rusher / Fragger", "Support / Medic", "IGL (Leader)", "Sniper / Scout"],
};

// Memicu pengecekan OAuth dan penarikan data saat web pertama kali dibuka
document.addEventListener("DOMContentLoaded", () => {
    cekHasilLoginDiscord();
    muatFotoSquad();
});

// ================= FUNGSI BARU: AUTENTIKASI LOGIN VIA DISCORD (OAuth2) =================
function loginPakeDiscord() {
    const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
    const urlPersetujuanDiscord = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=identify`;
    window.location.href = urlPersetujuanDiscord;
}

async function cekHasilLoginDiscord() {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.substring(1));
    const tokenAkses = params.get("access_token");

    if (tokenAkses) {
        window.history.replaceState({}, document.title, window.location.pathname);
        document.getElementById("text-login-status").innerText = "Memverifikasi...";

        try {
            // Memanggil pelayan backend kita di Vercel, bukan Discord langsung!
            const responUser = await fetch("/api/auth-discord", { 
                headers: { 
                Authorization: `Bearer ${tokenAkses}` 
            } 
            });

            const dataUser = await responUser.json();

            if (dataUser.id) {
                // 1. Simpan data Discord sementara di browser
                sessionStorage.setItem("discord_user", JSON.stringify(dataUser));

                // 2. Ubah teks tombol menjadi "Lanjutkan Pendaftaran..."
                document.getElementById("text-login-status").innerText = "Lanjutkan Pendaftaran...";

                // 3. Picu fungsi bawaan webmu untuk pindah ke halaman/tab form pendaftaran
                bukaTabPendaftaran(); // Sesuaikan dengan nama fungsi pindah tab di webmu
            }
        } catch (error) {
            console.error("Gagal verifikasi OAuth Discord:", err);
            document.getElementById("text-login-status").innerText = "Login Gagal";
        }
    }
}

async function daftarkanViaWebOtomatis(user) {
    const linkAvatar = user.avatar 
        ? `https://discordapp.com${user.id}/${user.avatar}.png`
        : `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(user.username)}`;

    const kumpulanBioAcak = [
        "Join basecamp lewat jalur website 🚀",
        "Pungut aku bwng😭",
        "Lose streak mulu, tapi masih main💪",
        "Mening mabar daripada overthinking😂"
    ];
    const bioOtomatis = kumpulanBioAcak[Math.floor(Math.random() * kumpulanBioAcak.length)];

    const { error } = await supabaseClient
        .from('discord_squad')
        .upsert({ 
            discord_id: user.id, // Menyimpan ID Discord unik untuk tracking online & raport
            nama_member: user.username, 
            avatar_url: linkAvatar,
            jabatan: "Member Biasa",
            gender: "Pria",
            role: "Flexible (All Role)",
            game_favorit: "Valorant",
            status_bio: bioOtomatis
        }, { onConflict: 'discord_id' });

    if (!error) {
        document.getElementById("text-login-status").innerText = `Halo, ${user.username}!`;
        alert(`Sukses masuk! Selamat datang di Basecamp, ${user.username}!`);
        muatFotoSquad();
    } else {
        console.error("Detail Error Supabase:", error.message || error);
    }
}

// ================= FUNGSI BARU: PENGECEKAN STATUS LIVE WIDGET DISCORD =================
async function muatStatusOnlineDiscord() {
    try {
        const responWidget = await fetch(`https://discord.com/api/guilds/${SERVER_DISCORD_ID}/widget.json`);
        const dataWidget = await responWidget.json();
        
        if (dataWidget && dataWidget.members) {
            dataDiscordOnline = dataWidget.members.map(m => m.id);
        }
    } catch (e) {
        console.warn("Widget Discord offline / belum diaktifkan di Server Settings.", e);
    }
}

// ================= FUNGSI UTAMA NAVIGASI PINDAH TAB INTERAKTIF =================
function pindahTab(idTabTujuan) {
    document.querySelectorAll('.konten-tab').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(tombol => {
        tombol.classList.remove('active');
    });
    
    document.getElementById(idTabTujuan).classList.add('active');
    
    // Sinkronisasi tombol navigasi agar tetap menyala active saat dipindah otomatis oleh sistem
    const tombolAktif = Array.from(document.querySelectorAll(".tab-btn")).find(btn => btn.getAttribute("onclick").includes(idTabTujuan));
    if (tombolAktif) {
        tombolAktif.classList.add('active');
    } else if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// ================= FUNGSI RE-RENDERING DAN KOMPONEN FORM INPUT =================
function perbaruiDaftarRole() {
    let wadahRole = document.getElementById('tempat-tag-role');
    let tombolAllRole = document.getElementById('btn-all-role');
    if (!wadahRole) return;

    if (gamesTerpilih.length === 0) {
        wadahRole.innerHTML = '<p style="color: #949ba4; margin: 5px 0; font-size: 13px;">Pilih game favoritmu terlebih dahulu...</p>';
        rolesTerpilih = [];
        if (tombolAllRole) tombolAllRole.style.display = 'none';
        return;
    }

    if (tombolAllRole) tombolAllRole.style.display = 'inline-block';

    let semuaRoleCocok = [];
    gamesTerpilih.forEach(game => {
        if (KAMUS_ROLE[game]) {
            semuaRoleCocok = semuaRoleCocok.concat(KAMUS_ROLE[game]);
        }
    });

    let roleUnik = [...new Set(semuaRoleCocok)];
    let htmlOpsi = "";
    roleUnik.forEach(role => {
        let kelasAktif = rolesTerpilih.includes(role) ? "active" : "";
        htmlOpsi += `<div class="tag-role ${kelasAktif}" data-role="${role}" onclick="toggleTagRole(this, '${role}')">${role}</div>`;
    });
    wadahRole.innerHTML = htmlOpsi;
    rolesTerpilih = rolesTerpilih.filter(r => roleUnik.includes(r));
}

function toggleTagRole(elemen, namaRole) {
    elemen.classList.toggle('active');
    if (elemen.classList.contains('active')) {
        rolesTerpilih.push(namaRole);
    } else {
        rolesTerpilih = rolesTerpilih.filter(r => r !== namaRole);
    }
}

function pilihSemuaRole() {
    let tagRoles = document.querySelectorAll('.tag-role');
    if (tagRoles.length === 0) return;

    let paksaAktif = rolesTerpilih.length < tagRoles.length;
    rolesTerpilih = [];
    tagRoles.forEach(tag => {
        let namaRole = tag.getAttribute('data-role');
        if (paksaAktif) {
            tag.classList.add('active');
            rolesTerpilih.push(namaRole);
        } else {
            tag.classList.remove('active');
        }
    });
}

function toggleTag(elemen, namaGame) {
    elemen.classList.toggle('active');
    if (elemen.classList.contains('active')) {
        gamesTerpilih.push(namaGame);
    } else {
        gamesTerpilih = gamesTerpilih.filter(g => g !== namaGame);
    }
    perbaruiDaftarRole();
}

function cekKodeAdmin() {
    let namaInput = document.getElementById('input_nama').value;
    let opsiAdmin = document.getElementById('opsi-admin');
    let selectJabatan = document.getElementById('input_jabatan');

    if (namaInput.toLowerCase().includes('owner')) {
        if(opsiAdmin) opsiAdmin.style.display = 'block';
        if(selectJabatan) selectJabatan.value = "Ketua Squad / Admin";
        document.getElementById('input_nama').value = namaInput.replace(/owner/gi, '').trim();
    }
}

// ================= MODIFIKASI FUNGSI: PERAKITAN BUNDERAN FOTO + INDIKATOR ONLINE =================
function rakitHtmlFoto(squadData) {
    let htmlFoto = "";
    if(!squadData || squadData.length === 0) {
        return "<p style='color:#aaa;'>Belum ada member. Silakan daftar di menu Tambah Member!</p>";
    }

    squadData.forEach((member, indeks) => {
        let fotoUrl = member.avatar_url;
        if (!fotoUrl || fotoUrl.trim() === "" || fotoUrl.includes("pinterest.com/pin/")) {
            fotoUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(member.nama_member)}`;
        }

        // Cek apakah discord_id member terdeteksi sedang online di server discord
        const isOnline = member.discord_id && dataDiscordOnline.includes(member.discord_id);
        const statusClass = isOnline ? "status-online" : "status-offline";

        // Merakit wrapper avatar dengan sistem bulatan status memotong foto ala Discord asli
        htmlFoto += `
            <div class="member-avatar-wrapper ${statusClass} " onclick="bukaDetail(${indeks})">
                <img class="member-img" src="${fotoUrl}" alt="${member.nama_member}" title="${member.nama_member}">
            </div>
        `;
    });
    return htmlFoto;
}

// === PERBAIKAN FUNGSI MUAT FOTO SQUAD (Ganti bagian ini di script.js Anda) ===
async function muatFotoSquad() {
    // 1. Jalankan penarikan status widget terlebih dahulu agar akurat
    await muatStatusOnlineDiscord();

    // 2. Ambil data dari cache lokal browser terlebih dahulu agar loading cepat
    const dataLokal = localStorage.getItem('cache_squad');
    if (dataLokal) {
        listMemberGlobal = JSON.parse(dataLokal);
        document.getElementById('tempat-foto-squad').innerHTML = rakitHtmlFoto(listMemberGlobal);
        if (typeof renderTabelRaport === "function") renderTabelRaport();
    }

    // 3. Tarik data ter-update dari tabel 'discord_squad' Supabase
    let { data: discord_squad, error } = await supabaseClient
        .from('discord_squad')
        .select('*');

    if (error) {
        console.log("Gagal memuat database:", error);
        return;
    }

    // 4. Simpan data terbaru ke cache dan tampilkan ke layar
    localStorage.setItem('cache_squad', JSON.stringify(discord_squad));
    listMemberGlobal = discord_squad;
    document.getElementById('tempat-foto-squad').innerHTML = rakitHtmlFoto(discord_squad);
    if (typeof renderTabelRaport === "function") renderTabelRaport();
}


// ================= FUNGSI UTAMA POP-UP DETAIL MEMBER =================
function bukaDetail(indeks) {
  let member = listMemberGlobal[indeks];
  let tglGabung = new Date(member.created_at).toLocaleDateString('id-ID');
  let fotoUrl = member.avatar_url;

  if (!fotoUrl || fotoUrl.trim() === "" || fotoUrl.includes("pinterest.com/pin/")) {
    fotoUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(member.nama_member)}`;
  }

  const isOnline = member.discord_id && dataDiscordOnline.includes(member.discord_id);
  
  let htmlDetail = `
    <img src="${fotoUrl}" style="width:85px; height:85px; border-radius:50%; border:2px solid #5865f2; display:block; margin:0 auto; object-fit:cover;"> 
    <h2>${member.nama_member}</h2> 
    <p style="color: #23a55a; text-align:center; font-weight:bold; margin: 5px 0;">Status: ${isOnline ? '🟢 Online' : '⚫ Offline'}</p> 
    <p style="color: #66fcf1; margin: 5px 0;">💼 <b>Jabatan:</b> ${member.jabatan || 'Member'}</p> 
    <p style="color: #ff65a3; margin: 5px 0;">⚧️ <b>Gender:</b> ${member.gender || '-'}</p> 
    <p style="color: #c5a3ff; margin: 5px 0;">🛡️ <b>Role:</b> ${member.role || '-'}</p> 
    <p style="margin: 5px 0;"><b>Game Favorit:</b> ${member.game_favorit || '-'}</p> 
    <p style="color: #c5a3c5; font-style: italic; margin: 10px 0;">📝 "${member.status_bio || ''}"</p> 
    <p style="font-size:11px; color:#888; margin-top:20px; border-top:1px dashed #333; padding-top:5px;">📅 Bergabung: ${tglGabung}</p>
  `;

  document.getElementById('isi-detail-member').innerHTML = htmlDetail;
  document.getElementById('pop-up-detail').style.display = 'block';
  document.getElementById('bg-pop-up').style.display = 'block';
}

function tutupDetail() {
  document.getElementById('pop-up-detail').style.display = 'none';
  document.getElementById('bg-pop-up').style.display = 'none';
}

// ================= FUNGSI RENDERING DATA TABEL RAPORT MABAR =================
async function renderTabelRaport() {
  const dataSistemLoop = document.getElementById("data-sistem-loop");
  const dataVoteLoop = document.getElementById("data-vote-loop");

  if (!dataSistemLoop || !dataVoteLoop) return;

  if (listMemberGlobal.length === 0) {
    dataSistemLoop.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#949ba4;">Belum ada data</td></tr>`;
    dataVoteLoop.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#949ba4;">Belum ada data</td></tr>`;
    return;
  }

  try {
    // Tarik data real-time tracker yang dikumpulkan oleh bot dari Supabase
    const { data: rapotSistem } = await supabaseClient.from('rapot_sistem').select('*');
    const { data: rapotVote } = await supabaseClient.from('rapot_vote').select('*');

    // 1. Render Tabel Data Sistem Otomatis
    dataSistemLoop.innerHTML = listMemberGlobal.map(m => {
      const matchSistem = rapotSistem ? rapotSistem.find(s => s.discord_id === m.discord_id) : null;
      return `
        <tr> 
          <td><strong>${m.nama_member}</strong></td> 
          <td>${matchSistem ? matchSistem.total_chat_yapping : 0} Chat</td> 
          <td>${matchSistem ? (matchSistem.menit_di_voice / 60).toFixed(1) : 0} Jam</td> 
          <td>${matchSistem ? (matchSistem.menit_afk / 60).toFixed(1) : 0} Jam</td> 
        </tr>`;
    }).join("");

    // 2. Render Tabel Hasil Vote Anggota Komunitas
    dataVoteLoop.innerHTML = listMemberGlobal.map(m => {
      const matchVote = rapotVote ? rapotVote.find(v => v.discord_id === m.discord_id) : null;
      return `
        <tr> 
          <td><strong>${m.nama_member}</strong></td> 
          <td>${matchVote ? matchVote.vote_sepuh : 0} 👑</td> 
          <td>${matchVote ? matchVote.vote_beban : 0} ☠️</td> 
          <td>${matchVote ? matchVote.vote_tumbal : 0} 🎯</td> 
          <td><button class="btn-mini-vote" onclick="alert('Fitur voting instan akan segera hadir!')">Vote</button></td> 
        </tr>`;
    }).join("");

  } catch (e) {
    console.error("Gagal sinkronisasi data tabel raport:", e);
  }
}

// ================= FUNGSI MANUAL SUBMIT FORM DATA KE SUPABASE ================= 
async function kirimDataKeSupabase() { 
    let nama = document.getElementById('input_nama').value; 
    let jabatan = document.getElementById('input_jabatan').value; 
    let gender = document.getElementById('input_gender').value; 
    let bio = document.getElementById('input_bio').value; 
    let avatar = document.getElementById('input_avatar').value; 

    if (!nama) { 
        alert("Nama wajib diisi ya!"); 
        return; 
    } 

    if (!bio || bio.trim() === "") { 
        const kumpulanBioAcak = [ 
            "Pungut aku bwng😭", 
            "Lose streak mulu, tapi masih main💪", 
            "Spesialis tumbal sejati", 
            "Gendong tim sampe pinggang encok 🏋️", 
            "Mening mabar daripada overthinking😂", 
            "Fokus main drpd yapping🗣️", 
            "Tidur cuma teori, mnding push rank🖥️" 
        ]; 
        bio = kumpulanBioAcak[Math.floor(Math.random() * kumpulanBioAcak.length)]; 
    } 

    let stringGame = gamesTerpilih.join(", "); 
    if (stringGame === "") { 
        stringGame = "Tidak ada game favorit"; 
    } 

    let roleDicentang = rolesTerpilih.join(", "); 
    if (roleDicentang === "") { 
        roleDicentang = "Flexible (All Role)"; 
    } 

    let namaFinal = nama.trim(); 

    // === KODE BARU: AMBIL DATA DISCORD DARI MEMORI SEMENTARA BROWSER ===
    const dataDiscordSementara = JSON.parse(sessionStorage.getItem("discord_user"));
    
    if (dataDiscordSementara && dataDiscordSementara.avatar) {
    fotoProfilFinal = `https://discordapp.com/avatars/${dataDiscordSementara.id}/${dataDiscordSementara.avatar}.png`;
    }


    // === KODE BARU: BUAT ALAMAT FOTO PROFIL DISCORD YANG BENAR ===
    let fotoProfilFinal = avatar; // Default menggunakan input manual jika ada
    if (dataDiscordSementara && dataDiscordSementara.avatar) {
        fotoProfilFinal = `https://discordapp.com{dataDiscordSementara.id}/${dataDiscordSementara.avatar}.png`;
    }

    // === KODE BARU: RAKIT OBJEK DATA GABUNGAN FORM + DISCORD ===
    const dataGabunganSquad = {
        nama_member: namaFinal, // Nama panggilan game pilihan user sendiri di form
        jabatan: jabatan,
        gender: gender,
        role: roleDicentang,
        game_favorit: stringGame,
        status_bio: bio,        // Deskripsi/Bio asli pilihan user sendiri di form
        avatar_url: fotoProfilFinal,
        
        // Memasukkan data Discord ke kolom masing-masing
        discord_id: dataDiscordSementara ? dataDiscordSementara.id : null,
        username_discord: dataDiscordSementara ? `@${dataDiscordSementara.username}` : null
    };

    // === KODE BARU: KIRIM MENGGUNAKAN .upsert AGAR DATA TER-UPDATE JIKA USER LOGIN ULANG ===
    const { data, error } = await supabaseClient
        .from('discord_squad')
        .upsert([dataGabunganSquad], { onConflict: 'discord_id' });

    if (error) { 
        alert("Gagal daftar, silakan cek konsol database!"); 
        console.log(error); 
    } else { 
        alert("Berhasil bergabung ke basecamp! 🚀"); 
        
        // === KODE BARU: BERSIHKAN MEMORI BROWSER SETELAH SUKSES DAFTAR ===
        sessionStorage.clear();

        document.getElementById('input_nama').value = ""; 
        document.getElementById('input_bio').value = ""; 
        document.getElementById('input_avatar').value = ""; 
        document.querySelectorAll('.tag-game.active').forEach(el => el.classList.remove('active')); 
        
        gamesTerpilih = []; 
        rolesTerpilih = []; 
        perbaruiDaftarRole(); 
        muatFotoSquad(); 
        pindahTab('tab-home'); 
    } 
}
