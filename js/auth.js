// Authentication module
import { auth, db } from './firebase.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    doc, 
    setDoc, 
    getDoc,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Admin email list (in production, this would be stored securely)
const ADMIN_EMAILS = [
    'admin@btechverse.com',
    'admin@example.com',
    'test@example.com',  // Temporary for testing
    'user@test.com',     // Add more admin emails as needed
    'amanvverma109@gmail.com'  // Added admin user
];

// Current user state
let currentUser = null;

// Initialize authentication state listener
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    updateAuthUI(user);
    
    // Dispatch custom event for other modules
    window.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { user: user }
    }));
    
    if (user) {
        // Store user data in localStorage for quick access
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            isAdmin: isAdmin(user.email)
        };
        localStorage.setItem('user', JSON.stringify(userData));
    } else {
        localStorage.removeItem('user');
    }
});

// Sign up function
export async function signUp(email, password, fullName, branch) {
    try {
        console.log('Starting signup process for:', email);
        showAuthLoading('signup');
        
        // Add timeout to prevent infinite loading
        const signupPromise = createUserWithEmailAndPassword(auth, email, password);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout - Firebase may not be configured')), 10000)
        );
        
        // Create user account with timeout
        const userCredential = await Promise.race([signupPromise, timeoutPromise]);
        const user = userCredential.user;
        
        // Update user profile
        await updateProfile(user, {
            displayName: fullName
        });
        
        // Save additional user data to Firestore
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: email,
            displayName: fullName,
            branch: branch,
            createdAt: serverTimestamp(),
            isAdmin: isAdmin(email)
        });
        
        showToast('Account created successfully! Welcome to BTechVerse!', 'success');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('Sign up error:', error);
        hideAuthLoading('signup');
        
        // Handle specific authentication configuration errors
        let errorMsg = getErrorMessage(error.code);
        if (error.code === 'auth/configuration-not-found') {
            errorMsg = 'Firebase Authentication is not enabled. Please enable Email/Password authentication in Firebase Console.';
            console.error('Firebase Config Error: Authentication not enabled in Firebase Console');
        } else if (error.message && error.message.includes('timeout')) {
            errorMsg = 'Request timeout. Firebase Authentication may not be properly configured. Please check Firebase Console.';
            console.error('Firebase Timeout: Authentication service may not be enabled');
        }
        
        showAuthError('signup', errorMsg);
        showToast('Account creation failed: ' + errorMsg, 'error');
    }
}

// Sign in function
export async function signIn(email, password) {
    try {
        showAuthLoading('login');
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        showToast('Welcome back!', 'success');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Sign in error:', error);
        hideAuthLoading('login');
        
        // Handle specific authentication configuration errors
        let errorMsg = getErrorMessage(error.code);
        if (error.code === 'auth/configuration-not-found') {
            errorMsg = 'Firebase Authentication is not enabled. Please enable Email/Password authentication in Firebase Console.';
            console.error('Firebase Config Error: Authentication not enabled in Firebase Console');
        }
        
        showAuthError('login', errorMsg);
        showToast('Login failed: ' + errorMsg, 'error');
    }
}

// Sign out function
export async function signOutUser() {
    try {
        await signOut(auth);
        showToast('Signed out successfully', 'success');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Sign out error:', error);
        showToast('Error signing out', 'error');
    }
}

// Get current user
export function getCurrentUser() {
    return currentUser;
}

// Check if user is admin
export function isAdmin(email) {
    return ADMIN_EMAILS.includes(email?.toLowerCase());
}

const adminEmails = [
  'vetmaa286@gmail.com',
  'amanvverma109@gmail.com'
];

export function isCurrentUserAdmin() {
  const user = getCurrentUser();
  return user && adminEmails.includes(user.email);
}

// Get user data from Firestore
export async function getUserData(uid) {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

// Update authentication UI
function updateAuthUI(user) {
    const authButtons = document.getElementById('authButtons');
    const userSection = document.getElementById('userSection');
    const userName = document.getElementById('userName');
    const adminPanel = document.getElementById('adminPanel');
    
    if (user) {
        // User is signed in
        if (authButtons) authButtons.classList.add('hidden');
        if (userSection) userSection.classList.remove('hidden');
        if (userName) {
            const name = user.displayName || user.email?.split('@')[0] || 'User';
            userName.innerHTML = `<i class="fas fa-user-circle text-indigo-300"></i><span>Hello <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">${name}</span></span>`;
        }
        
        // Show admin panel if user is admin
        if (adminPanel && isAdmin(user.email)) {
            adminPanel.classList.remove('hidden');
        }
    } else {
        // User is signed out
        if (authButtons) authButtons.classList.remove('hidden');
        if (userSection) userSection.classList.add('hidden');
        if (adminPanel) adminPanel.classList.add('hidden');
        if (userName) userName.textContent = '';
    }
}

// Show authentication loading state
function showAuthLoading(type) {
    const btn = document.getElementById(type + 'Btn');
    const btnText = document.getElementById(type + 'BtnText');
    const spinner = document.getElementById(type + 'Spinner');
    
    if (btn) btn.disabled = true;
    if (btnText) btnText.classList.add('hidden');
    if (spinner) spinner.classList.remove('hidden');
}

// Hide authentication loading state
function hideAuthLoading(type) {
    const btn = document.getElementById(type + 'Btn');
    const btnText = document.getElementById(type + 'BtnText');
    const spinner = document.getElementById(type + 'Spinner');
    
    if (btn) btn.disabled = false;
    if (btnText) btnText.classList.remove('hidden');
    if (spinner) spinner.classList.add('hidden');
}

// Show authentication error
function showAuthError(type, message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorDiv && errorText) {
        errorText.textContent = message;
        errorDiv.classList.remove('hidden');
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
    }
}

// Get user-friendly error message
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/user-not-found': 'No account found with this email address.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password should be at least 6 characters long.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/missing-password': 'Please enter your password.'
    };
    
    return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
}

// Set up form event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            if (email && password) {
                signIn(email, password);
            }
        });
    }
    
    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fullName = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const branch = document.getElementById('branch').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const terms = document.getElementById('terms').checked;
            
            // Validation
            if (!fullName || !email || !branch || !password || !confirmPassword) {
                showToast('Please fill in all fields', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showToast('Passwords do not match', 'error');
                return;
            }
            
            if (password.length < 6) {
                showToast('Password must be at least 6 characters long', 'error');
                return;
            }
            
            if (!terms) {
                showToast('Please accept the terms and conditions', 'error');
                return;
            }
            
            signUp(email, password, fullName, branch);
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', signOutUser);
    }
});

// Global function to check auth state (used in other files)
window.checkAuthState = function() {
    const user = getCurrentUser();
    updateAuthUI(user);
    return user;
};

// Export auth state checker
export { updateAuthUI };
