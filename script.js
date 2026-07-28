// === GANTI DENGAN KODE ASLI NOTEPAD ANDA ===
const URL_SUPABASE = "https://fxlshljhaejcwszdikvy.supabase.co/rest/v1/";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4bHNobGpoYWVqY3dzemRpa3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTA3MjEsImV4cCI6MjEwMDc2NjcyMX0.6mwiW4cyQ00UZYWCNLJOzpILVGMgn6FjvStB1JGowU4";

const supabase = supabase.createClient(URL_SUPABASE, ANON_KEY);
let listMemberGlobal = [];

// 1. FUNGSI UNTUK MENAMPILKAN BULATAN PROFIL
async function muatFotoSquad() {
    let { data: discord_squad, error } = await supabase
        .from('discord_squad')
        .select('*');

    if (error) {
        document.getElementById('tempat-foto-squad').innerText = "Gagal memuat database.";
        return;
    }

    listMemberGlobal = discord_squad;
    let htmlFoto = "";
    
    if(discord_squad.length === 0) {
        htmlFoto = "<p style='color:#aaa;'>Belum ada member. Silakan daftar di bawah!</p>";
    } else {
        discord_squad.forEach((member, indeks) => {
            let fotoUrl = member.avatar_url || 'https://dicebear.com' + encodeURIComponent(member.nama_member);
            htmlFoto += `<img class="profil-bulat" src="${fotoUrl}" alt="${member.nama_member}" title="${member.nama_member}" onclick="bukaDetail(${indeks})">`;
        });
    }

    document.getElementById('tempat-foto-squad').innerHTML = htmlFoto;
}

// 2. FUNGSI SAAT BULATAN DIKLIK (MUNCUL POP-UP DETAIL)
function bukaDetail(indeks) {
    let member = listMemberGlobal[indeks];
    let tglGabung = new Date(member.created_at).toLocaleDateString('id-ID');
    let fotoUrl = member.avatar_url || 'https://dicebear.com' + encodeURIComponent(member.nama_member);

    let htmlDetail = `
        <img src="${fotoUrl}" style="width:85px; height:85px; border-radius:50%; border:2px solid #45f3ff; display:block; margin:0 auto; object-fit:cover;">
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

// 3. FUNGSI UNTUK MENGIRIM DATA FORMULIR KE SUPABASE
async function kirimDataKeSupabase() {
    let nama = document.getElementById('input_nama').value;
    let jabatan = document.getElementById('input_jabatan').value;
    let gender = document.getElementById('input_gender').value;
    let role = document.getElementById('input_role').value;
    let bio = document.getElementById('input_bio').value;
    let avatar = document.getElementById('input_avatar').value;

    if(!nama) { alert("Nama wajib diisi ya!"); return; }

    let gameDicentang = [];
    let checkboxes = document.querySelectorAll('input[name="game"]:checked');
    checkboxes.forEach((cb) => {
        gameDicentang.push(cb.value);
    });
    let stringGame = gameDicentang.join(", ");

    const { data, error } = await supabase
        .from('discord_squad')
        .insert([
            { 
                nama_member: nama, 
                jabatan: jabatan, 
                gender: gender, 
                role: role, 
                game_favorit: stringGame, 
                status_bio: bio, 
                avatar_url: avatar 
            }
        ]);

    if (error) {
        alert("Gagal daftar, cek konsol!");
        console.log(error);
    } else {
        alert("Berhasil bergabung ke basecamp! 🚀");
        document.getElementById('input_nama').value = "";
        document.getElementById('input_role').value = "";
        document.getElementById('input_bio').value = "";
        document.getElementById('input_avatar').value = "";
        document.querySelectorAll('input[name="game"]:checked').forEach(cb => cb.checked = false);
        muatFotoSquad();
    }
}

// Jalankan fungsi otomatis saat web dibuka
muatFotoSquad();
