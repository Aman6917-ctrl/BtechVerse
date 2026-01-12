import { db } from './firebase.js';
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Document path for global counters
const countersDocRef = doc(db, 'meta', 'counters');

async function ensureCountersDoc() {
    const snap = await getDoc(countersDocRef);
    if (!snap.exists()) {
        await setDoc(countersDocRef, { students: 0, createdAt: Date.now() });
    }
}

async function incrementStudentsOncePerBrowser() {
    try {
        await ensureCountersDoc();
        const key = 'btechverse_students_incremented_v1';
        if (localStorage.getItem(key)) return;
        await updateDoc(countersDocRef, { students: increment(1) });
        localStorage.setItem(key, '1');
    } catch (err) {
        // If updateDoc fails because doc missing (race), create and retry once
        try {
            await setDoc(countersDocRef, { students: increment(1) }, { merge: true });
            localStorage.setItem('btechverse_students_incremented_v1', '1');
        } catch (e) {
            console.warn('Students counter update skipped:', e?.message || e);
        }
    }
}

function formatNumber(n) {
    const num = Number(n) || 0;
    if (num < 1000) return String(num);
    if (num < 10000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    if (num < 1000000) return Math.round(num / 1000) + 'k';
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
}

function startLiveStudentsCount() {
    const el = document.getElementById('studentsCount');
    if (!el) return;
    onSnapshot(countersDocRef, (snap) => {
        const data = snap.data() || { students: 0 };
        el.textContent = formatNumber(data.students);
    }, (err) => {
        console.warn('Live counter error:', err?.message || err);
    });
}

// Kick off
incrementStudentsOncePerBrowser();
startLiveStudentsCount();


