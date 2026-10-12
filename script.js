// Variable State
let currentStep = 1;
let applicants = JSON.parse(localStorage.getItem('ppdb_applicants')) || [
  { id: 'PPDB-2026-0001', nama: 'Budi Santoso', nisn: '0081234567', sekolah: 'SMPN 1 Surabaya', jalur: 'Zonasi', jurusan: 'MIPA', nilai: 88.5, status: 'Verified' },
  { id: 'PPDB-2026-0002', nama: 'Siti Rahma', nisn: '0087654321', sekolah: 'SMPN 2 Surabaya', jalur: 'Prestasi', jurusan: 'IPS', nilai: 92.0, status: 'Pending' }
];

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
  saveData();
  renderRankingTable();
  renderAdminTable();
  lucide.createIcons();
});

// Simpan Data ke Local Storage
function saveData() {
  localStorage.setItem('ppdb_applicants', JSON.stringify(applicants));
}

// Navigasi Tab
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active-nav');
    if (btn.dataset.tab === tabId) btn.classList.add('active-nav');
  });
}

// Dark Mode Toggle
function toggleTheme() {
  document.documentElement.classList.toggle('dark');
}

// Wizard Step Form Navigation
function moveStep(direction) {
  const newStep = currentStep + direction;
  if (newStep < 1 || newStep > 4) return;

  document.getElementById(`form-step-${currentStep}`).classList.add('hidden');
  document.getElementById(`form-step-${newStep}`).classList.remove('hidden');

  // Update Dots
  document.getElementById(`step-dot-${currentStep}`).classList.remove('bg-blue-600', 'text-white');
  document.getElementById(`step-dot-${currentStep}`).classList.add('bg-slate-300', 'dark:bg-slate-700', 'text-slate-600');

  document.getElementById(`step-dot-${newStep}`).classList.add('bg-blue-600', 'text-white');

  currentStep = newStep;

  // Toggle buttons
  document.getElementById('prevBtn').classList.toggle('hidden', currentStep === 1);
  document.getElementById('nextBtn').classList.toggle('hidden', currentStep === 4);
  document.getElementById('submitBtn').classList.toggle('hidden', currentStep !== 4);

  // Line progress
  document.getElementById('progress-line').style.width = `${((currentStep - 1) / 3) * 100}%`;
}

// Hitung Rata-Rata Nilai Rapor
function calculateAverage() {
  const mtk = parseFloat(document.getElementById('nilMtk').value) || 0;
  const ipa = parseFloat(document.getElementById('nilIPA').value) || 0;
  const ips = parseFloat(document.getElementById('nilIPS').value) || 0;
  const indo = parseFloat(document.getElementById('nilIndo').value) || 0;
  const ing = parseFloat(document.getElementById('nilIng').value) || 0;

  const avg = (mtk + ipa + ips + indo + ing) / 5;
  document.getElementById('displayAvg').innerText = avg.toFixed(2);
  return avg.toFixed(2);
}

// Submit Form
function handleFormSubmit(e) {
  e.preventDefault();
  const nama = document.getElementById('inputNama').value;
  const nisn = document.getElementById('inputNISN').value;
  const sekolah = document.getElementById('inputSekolah').value;
  const jalur = document.querySelector('input[name="jalur"]:checked').value;
  const jurusan = document.getElementById('inputJurusan').value;
  const nilai = calculateAverage();

  const newId = `PPDB-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const newStudent = { id: newId, nama, nisn, sekolah, jalur, jurusan, nilai: parseFloat(nilai), status: 'Pending' };

  applicants.push(newStudent);
  saveData();
  renderRankingTable();
  renderAdminTable();

  alert(`Pendaftaran Berhasil!\nNomor Registrasi Anda: ${newId}`);
  document.getElementById('ppdbForm').reset();
  moveStep(-3); // Reset ke step 1
  switchTab('status');
  document.getElementById('searchKode').value = newId;
  checkStatus();
}

// Cek Status Pendaftaran
function checkStatus() {
  const query = document.getElementById('searchKode').value.trim().toLowerCase();
  const resContainer = document.getElementById('statusResult');
  
  const student = applicants.find(a => a.id.toLowerCase() === query || a.nisn === query);

  resContainer.classList.remove('hidden');
  if (student) {
    let statusBadge = student.status === 'Verified' 
      ? '<span class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">DITERIMA</span>'
      : (student.status === 'Rejected' 
        ? '<span class="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold">DITOLAK</span>'
        : '<span class="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">MENUNGGU VERIFIKASI</span>');

    resContainer.innerHTML = `
      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <h3 class="font-bold text-lg">${student.nama}</h3>
          ${statusBadge}
        </div>
        <p class="text-xs text-slate-500">No. Registrasi: <strong>${student.id}</strong> | NISN: ${student.nisn}</p>
        <hr class="dark:border-slate-700" />
        <div class="grid grid-cols-2 text-xs gap-2">
          <p>Sekolah Asal: <strong>${student.sekolah}</strong></p>
          <p>Jalur: <strong>${student.jalur}</strong></p>
          <p>Jurusan: <strong>${student.jurusan}</strong></p>
          <p>Rata-Rata Nilai: <strong>${student.nilai}</strong></p>
        </div>
        <button onclick="window.print()" class="w-full mt-2 bg-slate-800 text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2">
          <i data-lucide="printer" class="w-4 h-4"></i> Cetak Bukti Pendaftaran
        </button>
      </div>
    `;
    lucide.createIcons();
  } else {
    resContainer.innerHTML = `<p class="text-rose-500 text-center font-medium">Data pendaftaran tidak ditemukan.</p>`;
  }
}

// Render Tabel Peringkat
function renderRankingTable() {
  const tbody = document.getElementById('rankingTableBody');
  const query = document.getElementById('filterSearch')?.value.toLowerCase() || '';

  const sorted = [...applicants]
    .filter(a => a.nama.toLowerCase().includes(query) || a.sekolah.toLowerCase().includes(query))
    .sort((a, b) => b.nilai - a.nilai);

  tbody.innerHTML = sorted.map((a, index) => `
    <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50">
      <td class="p-4 font-bold text-blue-600">#${index + 1}</td>
      <td class="p-4">${a.id}</td>
      <td class="p-4 font-semibold">${a.nama}</td>
      <td class="p-4">${a.sekolah}</td>
      <td class="p-4">${a.jalur}</td>
      <td class="p-4">${a.jurusan}</td>
      <td class="p-4 font-bold">${a.nilai}</td>
    </tr>
  `).join('');
}

// Render Panel Admin
function renderAdminTable() {
  const tbody = document.getElementById('adminTableBody');
  tbody.innerHTML = applicants.map(a => `
    <tr>
      <td class="p-4 font-mono text-xs">${a.id}</td>
      <td class="p-4 font-medium">${a.nama}</td>
      <td class="p-4">${a.jalur}</td>
      <td class="p-4 font-bold">${a.nilai}</td>
      <td class="p-4"><span class="text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-700">${a.status}</span></td>
      <td class="p-4 flex gap-1">
        <button onclick="updateStatus('${a.id}', 'Verified')" class="bg-emerald-600 text-white px-2 py-1 rounded text-xs hover:bg-emerald-700">Terima</button>
        <button onclick="updateStatus('${a.id}', 'Rejected')" class="bg-rose-600 text-white px-2 py-1 rounded text-xs hover:bg-rose-700">Tolak</button>
      </td>
    </tr>
  `).join('');
}

// Update Status oleh Admin
function updateStatus(id, newStatus) {
  const student = applicants.find(a => a.id === id);
  if (student) {
    student.status = newStatus;
    saveData();
    renderAdminTable();
    renderRankingTable();
  }
}

// Reset Data
function clearAllData() {
  if (confirm('Apakah Anda yakin ingin menghapus seluruh data pendaftar?')) {
    localStorage.removeItem('ppdb_applicants');
    applicants = [];
    renderAdminTable();
    renderRankingTable();
  }
}