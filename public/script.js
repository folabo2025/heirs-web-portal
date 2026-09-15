/**
 * HOPS Schools - Main Script, Grade Management, Slider & Course System
 * Connected to SQLite Backend API
 */

// --- Global Slider State Variables ---
let currentSlideIndex = 0;
let slideAutoInterval = null;

// --- 1. Grade Letter Helper ---
function getGradeLetter(score) {
    if (score >= 70) return { letter: 'A', class: 'grade-badge badge-a' };
    if (score >= 60) return { letter: 'B', class: 'grade-badge badge-b' };
    if (score >= 50) return { letter: 'C', class: 'grade-badge badge-c' };
    if (score >= 45) return { letter: 'D', class: 'grade-badge badge-d' };
    if (score >= 40) return { letter: 'E', class: 'grade-badge badge-e' };
    return { letter: 'F', class: 'grade-badge badge-f' };
}

// --- 2. Dynamic Table Row Calculator ---
function calculateRowTotal(row) {
    if (!row) return;

    const ca1Input = row.querySelector('.ca1-input');
    const ca2Input = row.querySelector('.ca2-input');
    const examInput = row.querySelector('.exam-input');

    const ca1 = ca1Input ? (parseFloat(ca1Input.value) || 0) : 0;
    const ca2 = ca2Input ? (parseFloat(ca2Input.value) || 0) : 0;
    const exam = examInput ? (parseFloat(examInput.value) || 0) : 0;

    const total = ca1 + ca2 + exam;
    const totalCell = row.querySelector('.total-cell');
    const gradeBadge = row.querySelector('.grade-badge');

    if (totalCell) totalCell.textContent = total;

    if (gradeBadge) {
        const gradeInfo = getGradeLetter(total);
        gradeBadge.textContent = gradeInfo.letter;
        gradeBadge.className = gradeInfo.class;
    }
}

// --- 3. Dynamic Enrolled Courses Loader for Student Dashboard ---
async function loadStudentEnrolledCourses() {
    const isStudentDashboard = document.getElementById('studentCoursesTable') || 
                               window.location.pathname.includes('student-dashboard') || 
                               window.location.pathname.includes('student-portal');

    if (!isStudentDashboard) return;

    const courseTableContainer = document.querySelector('#studentCoursesTable tbody') || document.querySelector('.student-table tbody');
    const welcomeHeader = document.querySelector('.welcome-text, #studentWelcomeHeader');

    let storedUser = {};
    try {
        storedUser = JSON.parse(sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser') || '{}');
    } catch (e) {
        storedUser = {};
    }

    const studentId = storedUser.id || storedUser.student_id || storedUser.idNumber || '';
    const studentName = storedUser.full_name || storedUser.fullName || storedUser.name || '';

    if (welcomeHeader && studentName) {
        welcomeHeader.innerHTML = `Welcome back, <strong>${studentName.toUpperCase()}</strong>! 👋`;
    }

    injectEnrollmentHeaderButton();

    if (!courseTableContainer || !studentId) return;

    try {
        const response = await fetch(`/api/student-courses?studentId=${encodeURIComponent(studentId)}`);
        const data = await response.json();

        if (data.success && Array.isArray(data.courses) && data.courses.length > 0) {
            courseTableContainer.innerHTML = '';

            data.courses.forEach(course => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${course.subject || course.subject_name}</strong></td>
                    <td><span style="font-weight:600; color:#555;">${course.code || course.subject_code || 'SUB101'}</span></td>
                    <td>${course.teacher || 'Subject Teacher'}</td>
                    <td><span class="badge ${course.status === 'Active' ? 'badge-success' : 'badge-secondary'}" style="background:#e8f5e9; color:#2e7d32; padding:4px 10px; border-radius:12px; font-weight:bold;">${course.status || 'Active'}</span></td>
                `;
                courseTableContainer.appendChild(tr);
            });
        }
    } catch (err) {
        console.warn("Error fetching enrolled courses dynamically from server:", err);
    }
}

function injectEnrollmentHeaderButton() {
    const isStudentDashboard = document.getElementById('studentCoursesTable') || 
                               window.location.pathname.includes('student-dashboard') || 
                               window.location.pathname.includes('student-portal');

    if (!isStudentDashboard) return;

    let container = document.querySelector('#studentCoursesTable') || document.querySelector('.student-table');
    if (!container) return;

    let existingBtn = document.getElementById('autoInjectEnrolBtn');
    if (!existingBtn) {
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; margin-top:10px;';
        btnContainer.innerHTML = `
            <h3 style="margin:0; color:#1a237e; font-size:1.2rem;">Registered Courses</h3>
            <button id="autoInjectEnrolBtn" onclick="openEnrollmentModal()" style="background:#1a237e; color:#fff; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.9rem; display:flex; align-items:center; gap:6px; box-shadow:0 2px 6px rgba(0,0,0,0.15);">
                <span style="font-size:1.1rem;">+</span> Register / Enrol Subjects
            </button>
        `;
        container.parentNode.insertBefore(btnContainer, container);
    }
}

// --- 4. Student Subject Enrollment Engine & Modal System ---
async function openEnrollmentModal() {
    let storedUser = {};
    try {
        storedUser = JSON.parse(sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser') || '{}');
    } catch (e) {
        storedUser = {};
    }

    const studentId = storedUser.id || storedUser.student_id || storedUser.idNumber || '';
    const userClass = storedUser.className || storedUser.class || 'SS 2';

    if (!studentId) {
        alert("Please log in to register subjects.");
        return;
    }

    let modal = document.getElementById('enrollmentModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'enrollmentModal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:9999;';
        modal.innerHTML = `
            <div style="background:#fff; width:90%; max-width:550px; border-radius:10px; padding:25px; box-shadow:0 10px 25px rgba(0,0,0,0.2); max-height:85vh; overflow-y:auto; position:relative;">
                <h3 style="margin-top:0; color:#1a237e;">Enrol Subjects</h3>
                <p style="font-size:0.9rem; color:#666;">Select the subjects you wish to register for your current term (${userClass}):</p>
                <div id="enrollmentSubjectsList" style="margin:20px 0; max-height:300px; overflow-y:auto; border:1px solid #ddd; padding:10px; border-radius:6px;">
                    Loading available curriculum subjects...
                </div>
                <div style="display:flex; justify-content:flex-end; gap:10px;">
                    <button id="closeEnrollModalBtn" style="padding:8px 16px; border:none; background:#ccc; border-radius:4px; cursor:pointer;">Cancel</button>
                    <button id="submitEnrollmentBtn" style="padding:8px 16px; border:none; background:#1a237e; color:#fff; border-radius:4px; cursor:pointer; font-weight:bold;">Confirm & Enrol</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('closeEnrollModalBtn').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        document.getElementById('submitEnrollmentBtn').addEventListener('click', () => {
            submitSubjectEnrollment(studentId);
        });
    }

    modal.style.display = 'flex';
    fetchAvailableSubjects(studentId, userClass);
}

async function fetchAvailableSubjects(studentId, userClass) {
    const listContainer = document.getElementById('enrollmentSubjectsList');
    if (!listContainer) return;

    try {
        const [availableRes, enrolledRes] = await Promise.all([
            fetch(`/api/available-subjects?class=${encodeURIComponent(userClass)}`),
            fetch(`/api/student-courses?studentId=${encodeURIComponent(studentId)}`)
        ]);

        const availableData = await availableRes.json();
        const enrolledData = await enrolledRes.json();

        let availableSubjects = availableData.success ? availableData.subjects : [];
        let currentlyEnrolled = enrolledData.success ? enrolledData.courses.map(c => c.subject || c.subject_name) : [];

        if (!availableSubjects || availableSubjects.length === 0) {
            availableSubjects = [
                { subject_name: 'Coding & Web Development', subject_code: 'COD201' },
                { subject_name: 'Computer Science / Data Processing', subject_code: 'ICT202' },
                { subject_name: 'Mathematics', subject_code: 'MTH201' },
                { subject_name: 'English Language', subject_code: 'ENG201' },
                { subject_name: 'Civic Education', subject_code: 'CVE201' },
                { subject_name: 'Physics', subject_code: 'PHY201' },
                { subject_name: 'Chemistry', subject_code: 'CHM201' },
                { subject_name: 'Biology', subject_code: 'BIO201' },
                { subject_name: 'Agricultural Science', subject_code: 'AGR201' },
                { subject_name: 'Economics', subject_code: 'ECO201' }
            ];
        }

        listContainer.innerHTML = '';
        availableSubjects.forEach(sub => {
            const isChecked = currentlyEnrolled.includes(sub.subject_name);
            const itemDiv = document.createElement('div');
            itemDiv.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding:8px 5px; border-bottom:1px solid #eee;';
            itemDiv.innerHTML = `
                <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:500; font-size:0.95rem; width:100%;">
                    <input type="checkbox" class="subject-enroll-checkbox" value="${sub.subject_name}" data-code="${sub.subject_code || ''}" ${isChecked ? 'checked' : ''}>
                    <span>${sub.subject_name}</span>
                </label>
                <span style="font-size:0.8rem; color:#888; font-weight:bold;">${sub.subject_code || ''}</span>
            `;
            listContainer.appendChild(itemDiv);
        });

    } catch (err) {
        console.warn("Fallback subject list activated due to API connection state:", err);
        listContainer.innerHTML = `<p style="color:#d32f2f;">Unable to fetch dynamic server curriculum. Please try again shortly.</p>`;
    }
}

async function submitSubjectEnrollment(studentId) {
    const checkboxes = document.querySelectorAll('.subject-enroll-checkbox:checked');
    const selectedSubjects = Array.from(checkboxes).map(cb => ({
        subject_name: cb.value,
        subject_code: cb.getAttribute('data-code')
    }));

    if (selectedSubjects.length === 0) {
        alert("Please select at least one subject to enrol.");
        return;
    }

    try {
        const response = await fetch('/api/enrol-subjects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId: studentId,
                subjects: selectedSubjects
            })
        });

        const result = await response.json();
        if (result.success) {
            alert("Subjects registered and saved successfully!");
            document.getElementById('enrollmentModal').style.display = 'none';
            loadStudentEnrolledCourses();
        } else {
            alert(`Enrollment failed: ${result.message || 'Error occurred'}`);
        }
    } catch (err) {
        console.error("Enrollment POST error:", err);
        alert("Network error: Could not complete subject registration.");
    }
}

function setupEnrollmentButtonListeners() {
    document.addEventListener('click', (e) => {
        const target = e.target.closest('button, a, .btn');
        if (!target) return;

        const label = target.textContent.trim().toLowerCase();
        if (label.includes('enrol') || label.includes('enroll') || label.includes('register subject')) {
            e.preventDefault();
            openEnrollmentModal();
        }
    });
}

// --- 5. Async Roster & Grade Loader from Database ---
async function loadGradingSheetData() {
    const tableBody = document.getElementById('gradingTableBody');
    if (!tableBody) return;

    const urlParams = new URLSearchParams(window.location.search);
    const rawClass = urlParams.get('class');
    const rawSubject = urlParams.get('subject');

    const selectedClass = rawClass ? decodeURIComponent(rawClass) : 'SS 2';
    const selectedSubject = rawSubject ? decodeURIComponent(rawSubject) : 'Coding';

    const classDisplay = document.getElementById('displayClass') || document.querySelector('.class-title');
    const subjectDisplay = document.getElementById('displaySubject') || document.querySelector('.subject-title');

    if (classDisplay) classDisplay.textContent = selectedClass;
    if (subjectDisplay) subjectDisplay.textContent = selectedSubject;

    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color: #1a237e;">Fetching database records for <strong>${selectedClass}</strong>...</td></tr>`;

    try {
        const studentsResponse = await fetch(`/api/students-by-class?class=${encodeURIComponent(selectedClass)}`);
        const studentsData = await studentsResponse.json();

        if (!studentsData.success || !studentsData.students || studentsData.students.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color: #888;">No registered students found in database for class: <strong>${selectedClass}</strong>.</td></tr>`;
            return;
        }

        const students = studentsData.students;

        let savedGradesMap = {};
        try {
            const gradesResponse = await fetch(`/api/grades?className=${encodeURIComponent(selectedClass)}&subject=${encodeURIComponent(selectedSubject)}`);
            const gradesData = await gradesResponse.json();
            if (gradesData.success && Array.isArray(gradesData.grades)) {
                gradesData.grades.forEach(g => {
                    savedGradesMap[g.student_id] = g;
                });
            }
        } catch (err) {
            console.warn("No saved grades found or API error, defaulting to zero scores.");
        }

        tableBody.innerHTML = '';

        students.forEach((student, index) => {
            const savedScore = savedGradesMap[student.student_id] || {};

            const ca1 = savedScore.ca1 !== undefined ? savedScore.ca1 : 0;
            const ca2 = savedScore.ca2 !== undefined ? savedScore.ca2 : 0;
            const exam = savedScore.exam !== undefined ? savedScore.exam : 0;
            const total = ca1 + ca2 + exam;
            const gradeInfo = getGradeLetter(total);

            const row = document.createElement('tr');
            row.setAttribute('data-student-id', student.student_id);
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>
                    <strong>${student.full_name}</strong><br>
                    <small style="color:#777;">${student.student_id}</small>
                </td>
                <td><input type="number" class="score-input ca1-input" min="0" max="15" value="${ca1}" oninput="calculateRowTotal(this.closest('tr'))"></td>
                <td><input type="number" class="score-input ca2-input" min="0" max="15" value="${ca2}" oninput="calculateRowTotal(this.closest('tr'))"></td>
                <td><input type="number" class="score-input exam-input" min="0" max="70" value="${exam}" oninput="calculateRowTotal(this.closest('tr'))"></td>
                <td class="total-cell" style="font-weight: bold; color: #1a237e;">${total}</td>
                <td><span class="${gradeInfo.class}">${gradeInfo.letter}</span></td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error connecting to server:", error);
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color: #d32f2f;">Failed to connect to backend server. Ensure node server is running.</td></tr>`;
    }
}

// --- 6. Async Save Grades to Backend ---
async function saveGradingSheet() {
    const urlParams = new URLSearchParams(window.location.search);
    const rawClass = urlParams.get('class');
    const rawSubject = urlParams.get('subject');
    const selectedClass = rawClass ? decodeURIComponent(rawClass) : 'SS 2';
    const selectedSubject = rawSubject ? decodeURIComponent(rawSubject) : 'Coding';

    const rows = document.querySelectorAll('#gradingTableBody tr');
    const gradesPayload = [];

    rows.forEach(row => {
        const studentId = row.getAttribute('data-student-id');
        if (!studentId) return;

        const ca1 = parseFloat(row.querySelector('.ca1-input').value) || 0;
        const ca2 = parseFloat(row.querySelector('.ca2-input').value) || 0;
        const exam = parseFloat(row.querySelector('.exam-input').value) || 0;
        const total = ca1 + ca2 + exam;
        const gradeLetter = getGradeLetter(total).letter;

        gradesPayload.push({
            studentId: studentId,
            ca1: ca1,
            ca2: ca2,
            exam: exam,
            total: total,
            grade: gradeLetter
        });
    });

    try {
        const response = await fetch('/api/save-grades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                className: selectedClass,
                subject: selectedSubject,
                grades: gradesPayload
            })
        });

        const result = await response.json();
        if (result.success) {
            alert(`Grades saved successfully to database for ${selectedClass} - ${selectedSubject}!`);
        } else {
            alert(`Error saving grades: ${result.message}`);
        }
    } catch (err) {
        console.error("Server save error:", err);
        alert("Failed to communicate with server. Please check node terminal.");
    }
}

// --- 7. CSV Download Handler ---
function downloadCSVTemplate() {
    const urlParams = new URLSearchParams(window.location.search);
    const rawClass = urlParams.get('class');
    const rawSubject = urlParams.get('subject');
    const selectedClass = rawClass ? decodeURIComponent(rawClass) : 'SS 2';
    const selectedSubject = rawSubject ? decodeURIComponent(rawSubject) : 'Coding';

    const rows = document.querySelectorAll('#gradingTableBody tr');
    let csvContent = "Student ID,Student Name,1st CA (15),2nd CA (15),Exam (70)\n";

    if (rows.length > 0) {
        rows.forEach(row => {
            const studentId = row.getAttribute('data-student-id') || '';
            const nameElement = row.querySelector('strong');
            if (!nameElement) return;

            const name = nameElement.textContent.replace(/,/g, '').trim(); 
            const ca1Input = row.querySelector('.ca1-input');
            const ca2Input = row.querySelector('.ca2-input');
            const examInput = row.querySelector('.exam-input');

            const ca1 = ca1Input ? ca1Input.value : 0;
            const ca2 = ca2Input ? ca2Input.value : 0;
            const exam = examInput ? examInput.value : 0;

            csvContent += `"${studentId}","${name}",${ca1},${ca2},${exam}\n`;
        });
    } else {
        csvContent += `"HOPS/ST/001","ADONU ANSLEM",0,0,0\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedClass}_${selectedSubject}_GradeSheet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- 8. Robust CSV File Import & Parser ---
function handleCSVImport(event) {
    const file = event.target ? event.target.files[0] : event;
    if (!file || !(file instanceof File)) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        const lines = text.split(/\r\n|\n/).map(l => l.trim()).filter(l => l.length > 0);

        if (lines.length < 2) {
            alert("The uploaded CSV file is empty or missing data rows.");
            return;
        }

        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, '').trim());
        
        let idIndex = headers.findIndex(h => h.includes('student id') || h.includes('id') || h.includes('reg') || h.includes('admission'));
        let ca1Index = headers.findIndex(h => h.includes('1st ca') || h.includes('ca1') || h.includes('ca 1'));
        let ca2Index = headers.findIndex(h => h.includes('2nd ca') || h.includes('ca2') || h.includes('ca 2'));
        let examIndex = headers.findIndex(h => h.includes('exam'));

        if (idIndex === -1) idIndex = 0;
        if (ca1Index === -1) ca1Index = 2;
        if (ca2Index === -1) ca2Index = 3;
        if (examIndex === -1) examIndex = 4;

        const importedMap = {};

        for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]);
            if (cols.length < 3) continue;

            const rawId = cols[idIndex] ? cols[idIndex].replace(/['"]/g, '').trim() : '';
            const ca1Val = parseFloat(cols[ca1Index]);
            const ca2Val = parseFloat(cols[ca2Index]);
            const examVal = parseFloat(cols[examIndex]);

            if (rawId) {
                importedMap[rawId.toLowerCase()] = {
                    ca1: isNaN(ca1Val) ? 0 : Math.min(15, Math.max(0, ca1Val)),
                    ca2: isNaN(ca2Val) ? 0 : Math.min(15, Math.max(0, ca2Val)),
                    exam: isNaN(examVal) ? 0 : Math.min(70, Math.max(0, examVal))
                };
            }
        }

        const rows = document.querySelectorAll('#gradingTableBody tr');
        let updateCount = 0;

        rows.forEach(row => {
            const studentId = row.getAttribute('data-student-id');
            if (studentId) {
                const cleanId = studentId.replace(/['"]/g, '').trim().toLowerCase();
                if (importedMap.hasOwnProperty(cleanId)) {
                    const data = importedMap[cleanId];
                    
                    const ca1Field = row.querySelector('.ca1-input');
                    const ca2Field = row.querySelector('.ca2-input');
                    const examField = row.querySelector('.exam-input');

                    if (ca1Field) ca1Field.value = data.ca1;
                    if (ca2Field) ca2Field.value = data.ca2;
                    if (examField) examField.value = data.exam;

                    calculateRowTotal(row);
                    updateCount++;
                }
            }
        });

        if (event.target) event.target.value = '';

        if (updateCount > 0) {
            alert(`Successfully imported scores for ${updateCount} matching students! Click "Save & Upload Grades" to push to database.`);
        } else {
            alert("No matching Student IDs found in the imported file. Ensure the ID column matches format HOPS/ST/001.");
        }
    };
    reader.readAsText(file);
}

function parseCSVLine(line) {
    const result = [];
    let insideQuote = false;
    let entry = '';

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
            result.push(entry.trim());
            entry = '';
        } else {
            entry += char;
        }
    }
    result.push(entry.trim());
    return result;
}

// --- 9. Dynamic Event Listener Setup for CSV Buttons ---
function setupCSVButtonListeners() {
    let hiddenFileInput = document.getElementById('csvFileInput');
    if (!hiddenFileInput) {
        hiddenFileInput = document.createElement('input');
        hiddenFileInput.type = 'file';
        hiddenFileInput.id = 'csvFileInput';
        hiddenFileInput.accept = '.csv';
        hiddenFileInput.style.display = 'none';
        document.body.appendChild(hiddenFileInput);

        hiddenFileInput.addEventListener('change', handleCSVImport);
    }

    document.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('button, a, .btn');
        if (!targetBtn) return;

        const btnText = targetBtn.textContent.trim().toLowerCase();

        if (btnText.includes('import csv')) {
            e.preventDefault();
            hiddenFileInput.click();
        } else if (btnText.includes('download csv')) {
            e.preventDefault();
            downloadCSVTemplate();
        }
    });
}

// --- 10. Sidebar Menu Controls ---
function toggleMenu() {
    const sideMenu = document.getElementById('sideMenu');
    const overlay = document.getElementById('overlay');
    const menuIcon = document.getElementById('menuIcon');

    if (!sideMenu || !overlay) return;

    sideMenu.classList.toggle('active');
    overlay.classList.toggle('active');

    if (menuIcon) {
        if (sideMenu.classList.contains('active')) {
            menuIcon.innerHTML = "✕";
            menuIcon.classList.add('open'); 
        } else {
            menuIcon.innerHTML = "☰";
            menuIcon.classList.remove('open');
        }
    }
}

// --- 11. Hero Image Slider (Supports Arrows & Dot Controls) ---
function changeSlide(target) {
    const slides = document.querySelectorAll('.slides .slide');
    const dots = document.querySelectorAll('.slider-dots .dot');
    if (!slides || slides.length === 0) return;

    // Remove active class from existing active slide and dot
    slides[currentSlideIndex].classList.remove('active');
    if (dots.length > currentSlideIndex) {
        dots[currentSlideIndex].classList.remove('active');
    }

    // Calculate target slide index
    if (target === 'next') {
        currentSlideIndex = (currentSlideIndex + 1) % slides.length;
    } else if (target === 'prev') {
        currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
    } else if (typeof target === 'number') {
        currentSlideIndex = target;
    }

    // Set new active slide and dot
    slides[currentSlideIndex].classList.add('active');
    if (dots.length > currentSlideIndex) {
        dots[currentSlideIndex].classList.add('active');
    }

    resetSlideTimer();
}

function resetSlideTimer() {
    if (slideAutoInterval) {
        clearInterval(slideAutoInterval);
    }
    slideAutoInterval = setInterval(() => {
        changeSlide('next');
    }, 10000);
}

function initHeroSlider() {
    const slides = document.querySelectorAll('.slides .slide');
    if (!slides || slides.length === 0) return;

    currentSlideIndex = 0;

    // Direct targeting for HTML elements (#prevSlide & #nextSlide)
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            changeSlide('prev');
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            changeSlide('next');
        });
    }

    // Indicator Dot Click Delegation
    const dotsContainer = document.getElementById('sliderDots') || document.querySelector('.slider-dots');
    if (dotsContainer) {
        dotsContainer.addEventListener('click', (e) => {
            const dot = e.target.closest('.dot');
            if (dot && dot.hasAttribute('data-index')) {
                const targetIdx = parseInt(dot.getAttribute('data-index'), 10);
                changeSlide(targetIdx);
            }
        });
    }

    // Start 10-second automatic transition cycle
    resetSlideTimer();
}

// --- 12. Temporary Session Comment Logic ---
function initCommentSection() {
    const commentForm = document.getElementById('commentForm');
    const commentInput = document.getElementById('commentInput');
    const commentsContainer = document.getElementById('commentsContainer');

    if (!commentForm || !commentInput || !commentsContainer) return;

    const sessionComments = JSON.parse(sessionStorage.getItem('tempSessionComments') || '[]');
    
    function renderComments() {
        commentsContainer.innerHTML = '';
        if (sessionComments.length === 0) {
            commentsContainer.innerHTML = `<p style="color:#888; font-style:italic;">No comments yet in this session.</p>`;
            return;
        }

        sessionComments.forEach(comment => {
            const commentCard = document.createElement('div');
            commentCard.className = 'comment-card';
            commentCard.style.cssText = 'background:#f9f9f9; border-left:4px solid #1a237e; padding:10px 14px; margin-bottom:10px; border-radius:4px;';
            commentCard.innerHTML = `
                <div style="font-weight:bold; color:#1a237e; font-size:0.85rem; margin-bottom:4px;">${comment.author} <span style="font-weight:normal; color:#888; font-size:0.75rem;">• ${comment.time}</span></div>
                <div style="font-size:0.95rem; color:#333;">${comment.text}</div>
            `;
            commentsContainer.appendChild(commentCard);
        });
    }

    renderComments();

    commentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = commentInput.value.trim();
        if (!text) return;

        let currentUser = {};
        try {
            currentUser = JSON.parse(sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser') || '{}');
        } catch (err) {
            currentUser = {};
        }

        const authorName = currentUser.full_name || currentUser.fullName || currentUser.name || 'Anonymous User';
        const newComment = {
            author: authorName,
            text: text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        sessionComments.unshift(newComment);
        sessionStorage.setItem('tempSessionComments', JSON.stringify(sessionComments));
        commentInput.value = '';
        renderComments();
    });
}

// --- 13. System Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.addEventListener('click', toggleMenu);
    }

    initHeroSlider();
    initCommentSection();

    if (document.getElementById('studentCoursesTable') || window.location.pathname.includes('student-dashboard') || window.location.pathname.includes('student-portal')) {
        loadStudentEnrolledCourses();
        setupEnrollmentButtonListeners();
    }

    if (document.getElementById('gradingTableBody')) {
        loadGradingSheetData();
        setupCSVButtonListeners();
    }
});