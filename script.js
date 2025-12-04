// Mengelola data di localStorage
function getPermohonanList() {
    return JSON.parse(localStorage.getItem('permohonanList') || '[]');
}

function savePermohonanList(list) {
    localStorage.setItem('permohonanList', JSON.stringify(list));
}

// Helper: konversi file ke base64 (untuk menyimpan di localStorage)
function fileToBase64(file) {
    return new Promise((resolve) => {
        if (!file) return resolve("");
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

// Navigasi Tampilan
function showAdminLogin() {
    hideAllSections();
    document.getElementById('admin-login').classList.remove('hidden');
}

function showPemohonForm() {
    hideAllSections();
    document.getElementById('pemohon-form').classList.remove('hidden');
}

function backToMenu() {
    hideAllSections();
    document.getElementById('main-menu').classList.remove('hidden');
    document.getElementById('admin-error').textContent = '';
    document.getElementById('admin-password').value = '';
}

function hideAllSections() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('admin-login').classList.add('hidden');
    document.getElementById('admin-panel').classList.add('hidden');
    document.getElementById('pemohon-form').classList.add('hidden');
    document.getElementById('success-message').classList.add('hidden');
    closeImageModal(); // pastikan modal tertutup saat berpindah halaman
}

// Login dan Panel Admin
function loginAdmin() {
    const password = document.getElementById('admin-password').value;
    const correctPassword = 'admin123'; // Ganti dengan password yang lebih aman!
    if (password === correctPassword) {
        showAdminPanel();
    } else {
        document.getElementById('admin-error').textContent = 'Password salah!';
    }
}

function logoutAdmin() {
    backToMenu();
}

function showAdminPanel() {
    hideAllSections();
    document.getElementById('admin-panel').classList.remove('hidden');
    renderPermohonanList();
}

function renderPermohonanList() {
    const list = getPermohonanList();
    const container = document.getElementById('permohonan-list');
    container.innerHTML = '';
    
    if (list.length === 0) {
        container.innerHTML = '<p>Belum ada permohonan masuk.</p>';
        return;
    }

    list.forEach((item) => {
        const div = document.createElement('div');
        div.className = "permohonan-card";

        // Tentukan tampilan status
        let statusText = "";
        if (item.status === "diacc") {
            statusText = `<span id="status-${item.id}" class="status-acc">✅ Sudah di-ACC</span>`;
        } else {
            statusText = `<span id="status-${item.id}" class="status-proses">⏳ Menunggu ACC</span>`;
        }

        div.innerHTML = `
            <b>${item.nama_pemohon}</b> (${item.no_hp})<br>
            Jenazah: ${item.nama_jenazah}, Pengiriman: ${item.tgl_pengiriman}<br>
            Status: ${statusText}<br>
            <details>
                <summary>Lihat Dokumen</summary>
                <ul>
                    <li>Surat Kematian:<br>${renderFile(item.dokumen.kematian)}</li>
                    <li>Bebas Penyakit:<br>${renderFile(item.dokumen.bebas_penyakit)}</li>
                    <li>Pengawetan/Formulir:<br>${renderFile(item.dokumen.pengawetan)}</li>
                    <li>Pengepakan:<br>${renderFile(item.dokumen.pengepakan)}</li>
                    <li>Pemetian:<br>${renderFile(item.dokumen.pemetian)}</li>
                </ul>
            </details>
            <div class="action-buttons">
                <button onclick="accPermohonan(${item.id})" ${item.status === 'diacc' ? 'disabled' : ''}>ACC</button>
            </div>
            <hr>
        `;
        container.appendChild(div);
    });
}

function renderFile(base64) {
    if (!base64) return '<i>Tidak ada file</i>';
    if (base64.startsWith('data:image')) {
        // Gambar bisa diklik untuk lihat besar
        return `<img src="${base64}" onclick="openImageModal('${base64}')" 
                style="max-width:180px;max-height:150px;border:1px solid #ccc;margin:5px 0;cursor:pointer;">`;
    } else if (base64.startsWith('data:application/pdf')) {
        return `<a href="${base64}" target="_blank">Lihat PDF</a>`;
    } else {
        return `<a href="${base64}" target="_blank">Lihat File</a>`;
    }
}

function accPermohonan(id) {
    const list = getPermohonanList();
    const idx = list.findIndex(item => item.id === id);
    if (idx !== -1) {
        list[idx].status = "diacc";
        savePermohonanList(list);
        alert("Permohonan telah di-ACC ✅");
        showAdminPanel(); // Refresh tampilan admin
    }
}

// Modal Gambar (klik untuk perbesar)
function openImageModal(src) {
    const modal = document.getElementById('imageModal');
    const img = document.getElementById('previewImage');
    img.src = src;
    modal.classList.remove('hidden');
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) modal.classList.add('hidden');
}

// Form Pemohon
async function submitForm(e) {
    e.preventDefault();
    const form = e.target;

    const [
        base64Kematian,
        base64BebasPenyakit,
        base64Pengawetan,
        base64Pengepakan,
        base64Pemetian
    ] = await Promise.all([
        fileToBase64(form.foto_kematian.files[0]),
        fileToBase64(form.foto_bebas_penyakit.files[0]),
        fileToBase64(form.foto_pengawetan.files[0]),
        fileToBase64(form.foto_pengepakan.files[0]),
        fileToBase64(form.foto_pemetian.files[0])
    ]);

    const data = {
        id: Date.now(),
        nama_pemohon: form.nama_pemohon.value,
        no_hp: form.no_hp.value,
        alamat_pemohon: form.alamat_pemohon.value,
        nama_jenazah: form.nama_jenazah.value,
        tgl_lahir: form.tgl_lahir.value,
        jenis_kelamin: form.jenis_kelamin.value,
        kebangsaan: form.kebangsaan.value,
        alamat_terakhir: form.alamat_terakhir.value,
        maskapai_pelayaran: form.maskapai_pelayaran.value,
        tgl_pengiriman: form.tgl_pengiriman.value,
        nama_penerima: form.nama_penerima.value,
        no_penerima: form.no_penerima.value,
        status: "proses",
        tanggal_permohonan: new Date().toLocaleDateString('id-ID'),
        dokumen: {
            kematian: base64Kematian,
            bebas_penyakit: base64BebasPenyakit,
            pengawetan: base64Pengawetan,
            pengepakan: base64Pengepakan,
            pemetian: base64Pemetian
        }
    };

    const list = getPermohonanList();
    list.push(data);
    savePermohonanList(list);

    form.reset();
    hideAllSections();
    document.getElementById('success-message').classList.remove('hidden');
}

// Saat halaman dimuat
document.addEventListener('DOMContentLoaded', backToMenu);
function exportData() {
  const list = getPermohonanList();
  if (list.length === 0) {
    alert("Belum ada data pemohon untuk diekspor.");
    return;
  }

  // Konversi data ke format CSV
  const headers = [
    "ID", "Nama Pemohon", "No HP", "Alamat Pemohon",
    "Nama Jenazah", "Tanggal Lahir", "Jenis Kelamin", "Kebangsaan",
    "Alamat Terakhir", "Maskapai/Pelayaran", "Tanggal Pengiriman",
    "Nama Penerima", "No Penerima", "Status", "Tanggal Permohonan"
  ];

  const rows = list.map(item => [
    item.id,
    item.nama_pemohon,
    item.no_hp,
    item.alamat_pemohon,
    item.nama_jenazah,
    item.tgl_lahir,
    item.jenis_kelamin,
    item.kebangsaan,
    item.alamat_terakhir,
    item.maskapai_pelayaran,
    item.tgl_pengiriman,
    item.nama_penerima,
    item.no_penerima,
    item.status,
    item.tanggal_permohonan
  ]);

  let csvContent = "data:text/csv;charset=utf-8," 
    + [headers, ...rows].map(e => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "data_pemohon.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
