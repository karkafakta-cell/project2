// === KONEKSI DATABASE SUPABASE ===
const URL_SUPABASE = "https://fxlshljhaejcwszdikvy.supabase.co/rest/v1/";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4bHNobGpoYWVqY3dzemRpa3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTA3MjEsImV4cCI6MjEwMDc2NjcyMX0.6mwiW4cyQ00UZYWCNLJOzpILVGMgn6FjvStB1JGowU4";

const supabaseClient = supabase.createClient(URL_SUPABASE, ANON_KEY);

let listMemberGlobal = [];
let gamesTerpilih = []; 

// === KAMUS DATA ROLE BERDASARKAN GAME ===
const KAMUS_ROLE = {
    "Valorant": ["Duelist / Entry", "Sentinel / Anchor", "Initiator / Support", "Controller / Smoker"],
    "MLBB": ["EXP Laner / Fighter", "Gold Laner / Marksman", "Mid Laner/ Mage", "Jungler / Assassin", "Roamer / Tank / Support"],
    "Minecraft": ["PVP Fighter / Slayer", "Explorer / Gatherer", "Builder / Architect", "Redstoner / Engineer", "Farmer / Breeder", "Miner / Resource Collector"],
    "PUBG Mobile": ["Rusher / Fragger", "Support / Medic", "IGL (Leader)", "Sniper / Scout"],
};

function perbaruiDaftarRole() {
    let selectRole = document.getElementById('input_role');
    if (!selectRole) return;

    if (gamesTerpilih.length === 0) {
        selectRole.innerHTML = '<option value="Flexible (All Role)">Pilih game favoritmu terlebih dahulu...</option>';
        return;
    }

    let semuaRoleCocok = ["Flexible (All Role)"];
    gamesTerpilih.forEach(game => {
        if (KAMUS_ROLE[game]) {
            semuaRoleCocok = semuaRoleCocok.concat(KAMUS_ROLE[game]);
        }
    });

    let roleUnik = [...new Set(semuaRoleCocok)];

    let htmlOpsi = "";
    roleUnik.forEach(role => {
        htmlOpsi += `<option value="${role}">${role}</option>`;
    });
    selectRole.innerHTML = htmlOpsi;
}

// FUNGSI UNTUK MERAKIT TEMPLATE BULATAN FOTO PROFIL
function rakitHtmlFoto(squadData) {
    let htmlFoto = "";
    if(!squadData || squadData.length === 0) {
        return "<p style='color:#aaa;'>Belum ada member. Silakan daftar di bawah!</p>";
    }
    squadData.forEach((member, indeks) => {
        let fotoUrl = member.avatar_url || 'https://dicebear.com' + encodeURIComponent(member.nama_member);
        htmlFoto += `<img class="profil-bulat" src="${fotoUrl}" alt="${member.nama_member}" title="${member.nama_member}" onclick="bukaDetail(${indeks})">`;
    });
    return htmlFoto;
}

// 1. FUNGSI UNTUK MENAMPILKAN BULATAN PROFIL (SUDAH DIOPTIMASI INSTAN)
async function muatFotoSquad() {
    // TRIK INSTAN: Ambil data lama yang sempat disimpan di memori browser dulu
    const dataLokal = localStorage.getItem('cache_squad');
    if (dataLokal) {
        listMemberGlobal = JSON.parse(dataLokal);
        // Langsung tampilkan ke layar dalam 0.1 detik tanpa nunggu loading internet!
        document.getElementById('tempat-foto-squad').innerHTML = rakitHtmlFoto(listMemberGlobal);
    }

    // Ambil data terbaru secara diam-diam dari database Supabase di latar belakang
    let { data: discord_squad, error } = await supabaseClient
        .from('discord_squad')
        .select('*');

    if (error) {
        console.log("Gagal memuat latar belakang:", error);
        return;
    }

    // Perbarui memori lokal dengan data paling baru
    localStorage.setItem('cache_squad', JSON.stringify(discord_squad));
    listMemberGlobal = discord_squad;
    
    // Perbarui tampilan layar jika ada member baru masuk
    document.getElementById('tempat-foto-squad').innerHTML = rakitHtmlFoto(discord_squad);
}

// 2. FUNGSI DETEKSI KODE RAHASIA ADMIN
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

// 3. FUNGSI KLIK UNTUK TOMBOL TAG GAME MODERN
function toggleTag(elemen, namaGame) {
    elemen.classList.toggle('active');
    if (elemen.classList.contains('active')) {
        gamesTerpilih.push(namaGame);
    } else {
        gamesTerpilih = gamesTerpilih.filter(g => g !== namaGame);
    }
    perbaruiDaftarRole();
}

// 4. FUNGSI SAAT BULATAN DIKLIK (MUNCUL POP-UP DETAIL)
function bukaDetail(indeks) {
    let member = listMemberGlobal[indeks];
    let tglGabung = new Date(member.created_at).toLocaleDateString('id-ID');
    let fotoUrl = member.avatar_url || 'https://dicebear.com' + encodeURIComponent(member.nama_member);

    let htmlDetail = `
        <img src="${fotoUrl}" style="width:85px; height:85px; border-radius:50%; border:2px solid #5865f2; display:block; margin:0 auto; object-fit:cover;">
        <h2>${member.nama_member}</h2>
        <p style="color: #66fcf1; margin: 5px 0;">💼 <b>Jabatan:</b> ${member.jabatan || 'Member'}</p>
        <p style="color: #ff65a3; margin: 5px 0;">⚧️ <b>Gender:</b> ${member.gender || '-'}</p>
        <p style="color: #c5a3ff; margin: 5px 0;">🛡️ <b>Role:</b> ${member.role || '-'}</p>
        <p style="margin: 5px 0;">🎮 <b>Game Favorit:</b> ${member.game_favorit || '-'}</p>
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

// 5. FUNGSI UNTUK MENGIRIM DATA FORMULIR KE SUPABASE
async function kirimDataKeSupabase() {
    let nama = document.getElementById('input_nama').value;
    let jabatan = document.getElementById('input_jabatan').value;
    let gender = document.getElementById('input_gender').value;
    let role = document.getElementById('input_role').value;
    let bio = document.getElementById('input_bio').value;
    let avatar = document.getElementById('input_avatar').value;

    if(!nama) { alert("Nama wajib diisi ya!"); return; }

    if (!bio || bio.trim() === "") {
        const kumpulanBioAcak = [
            "Pungut aku bwng😭",
            "Lose streak mulu, tapi masih main💪",
            "Spesialis tumbal sejati",
            "Gendong tim sampe pinggang encok 🏋️",
            "Mending mabar daripada overthinking😂",
            "Fokus main drpd yapping🗣️",
            "Tidur cuma teori, mnding push rank🖥️"
        ];
        bio = kumpulanBioAcak[Math.floor(Math.random() * kumpulanBioAcak.length)];
    }

    let stringGame = gamesTerpilih.join(", ");
    if(stringGame === "") { stringGame = "Tidak ada game favorit"; }

    let namaFinal = nama.trim();

    const { data, error } = await supabaseClient
        .from('discord_squad')
        .insert([
            { 
                nama_member: namaFinal, 
                jabatan: jabatan, 
                gender: gender, 
                role: role, 
                game_favorit: stringGame, 
                status_bio: bio, 
                avatar_url: avatar 
            }
        ]);

    if (error) {
        alert("Gagal daftar, RLS Supabase mungkin masih mengunci tabel!");
        console.log(error);
    } else {
        alert("Berhasil bergabung ke basecamp! 🚀");
        document.getElementById('input_nama').value = "";
        document.getElementById('input_bio').value = "";
        document.getElementById('input_avatar').value = "";
        document.querySelectorAll('.tag-game.active').forEach(el => el.classList.remove('active'));
        gamesTerpilih = [];
        perbaruiDaftarRole();
        muatFotoSquad();
    }
}

muatFotoSquad();
