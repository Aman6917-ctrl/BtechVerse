// Display functionality for resources
import { db } from './firebase.js';
import { 
    collection, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit,
    doc,
    deleteDoc 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { deleteFileFromS3 } from './s3-service.js';

// Load all resources
export async function loadAllResources() {
    try {
        const resourcesRef = collection(db, 'resources');
        const querySnapshot = await getDocs(query(resourcesRef, orderBy('timestamp', 'desc')));
        
        const resources = [];
        querySnapshot.forEach((doc) => {
            resources.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return resources;
    } catch (error) {
        console.error('Error loading resources:', error);
        throw error;
    }
}

// Load resources by branch
export async function loadBranchResources(branch) {
    try {
        const resourcesRef = collection(db, 'resources');
        const q = query(
            resourcesRef, 
            where('branch', '==', branch)
        );
        
        const querySnapshot = await getDocs(q);
        const resources = [];
        
        querySnapshot.forEach((doc) => {
            resources.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Sort by timestamp client-side to avoid index requirement
        resources.sort((a, b) => {
            const timestampA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
            const timestampB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
            return timestampB - timestampA; // Descending order (newest first)
        });
        
        return resources;
    } catch (error) {
        console.error('Error loading branch resources:', error);
        throw error;
    }
}

// Load interview preparation resources
export async function loadInterviewResources() {
    try {
        const resourcesRef = collection(db, 'resources');
        const q = query(
            resourcesRef,
            where('branch', '==', 'Interview-Prep')
        );
        
        const querySnapshot = await getDocs(q);
        const resources = [];
        
        querySnapshot.forEach((doc) => {
            resources.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Sort by timestamp client-side to avoid index requirement
        resources.sort((a, b) => {
            const timestampA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
            const timestampB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
            return timestampB - timestampA; // Descending order (newest first)
        });
        
        return resources;
    } catch (error) {
        console.error('Error loading interview resources:', error);
        throw error;
    }
}

// Load resources by category
export async function loadResourcesByCategory(branch, category) {
    try {
        const resourcesRef = collection(db, 'resources');
        const q = query(
            resourcesRef,
            where('branch', '==', branch),
            where('category', '==', category)
        );
        
        const querySnapshot = await getDocs(q);
        const resources = [];
        
        querySnapshot.forEach((doc) => {
            resources.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Sort by timestamp client-side to avoid index requirement
        resources.sort((a, b) => {
            const timestampA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
            const timestampB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
            return timestampB - timestampA; // Descending order (newest first)
        });
        
        return resources;
    } catch (error) {
        console.error('Error loading category resources:', error);
        throw error;
    }
}

// Load recent resources (for dashboard)
export async function loadRecentResources(limitCount = 10) {
    try {
        const resourcesRef = collection(db, 'resources');
        const q = query(
            resourcesRef,
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );
        
        const querySnapshot = await getDocs(q);
        const resources = [];
        
        querySnapshot.forEach((doc) => {
            resources.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return resources;
    } catch (error) {
        console.error('Error loading recent resources:', error);
        throw error;
    }
}

// Search resources
export async function searchResources(searchTerm, filters = {}) {
    try {
        let q = collection(db, 'resources');
        
        // Apply filters
        if (filters.branch) {
            q = query(q, where('branch', '==', filters.branch));
        }
        
        if (filters.category) {
            q = query(q, where('category', '==', filters.category));
        }
        
        // Remove orderBy to avoid index requirements - will sort client-side
        
        const querySnapshot = await getDocs(q);
        let resources = [];
        
        querySnapshot.forEach((doc) => {
            resources.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Filter by search term (client-side since Firestore doesn't support full-text search)
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            resources = resources.filter(resource => 
                resource.title.toLowerCase().includes(lowerSearchTerm) ||
                resource.subject.toLowerCase().includes(lowerSearchTerm) ||
                (resource.creditName && resource.creditName.toLowerCase().includes(lowerSearchTerm))
            );
        }
        
        // Sort by timestamp client-side to avoid index requirement
        resources.sort((a, b) => {
            const timestampA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
            const timestampB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
            return timestampB - timestampA; // Descending order (newest first)
        });
        
        return resources;
    } catch (error) {
        console.error('Error searching resources:', error);
        throw error;
    }
}

// Delete resource (admin only)
export async function deleteResource(resourceId) {
    try {
        // First get the resource to extract the S3 key
        const resourceDoc = await getDocs(query(collection(db, 'resources'), where('__name__', '==', resourceId)));
        let resourceData = null;
        
        resourceDoc.forEach((doc) => {
            resourceData = { id: doc.id, ...doc.data() };
        });

        // Delete from Firestore
        await deleteDoc(doc(db, 'resources', resourceId));
        
        // Delete from S3 if fileURL exists
        if (resourceData && resourceData.fileURL) {
            try {
                // Extract S3 key from URL
                const s3Key = extractS3KeyFromURL(resourceData.fileURL);
                if (s3Key) {
                    await deleteFileFromS3(s3Key);
                    console.log('File deleted from S3:', s3Key);
                }
            } catch (s3Error) {
                console.warn('Failed to delete file from S3:', s3Error);
                // Don't throw error here as Firestore deletion succeeded
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error deleting resource:', error);
        throw error;
    }
}

// Helper function to extract S3 key from URL
function extractS3KeyFromURL(fileURL) {
    try {
        // Handle different S3 URL formats
        if (fileURL.includes('amazonaws.com')) {
            // Standard S3 URL formats:
            // https://bucket.s3.region.amazonaws.com/key
            // https://s3.region.amazonaws.com/bucket/key
            const url = new URL(fileURL);
            
            if (url.hostname.startsWith('btech-verse')) {
                // Format: https://btech-verse.s3.eu-north-1.amazonaws.com/key
                const rawKey = url.pathname.substring(1); // Remove leading slash
                const key = decodeURIComponent(rawKey.replace(/\+/g, ' ')); // Replace + with spaces, then decode
                return key;
            } else if (url.hostname.startsWith('s3.')) {
                // Format: https://s3.eu-north-1.amazonaws.com/btech-verse/key
                const rawPath = url.pathname.substring(1); // Remove leading slash
                const pathParts = decodeURIComponent(rawPath.replace(/\+/g, ' ')).split('/'); // Replace + with spaces, decode, and split
                if (pathParts[0] === 'btech-verse') {
                    const key = pathParts.slice(1).join('/');
                    return key;
                }
            }
            
            // Fallback: just use pathname
            const rawKey = url.pathname.substring(1);
            const key = decodeURIComponent(rawKey.replace(/\+/g, ' ')); // Replace + with spaces, then decode
            return key;
        } else if (fileURL.includes('s3://')) {
            // S3 URI format: s3://bucket/key
            const key = fileURL.replace('s3://btech-verse/', '');
            return key;
        } else {
            // Assume it's already a key
            return fileURL;
        }
    } catch (error) {
        console.error('Error extracting S3 key from URL:', fileURL, error);
        return null;
    }
}

// Get resource statistics
export async function getResourceStats() {
    try {
        const resources = await loadAllResources();
        
        const stats = {
            total: resources.length,
            byBranch: {},
            byCategory: {},
            recentUploads: resources.slice(0, 5)
        };
        
        // Count by branch
        resources.forEach(resource => {
            stats.byBranch[resource.branch] = (stats.byBranch[resource.branch] || 0) + 1;
        });
        
        // Count by category
        resources.forEach(resource => {
            stats.byCategory[resource.category] = (stats.byCategory[resource.category] || 0) + 1;
        });
        
        return stats;
    } catch (error) {
        console.error('Error getting resource stats:', error);
        throw error;
    }
}

// Format file size for display
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get file type icon
export function getFileTypeIcon(fileType) {
    const icons = {
        'application/pdf': 'fas fa-file-pdf text-red-600',
        'image/jpeg': 'fas fa-file-image text-blue-600',
        'image/jpg': 'fas fa-file-image text-blue-600',
        'image/png': 'fas fa-file-image text-blue-600',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'fas fa-file-powerpoint text-orange-600',
        'application/vnd.ms-powerpoint': 'fas fa-file-powerpoint text-orange-600'
    };
    
    return icons[fileType] || 'fas fa-file text-gray-600';
}

// Format timestamp for display
export function formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
        return 'Today';
    } else if (diffInDays === 1) {
        return 'Yesterday';
    } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Make functions available globally for use in HTML files
window.loadAllResources = loadAllResources;
window.loadBranchResources = loadBranchResources;
window.loadInterviewResources = loadInterviewResources;
window.loadResourcesByCategory = loadResourcesByCategory;
window.loadRecentResources = loadRecentResources;
window.searchResources = searchResources;
window.deleteResource = deleteResource;
window.getResourceStats = getResourceStats;
window.formatFileSize = formatFileSize;
window.getFileTypeIcon = getFileTypeIcon;
window.formatTimestamp = formatTimestamp;

console.log('Display functions loaded successfully');
