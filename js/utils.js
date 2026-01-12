// Utility functions for UI interactions and common functionality

// Toast notification system
function showToast(message, type = 'info', duration = 5000) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast-notification transform transition-all duration-300 ease-in-out translate-x-full`;
    
    const typeClasses = {
        'success': 'bg-green-500 text-white',
        'error': 'bg-red-500 text-white',
        'warning': 'bg-yellow-500 text-black',
        'info': 'bg-blue-500 text-white'
    };
    
    const typeIcons = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <div class="flex items-center p-4 rounded-lg shadow-lg ${typeClasses[type]} max-w-sm">
            <i class="${typeIcons[type]} mr-3"></i>
            <span class="flex-1">${message}</span>
            <button class="ml-3 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    }, duration);
}

// Loading spinner utilities
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <i class="fas fa-spinner fa-spin text-2xl text-indigo-600 mr-3"></i>
                <span class="text-gray-600">Loading...</span>
            </div>
        `;
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '';
    }
}

// Modal utilities
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// Form validation utilities
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function validateRequired(value) {
    return value && value.trim().length > 0;
}

// File utilities
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

function isValidFileType(file, allowedTypes) {
    return allowedTypes.includes(file.type) || allowedTypes.includes('.' + getFileExtension(file.name));
}

// Date utilities
function formatDate(date) {
    if (!date) return 'Unknown';
    
    const d = date instanceof Date ? date : new Date(date);
    
    if (isNaN(d.getTime())) return 'Invalid Date';
    
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateTime(date) {
    if (!date) return 'Unknown';
    
    const d = date instanceof Date ? date : new Date(date);
    
    if (isNaN(d.getTime())) return 'Invalid Date';
    
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function timeAgo(date) {
    if (!date) return 'Unknown';
    
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const seconds = Math.floor((now - d) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, value] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / value);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }
    
    return 'Just now';
}

// Local storage utilities
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

function getFromLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error removing from localStorage:', error);
        return false;
    }
}

// URL utilities
function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function updateURLParameter(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.pushState({}, '', url);
}

function removeURLParameter(key) {
    const url = new URL(window.location);
    url.searchParams.delete(key);
    window.history.pushState({}, '', url);
}

// Debounce utility
function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// Throttle utility
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Copy to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        return new Promise((resolve, reject) => {
            if (document.execCommand('copy')) {
                textArea.remove();
                resolve();
            } else {
                textArea.remove();
                reject();
            }
        });
    }
}

// Scroll utilities
function scrollToTop(smooth = true) {
    window.scrollTo({
        top: 0,
        behavior: smooth ? 'smooth' : 'auto'
    });
}

function scrollToElement(elementId, smooth = true) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: smooth ? 'smooth' : 'auto',
            block: 'start'
        });
    }
}

// Make functions available globally
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showModal = showModal;
window.hideModal = hideModal;
window.validateEmail = validateEmail;
window.validatePassword = validatePassword;
window.validateRequired = validateRequired;
window.formatFileSize = formatFileSize;
window.getFileExtension = getFileExtension;
window.isValidFileType = isValidFileType;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.timeAgo = timeAgo;
window.saveToLocalStorage = saveToLocalStorage;
window.getFromLocalStorage = getFromLocalStorage;
window.removeFromLocalStorage = removeFromLocalStorage;
window.getURLParameter = getURLParameter;
window.updateURLParameter = updateURLParameter;
window.removeURLParameter = removeURLParameter;
window.debounce = debounce;
window.throttle = throttle;
window.copyToClipboard = copyToClipboard;
window.scrollToTop = scrollToTop;
window.scrollToElement = scrollToElement;

console.log('Utility functions loaded successfully');
