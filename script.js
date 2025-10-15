// Variabel global untuk menyimpan data
let surveyData = null;
let processedData = null;

// Chart instances
let charts = {};

// Warna untuk chart
const colors = {
    primary: '#6D28D9', // Sesuaikan dengan theme baru
    secondary: '#14B8A6',
    accent: '#EAB308',
    lightBlue: '#A855F7',
    lightGreen: '#2DD4BF',
    lightOrange: '#FCD34D',
    purple: '#7C3AED',
    pink: '#DB2777',
    gray: '#9CA3AF'
};

// Fungsi utama untuk memuat data
async function loadData() {
    try {
        document.body.classList.add('loading');
        
        // Load data dari JSON
        const response = await fetch('data.json');
        surveyData = await response.json();
        
        // Proses data
        processedData = processData(surveyData);
        
        // Update UI
        updateDashboard();
        
        // Render charts
        renderAllCharts();
        
        document.body.classList.remove('loading');
        
        console.log('Data berhasil dimuat:', processedData);
    } catch (error) {
        console.error('Error loading data:', error);
        document.body.classList.remove('loading');
        alert('Error loading data: ' + error.message);
    }
}

// Fungsi untuk memproses data mentah
function processData(data) {
    const respondents = data.responden;
    const total = respondents.length;
    
    // 1. Hitung statistik demografi
    const genderCount = countValues(respondents, 'jenis_kelamin');
    const semesterCount = countValues(respondents, 'semester');
    const experienceCount = countValues(respondents, 'pengalaman_programming');
    
    // 2. Hitung pola penggunaan
    const frequencyCount = countValues(respondents, 'frekuensi_penggunaan');
    const durationCount = countValues(respondents, 'durasi_penggunaan');
    
    // 3. Hitung tools AI (bisa multiple selection)
    const toolsCount = countMultipleValues(respondents, 'tools_ai');
    const top5Tools = getTopN(toolsCount, 5);
    
    // 4. Hitung mata kuliah (bisa multiple selection)
    const coursesCount = countMultipleValues(respondents, 'mata_kuliah');
    const top5Courses = getTopN(coursesCount, 5);
    
    // 5. Hitung statistik untuk pertanyaan skala
    const numericFields = ['pemahaman_konsep', 'efisiensi_tugas', 'debugging_code', 'kreativitas', 'etika_penggunaan', 'penting_karir'];
    const numericStats = {};
    
    numericFields.forEach(field => {
        const values = respondents.map(r => r[field]);
        numericStats[field] = {
            mean: calculateMean(values),
            median: calculateMedian(values),
            mode: calculateMode(values),
            stdDev: calculateStdDev(values),
            range: `${Math.min(...values)}-${Math.max(...values)}`
        };
    });
    
    // 6. Hitung kekhawatiran (bisa multiple selection)
    const concernsCount = countMultipleValues(respondents, 'kekhawatiran');
    const top5Concerns = getTopN(concernsCount, 5);
    
    // 7. Hitung skill penting (bisa multiple selection)
    const skillsCount = countMultipleValues(respondents, 'skill_penting');
    const top5Skills = getTopN(skillsCount, 5);
    
    // 8. Analisis hubungan pengalaman vs tools
    const experienceTools = analyzeExperienceTools(respondents);
    
    return {
        totalRespondents: total,
        gender: genderCount,
        semester: semesterCount,
        experience: experienceCount,
        frequency: frequencyCount,
        duration: durationCount,
        tools: top5Tools,
        courses: top5Courses,
        numericStats: numericStats,
        concerns: top5Concerns,
        skills: top5Skills,
        experienceTools: experienceTools
    };
}

// Fungsi utilitas untuk menghitung nilai
function countValues(data, field) {
    const count = {};
    data.forEach(item => {
        const value = item[field];
        count[value] = (count[value] || 0) + 1;
    });
    return count;
}

function countMultipleValues(data, field) {
    const count = {};
    data.forEach(item => {
        const values = item[field];
        if (Array.isArray(values)) {
            values.forEach(value => {
                count[value] = (count[value] || 0) + 1;
            });
        }
    });
    return count;
}

function getTopN(obj, n) {
    return Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .reduce((result, [key, value]) => {
            result[key] = value;
            return result;
        }, {});
}

function calculateMean(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateMode(values) {
    const frequency = {};
    let maxFreq = 0;
    let mode = values[0];
    
    values.forEach(value => {
        frequency[value] = (frequency[value] || 0) + 1;
        if (frequency[value] > maxFreq) {
            maxFreq = frequency[value];
            mode = value;
        }
    });
    
    return mode;
}

function calculateStdDev(values) {
    const mean = calculateMean(values);
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = calculateMean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
}

function analyzeExperienceTools(respondents) {
    const experienceGroups = {};
    
    respondents.forEach(respondent => {
        const experience = respondent.pengalaman_programming;
        const toolsCount = respondent.tools_ai.length;
        
        if (!experienceGroups[experience]) {
            experienceGroups[experience] = {
                total: 0,
                sumTools: 0
            };
        }
        
        experienceGroups[experience].total += 1;
        experienceGroups[experience].sumTools += toolsCount;
    });
    
    const result = {};
    Object.keys(experienceGroups).forEach(experience => {
        const group = experienceGroups[experience];
        result[experience] = group.sumTools / group.total;
    });
    
    return result;
}

// Fungsi untuk update dashboard dengan data terbaru
function updateDashboard() {
    // Update header
    document.getElementById('judul-dashboard').textContent = surveyData.metadata.judul;
    document.getElementById('subjudul-dashboard').textContent = surveyData.metadata.institusi;
    document.getElementById('info-responden').textContent = `Berdasarkan Survei ${processedData.totalRespondents} Responden - ${surveyData.metadata.tanggalSurvei}`;
    document.getElementById('total-responden').textContent = processedData.totalRespondents;
    document.getElementById('footer-text').textContent = `Dashboard ${surveyData.metadata.judul} | Data Survei ${processedData.totalRespondents} Responden`;
    
    // Update statistik utama
    updateMainStatistics();
    
    // Update insight boxes
    updateInsights();
    
    // Update tabel statistik
    updateStatisticsTable();
}

function updateMainStatistics() {
    const statsContainer = document.querySelector('#statistik-utama .row');
    
    // Hitung persentase pemula
    const pemulaCount = processedData.experience['Pemula'] || 0;
    const pemulaPercentage = ((pemulaCount / processedData.totalRespondents) * 100).toFixed(1);
    
    // Hitung persentase ChatGPT
    const chatGPTCount = processedData.tools['ChatGPT'] || 0;
    const chatGPTPercentage = ((chatGPTCount / processedData.totalRespondents) * 100).toFixed(1);
    
    // Rata-rata penting karir
    const pentingKarirMean = processedData.numericStats.penting_karir.mean.toFixed(2);
    
    // Persentase khawatir ketergantungan
    const ketergantunganCount = processedData.concerns['Ketergantungan berlebihan'] || 0;
    const ketergantunganPercentage = ((ketergantunganCount / processedData.totalRespondents) * 100).toFixed(1);
    
    statsContainer.innerHTML = `
        <div class="col-md-3">
            <div class="card stat-card">
                <div class="stat-value">${pemulaPercentage}%</div>
                <div class="stat-label">Mahasiswa Pemula Programming</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card stat-card">
                <div class="stat-value">${chatGPTPercentage}%</div>
                <div class="stat-label">Pengguna ChatGPT</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card stat-card">
                <div class="stat-value">${pentingKarirMean}</div>
                <div class="stat-label">Rata-rata Pentingnya AI untuk Karir</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card stat-card">
                <div class="stat-value">${ketergantunganPercentage}%</div>
                <div class="stat-label">Khawatir Ketergantungan Berlebihan</div>
            </div>
        </div>
    `;
}

function updateInsights() {
    // Insight demografi
    const topSemester = Object.entries(processedData.semester)
        .sort((a, b) => b[1] - a[1])[0];
    const topGender = Object.entries(processedData.gender)
        .sort((a, b) => b[1] - a[1])[0];
    
    document.getElementById('insight-demografi').innerHTML = `
        <h6>📊 Insight Profil Responden</h6>
        <p class="mb-0">Mayoritas responden adalah mahasiswa semester ${topSemester[0]} (${((topSemester[1] / processedData.totalRespondents) * 100).toFixed(1)}%) dengan tingkat pengalaman programming pemula (${((processedData.experience['Pemula'] || 0) / processedData.totalRespondents * 100).toFixed(1)}%). Komposisi gender didominasi ${topGender[0].toLowerCase()} (${((topGender[1] / processedData.totalRespondents) * 100).toFixed(1)}%).</p>
    `;
    
    // Insight penggunaan
    const topTool = Object.entries(processedData.tools)[0];
    const topCourse = Object.entries(processedData.courses)[0];
    
    document.getElementById('insight-penggunaan').innerHTML = `
        <h6>🤖 Insight Pola Penggunaan</h6>
        <p class="mb-0">${topTool[0]} mendominasi sebagai tools AI paling populer (${((topTool[1] / processedData.totalRespondents) * 100).toFixed(1)}%). AI paling banyak digunakan untuk mata kuliah ${topCourse[0]} (${((topCourse[1] / processedData.totalRespondents) * 100).toFixed(1)}%).</p>
    `;
    
    // Insight dampak
    const highestImpact = Object.entries(processedData.numericStats)
        .sort((a, b) => b[1].mean - a[1].mean)[0];
    const lowestImpact = Object.entries(processedData.numericStats)
        .sort((a, b) => a[1].mean - b[1].mean)[0];
    
    const impactLabels = {
        'pemahaman_konsep': 'Pemahaman Konsep',
        'efisiensi_tugas': 'Efisiensi Tugas',
        'debugging_code': 'Debugging Code',
        'kreativitas': 'Kreativitas Problem-solving',
        'etika_penggunaan': 'Etika Penggunaan',
        'penting_karir': 'Penting untuk Karir'
    };
    
    document.getElementById('insight-dampak').innerHTML = `
        <h6>📈 Insight Dampak & Efektivitas</h6>
        <p class="mb-0">AI paling efektif untuk meningkatkan ${impactLabels[highestImpact[0]].toLowerCase()} (${highestImpact[1].mean.toFixed(2)}). ${impactLabels[lowestImpact[0]]} mendapatkan nilai dampak terendah (${lowestImpact[1].mean.toFixed(2)}).</p>
    `;
    
    // Insight etika
    const topConcern = Object.entries(processedData.concerns)[0];
    const topSkill = Object.entries(processedData.skills)[0];
    
    document.getElementById('insight-etika').innerHTML = `
        <h6>⚖️ Insight Etika & Kekhawatiran</h6>
        <p class="mb-0">${topConcern[0]} menjadi kekhawatiran utama (${((topConcern[1] / processedData.totalRespondents) * 100).toFixed(1)}%). Namun, mahasiswa tetap menyadari pentingnya ${topSkill[0].toLowerCase()} (${((topSkill[1] / processedData.totalRespondents) * 100).toFixed(1)}%) sebagai skill yang harus dikuasai tanpa bantuan AI.</p>
    `;
}

function updateStatisticsTable() {
    const tableBody = document.querySelector('#statistik-table tbody');
    const stats = processedData.numericStats;
    const labels = {
        'pemahaman_konsep': 'Pemahaman Konsep',
        'efisiensi_tugas': 'Efisiensi Tugas',
        'debugging_code': 'Debugging Code',
        'kreativitas': 'Kreativitas Problem-solving',
        'etika_penggunaan': 'Etika Penggunaan',
        'penting_karir': 'Penting untuk Karir'
    };
    
    tableBody.innerHTML = '';
    
    Object.entries(stats).forEach(([key, data]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${labels[key]}</td>
            <td>${data.mean.toFixed(2)}</td>
            <td>${data.median.toFixed(1)}</td>
            <td>${data.mode}</td>
            <td>${data.stdDev.toFixed(2)}</td>
            <td>${data.range}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Fungsi untuk merender semua chart
function renderAllCharts() {
    // Hancurkan chart yang sudah ada
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    
    charts = {};
    
    // Render semua chart
    charts.genderChart = renderGenderChart();
    charts.semesterChart = renderSemesterChart();
    charts.experienceChart = renderExperienceChart();
    charts.frequencyChart = renderFrequencyChart();
    charts.durationChart = renderDurationChart();
    charts.toolsChart = renderToolsChart();
    charts.coursesChart = renderCoursesChart();
    charts.radarChart = renderRadarChart();
    charts.comparisonChart = renderComparisonChart();
    charts.concernsChart = renderConcernsChart();
    charts.skillsChart = renderSkillsChart();
    charts.experienceToolsChart = renderExperienceToolsChart();
}

// Fungsi-fungsi render chart individual
function renderGenderChart() {
    const ctx = document.getElementById('genderChart').getContext('2d');
    const labels = Object.keys(processedData.gender);
    const data = Object.values(processedData.gender);
    
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [colors.primary, colors.pink],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function renderSemesterChart() {
    const ctx = document.getElementById('semesterChart').getContext('2d');
    const labels = Object.keys(processedData.semester);
    const data = Object.values(processedData.semester);
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Jumlah Mahasiswa',
                data: data,
                backgroundColor: colors.primary,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderExperienceChart() {
    const ctx = document.getElementById('experienceChart').getContext('2d');
    const labels = Object.keys(processedData.experience);
    const data = Object.values(processedData.experience);
    
    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [colors.primary, colors.secondary, colors.gray],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function renderFrequencyChart() {
    const ctx = document.getElementById('frequencyChart').getContext('2d');
    const labels = Object.keys(processedData.frequency);
    const data = Object.values(processedData.frequency);
    
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [colors.primary, colors.lightBlue, colors.secondary, colors.accent, colors.purple],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function renderDurationChart() {
    const ctx = document.getElementById('durationChart').getContext('2d');
    const labels = Object.keys(processedData.duration);
    const data = Object.values(processedData.duration);
    
    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [colors.primary, colors.lightBlue, colors.secondary, colors.accent],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function renderToolsChart() {
    const ctx = document.getElementById('toolsChart').getContext('2d');
    const labels = Object.keys(processedData.tools);
    const data = Object.values(processedData.tools);
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Jumlah Pengguna',
                data: data,
                backgroundColor: colors.primary,
                borderWidth: 0
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    max: processedData.totalRespondents
                }
            }
        }
    });
}

function renderCoursesChart() {
    const ctx = document.getElementById('coursesChart').getContext('2d');
    const labels = Object.keys(processedData.courses);
    const data = Object.values(processedData.courses);
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Jumlah Pengguna',
                data: data,
                backgroundColor: colors.secondary,
                borderWidth: 0
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    max: processedData.totalRespondents
                }
            }
        }
    });
}

function renderRadarChart() {
    const ctx = document.getElementById('radarChart').getContext('2d');
    const stats = processedData.numericStats;
    const labels = [
        'Pemahaman Konsep',
        'Efisiensi Tugas',
        'Debugging Code',
        'Kreativitas Problem-solving',
        'Etika Penggunaan',
        'Penting untuk Karir'
    ];
    const data = [
        stats.pemahaman_konsep.mean,
        stats.efisiensi_tugas.mean,
        stats.debugging_code.mean,
        stats.kreativitas.mean,
        stats.etika_penggunaan.mean,
        stats.penting_karir.mean
    ];
    
    return new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Rata-rata Skor (1-5)',
                data: data,
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                borderColor: colors.lightBlue,
                pointBackgroundColor: colors.lightBlue,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: colors.lightBlue
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function renderComparisonChart() {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    const stats = processedData.numericStats;
    const labels = [
        'Pemahaman Konsep',
        'Efisiensi Tugas',
        'Debugging Code',
        'Kreativitas Problem-solving',
        'Etika Penggunaan',
        'Penting untuk Karir'
    ];
    const meanData = [
        stats.pemahaman_konsep.mean,
        stats.efisiensi_tugas.mean,
        stats.debugging_code.mean,
        stats.kreativitas.mean,
        stats.etika_penggunaan.mean,
        stats.penting_karir.mean
    ];
    const modeData = [
        stats.pemahaman_konsep.mode,
        stats.efisiensi_tugas.mode,
        stats.debugging_code.mode,
        stats.kreativitas.mode,
        stats.etika_penggunaan.mode,
        stats.penting_karir.mode
    ];
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Mean',
                    data: meanData,
                    backgroundColor: colors.primary,
                    borderWidth: 0
                },
                {
                    label: 'Modus',
                    data: modeData,
                    backgroundColor: colors.accent,
                    borderWidth: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5
                }
            }
        }
    });
}

function renderConcernsChart() {
    const ctx = document.getElementById('concernsChart').getContext('2d');
    const labels = Object.keys(processedData.concerns);
    const data = Object.values(processedData.concerns);
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Jumlah Responden',
                data: data,
                backgroundColor: colors.primary,
                borderWidth: 0
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    max: processedData.totalRespondents
                }
            }
        }
    });
}

function renderSkillsChart() {
    const ctx = document.getElementById('skillsChart').getContext('2d');
    const labels = Object.keys(processedData.skills);
    const data = Object.values(processedData.skills);
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Jumlah Responden',
                data: data,
                backgroundColor: colors.secondary,
                borderWidth: 0
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    max: processedData.totalRespondents
                }
            }
        }
    });
}

function renderExperienceToolsChart() {
    const ctx = document.getElementById('experienceToolsChart').getContext('2d');
    const labels = Object.keys(processedData.experienceTools);
    const data = Object.values(processedData.experienceTools);
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Rata-rata Jumlah Tools AI yang Digunakan',
                data: data,
                backgroundColor: [colors.primary, colors.secondary],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: Math.max(...data) + 1
                }
            }
        }
    });
}

// Fungsi untuk download Excel
function downloadExcel() {
    if (!surveyData || !processedData) {
        alert('Data belum dimuat. Silakan refresh terlebih dahulu.');
        return;
    }
    
    // Data untuk Excel - Data Mentah
    const rawData = [
        ["DATA MENTAH - RESPONDEN SURVEI AI"],
        ["Timestamp", "Email", "Jenis Kelamin", "Semester", "Pengalaman Programming", "Frekuensi AI", "Durasi AI", "Tools AI", "Mata Kuliah", "Pemahaman Konsep", "Efisiensi Tugas", "Debugging", "Kreativitas", "Etika", "Kekhawatiran", "Skill Penting", "Penting Karir"]
    ];
    
    surveyData.responden.forEach(respondent => {
        rawData.push([
            respondent.timestamp,
            respondent.email,
            respondent.jenis_kelamin,
            respondent.semester,
            respondent.pengalaman_programming,
            respondent.frekuensi_penggunaan,
            respondent.durasi_penggunaan,
            respondent.tools_ai.join(", "),
            respondent.mata_kuliah.join(", "),
            respondent.pemahaman_konsep,
            respondent.efisiensi_tugas,
            respondent.debugging_code,
            respondent.kreativitas,
            respondent.etika_penggunaan,
            respondent.kekhawatiran.join(", "),
            respondent.skill_penting.join(", "),
            respondent.penting_karir
        ]);
    });
    
    // Data untuk Excel - Data Olahan
    const processedExcelData = generateProcessedExcelData();
    
    // Buat workbook
    const wb = XLSX.utils.book_new();
    
    // Tambahkan sheet data mentah
    const wsRaw = XLSX.utils.aoa_to_sheet(rawData);
    XLSX.utils.book_append_sheet(wb, wsRaw, "Data Mentah");
    
    // Tambahkan sheet data olahan
    const wsProcessed = XLSX.utils.aoa_to_sheet(processedExcelData);
    XLSX.utils.book_append_sheet(wb, wsProcessed, "Data Olahan");
    
    // Download file
    XLSX.writeFile(wb, `Analisis_AI_${surveyData.metadata.institusi.replace(/\s+/g, '_')}.xlsx`);
}

function generateProcessedExcelData() {
    const data = [
        ["ANALISIS STATISTIK DESKRIPTIF - HASIL OLAHAN"],
        [`${surveyData.metadata.judul}`],
        [`Total Responden: ${processedData.totalRespondents}`],
        [`Tanggal Survei: ${surveyData.metadata.tanggalSurvei}`],
        [""],
        ["PROFIL RESPONDEN"],
        ["Jenis Kelamin", "Jumlah", "Persentase"]
    ];
    
    // Data gender
    Object.entries(processedData.gender).forEach(([gender, count]) => {
        const percentage = ((count / processedData.totalRespondents) * 100).toFixed(1);
        data.push([gender, count, `${percentage}%`]);
    });
    
    data.push([""]);
    data.push(["Semester", "Jumlah", "Persentase"]);
    
    // Data semester
    Object.entries(processedData.semester).forEach(([semester, count]) => {
        const percentage = ((count / processedData.totalRespondents) * 100).toFixed(1);
        data.push([`Semester ${semester}`, count, `${percentage}%`]);
    });
    
    data.push([""]);
    data.push(["Pengalaman Programming", "Jumlah", "Persentase"]);
    
    // Data pengalaman
    Object.entries(processedData.experience).forEach(([experience, count]) => {
        const percentage = ((count / processedData.totalRespondents) * 100).toFixed(1);
        data.push([experience, count, `${percentage}%`]);
    });
    
    data.push([""]);
    data.push(["POLA PENGGUNAAN AI"]);
    data.push(["Frekuensi Penggunaan", "Jumlah", "Persentase"]);
    
    // Data frekuensi
    Object.entries(processedData.frequency).forEach(([frequency, count]) => {
        const percentage = ((count / processedData.totalRespondents) * 100).toFixed(1);
        data.push([frequency, count, `${percentage}%`]);
    });
    
    data.push([""]);
    data.push(["Durasi Penggunaan", "Jumlah", "Persentase"]);
    
    // Data durasi
    Object.entries(processedData.duration).forEach(([duration, count]) => {
        const percentage = ((count / processedData.totalRespondents) * 100).toFixed(1);
        data.push([duration, count, `${percentage}%`]);
    });
    
    data.push([""]);
    data.push(["TOP 5 TOOLS AI", "Jumlah Pengguna", "Persentase"]);
    
    // Data tools
    Object.entries(processedData.tools).forEach(([tool, count]) => {
        const percentage = ((count / processedData.totalRespondents) * 100).toFixed(1);
        data.push([tool, count, `${percentage}%`]);
    });
    
    data.push([""]);
    data.push(["TOP 5 MATA KULIAH", "Jumlah Pengguna", "Persentase"]);
    
    // Data mata kuliah
    Object.entries(processedData.courses).forEach(([course, count]) => {
        const percentage = ((count / processedData.totalRespondents) * 100).toFixed(1);
        data.push([course, count, `${percentage}%`]);
    });
    
    data.push([""]);
    data.push(["DAMPAK DAN EFEKTIVITAS AI (Skala 1-5)"]);
    data.push(["Aspek", "Mean", "Median", "Modus", "Std Dev", "Range"]);
    
    // Data statistik
    const statsLabels = {
        'pemahaman_konsep': 'Pemahaman Konsep',
        'efisiensi_tugas': 'Efisiensi Tugas',
        'debugging_code': 'Debugging Code',
        'kreativitas': 'Kreativitas Problem-solving',
        'etika_penggunaan': 'Etika Penggunaan',
        'penting_karir': 'Penting untuk Karir'
    };
    
    Object.entries(processedData.numericStats).forEach(([key, statData]) => {
        data.push([
            statsLabels[key],
            statData.mean.toFixed(2),
            statData.median.toFixed(1),
            statData.mode,
            statData.stdDev.toFixed(2),
            statData.range
        ]);
    });
    
    data.push([""]);
    data.push(["ETIKA DAN KEKHAWATIRAN"]);
    data.push(["TOP 5 KEKHAWATIRAN", "Jumlah", "Persentase"]);
    
    // Data kekhawatiran
    Object.entries(processedData.concerns).forEach(([concern, count]) => {
        const percentage = ((count / processedData.totalRespondents) * 100).toFixed(1);
        data.push([concern, count, `${percentage}%`]);
    });
    
    data.push([""]);
    data.push(["TOP 5 SKILL PENTING", "Jumlah", "Persentase"]);
    
    // Data skill
    Object.entries(processedData.skills).forEach(([skill, count]) => {
        const percentage = ((count / processedData.totalRespondents) * 100).toFixed(1);
        data.push([skill, count, `${percentage}%`]);
    });
    
    data.push([""]);
    data.push(["ANALISIS HUBUNGAN"]);
    data.push(["Pengalaman Programming", "Rata-rata Jumlah Tools AI"]);
    
    // Data hubungan
    Object.entries(processedData.experienceTools).forEach(([experience, avgTools]) => {
        data.push([experience, avgTools.toFixed(1)]);
    });
    
    data.push([""]);
    data.push(["KESIMPULAN UTAMA"]);
    data.push(["1. ChatGPT mendominasi sebagai tools AI paling populer"]);
    data.push(["2. AI paling efektif untuk meningkatkan efisiensi tugas"]);
    data.push(["3. Ketergantungan berlebihan menjadi kekhawatiran utama"]);
    data.push(["4. Berpikir kritis dianggap sebagai skill terpenting tanpa AI"]);
    data.push(["5. AI dianggap sangat penting untuk karir masa depan"]);
    
    return data;
}

// Load data saat halaman pertama kali dibuka
document.addEventListener('DOMContentLoaded', loadData);