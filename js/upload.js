// upload.js (S3 version, with console logs instead of showToast)

import { db } from './firebase.js';
import { getCurrentUser, isCurrentUserAdmin } from './auth.js';
import {
  collection,
  addDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/* -------------------- S3 CONFIG -------------------- */
// IMPORTANT: Replace these with your actual AWS credentials
// For production, these should be loaded from environment variables or a secure config service
const AWS_REGION = 'eu-north-1';
const S3_BUCKET = 'btech-verse';
const AWS_ACCESS_KEY_ID = 'YOUR_AWS_ACCESS_KEY_ID_HERE';
const AWS_SECRET_ACCESS_KEY = 'YOUR_AWS_SECRET_ACCESS_KEY_HERE';

// Configure AWS SDK v2 (global AWS object comes from the <script> in HTML)
if (!window.AWS) {
  console.error('AWS SDK not found on window. Did you include the <script> in upload.html?');
}
AWS.config.update({
  region: AWS_REGION,
  credentials: new AWS.Credentials({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  })
});

// Create S3 client
const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  params: { Bucket: S3_BUCKET }
});

/* -------------------- Page init -------------------- */
document.addEventListener('DOMContentLoaded', async function () {
  const uploadForm = document.getElementById('uploadForm');
  if (uploadForm) {
    uploadForm.addEventListener('submit', handleUpload);
  }
});

/* -------------------- Upload handler -------------------- */
async function handleUpload(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const title = (formData.get('title') || '').trim();
  const branches = formData.getAll('branch');
  const category = formData.get('category');
  const subject = (formData.get('subject') || '').trim();
  const creditName = (formData.get('creditName') || '').trim();
  const file = formData.get('file');

  // Validation
  if (!title || branches.length === 0 || !category || !file) {
    console.log(title, branches, category, subject, file);
    console.error('❌ Validation failed: Missing required fields');
    return;
  }

  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    console.error('❌ File size must be less than 50MB');
    return;
  }

  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint'
  ];
  if (!allowedTypes.includes(file.type)) {
    console.error('❌ Invalid file type:', file.type);
    return;
  }

  try {
    showUploadProgress();

    const results = [];
    for (const branch of branches) {
      const resourceData = {
        title,
        branch,
        category,
        subject,
        creditName: creditName || null,
        downloadCount: 0,
        isActive: true
      };

      const result = await uploadSingleFileToS3(file, resourceData);
      results.push(result);
    }

    hideUploadProgress();
    console.log('✅ Resources uploaded successfully:', results);

    event.target.reset();
    hideFileInfo();

    setTimeout(() => {
      console.log('ℹ️ Redirecting to resources.html');
      window.location.href = 'resources.html';
    }, 1500);
  } catch (error) {
    console.error('❌ Upload failed:', error);
    hideUploadProgress();
  }
}

/* -------------------- Core S3 upload -------------------- */
function uploadSingleFileToS3(file, data) {
  console.log('[S3] Starting upload for:', file.name);

  const timestamp = Date.now();
  const ext = file.name.includes('.') ? file.name.split('.').pop() : '';
  const safeTitle = (data.title || 'file').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `${timestamp}_${safeTitle}.${ext}`;
  const s3Key = `resources/${data.branch}/${data.category}/${fileName}`;

  console.log('[S3] Bucket:', S3_BUCKET, '| Key:', s3Key);

  const params = {
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: file,
    ContentType: file.type,
  };

  return new Promise((resolve, reject) => {
    const managed = s3.upload(params);

    managed.on('httpUploadProgress', (evt) => {
      if (evt && evt.total) {
        const pct = (evt.loaded / evt.total) * 100;
        console.log(`[S3] Upload progress: ${pct.toFixed(2)}%`);
        updateUploadProgress(pct);
      }
    });

    managed.send(async (err, dataResult) => {
      if (err) {
        console.error('[S3] ❌ Upload failed:', err);
        reject(err);
        return;
      }

      console.log('[S3] ✅ Upload success. Location:', dataResult?.Location);

      const fileURL = dataResult.Location;
      const user = getCurrentUser();

      const resourceDoc = {
        ...data,
        fileURL,
        fileName,
        fileSize: file.size,
        fileType: file.type,
        uploadedBy: user?.uid || null,
        uploaderEmail: user?.email || null,
        timestamp: serverTimestamp()
      };

      try {
        const docRef = await addDoc(collection(db, 'resources'), resourceDoc);
        console.log('[Firestore] ✅ Saved metadata. Doc ID:', docRef.id);
        resolve({ id: docRef.id, ...resourceDoc });
      } catch (firestoreErr) {
        console.error('[Firestore] ❌ Failed to save metadata:', firestoreErr);
        reject(firestoreErr);
      }
    });
  });
}

/* -------------------- UI helpers -------------------- */
function showUploadProgress() {
  const submitBtn = document.getElementById('submitBtn');
  const submitBtnText = document.getElementById('submitBtnText');
  const submitSpinner = document.getElementById('submitSpinner');
  const progressDiv = document.getElementById('uploadProgress');

  if (submitBtn) submitBtn.disabled = true;
  if (submitBtnText) submitBtnText.classList.add('hidden');
  if (submitSpinner) submitSpinner.classList.remove('hidden');
  if (progressDiv) progressDiv.classList.remove('hidden');
}

function hideUploadProgress() {
  const submitBtn = document.getElementById('submitBtn');
  const submitBtnText = document.getElementById('submitBtnText');
  const submitSpinner = document.getElementById('submitSpinner');
  const progressDiv = document.getElementById('uploadProgress');

  if (submitBtn) submitBtn.disabled = false;
  if (submitBtnText) submitBtnText.classList.remove('hidden');
  if (submitSpinner) submitSpinner.classList.add('hidden');
  if (progressDiv) progressDiv.classList.add('hidden');
}

function updateUploadProgress(progress) {
  const progressBar = document.getElementById('progressBar');
  const progressPercent = document.getElementById('progressPercent');
  if (progressBar) progressBar.style.width = progress + '%';
  if (progressPercent) progressPercent.textContent = Math.round(progress) + '%';
}

function hideFileInfo() {
  const fileInfo = document.getElementById('fileInfo');
  if (fileInfo) fileInfo.classList.add('hidden');
}

/* -------------------- Batch upload -------------------- */
export async function batchUpload(files, commonData) {
  if (!isCurrentUserAdmin()) {
    throw new Error('Only administrators can upload resources');
  }
  const results = [];
  for (const file of files) {
    try {
      const res = await uploadSingleFileToS3(file, commonData);
      results.push({ success: true, file: file.name, result: res });
    } catch (e) {
      results.push({ success: false, file: file.name, error: e?.message || String(e) });
    }
  }
  return results;
}

export { handleUpload };
