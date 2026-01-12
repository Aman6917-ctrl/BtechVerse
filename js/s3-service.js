// S3 Service for file operations
// This module handles S3 file downloads, viewing, and other operations

/* -------------------- S3 CONFIG -------------------- */
// IMPORTANT: Replace these with your actual AWS credentials
// For production, these should be loaded from environment variables or a secure config service
const AWS_REGION = 'eu-north-1';
const S3_BUCKET = 'btech-verse';
const AWS_ACCESS_KEY_ID = 'YOUR_AWS_ACCESS_KEY_ID_HERE';
const AWS_SECRET_ACCESS_KEY = 'YOUR_AWS_SECRET_ACCESS_KEY_HERE';

// Configure AWS SDK v2
if (!window.AWS) {
  console.error('AWS SDK not found on window. Did you include the <script> in the HTML?');
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

/* -------------------- S3 FUNCTIONS -------------------- */

/**
 * Download a file from S3
 * @param {string} fileURL - The S3 file URL
 * @param {string} fileName - The desired filename for download
 */
export async function downloadFileFromS3(fileURL, fileName) {
  try {
    // Extract S3 key from URL
    const s3Key = extractS3KeyFromURL(fileURL);
    
    if (!s3Key) {
      throw new Error('Invalid S3 URL - could not extract key');
    }

    // Check if file exists first
    let fileExists = await checkFileExists(s3Key);
    
    // If file doesn't exist with decoded key, try different encoding variations
    let finalKey = s3Key;
    if (!fileExists) {
      // Try 1: URL encoded version (spaces as %20)
      const encodedKey = encodeURIComponent(s3Key).replace(/%2F/g, '/'); // Keep forward slashes unencoded
      fileExists = await checkFileExists(encodedKey);
      
      if (fileExists) {
        finalKey = encodedKey;
      } else {
        // Try 2: Plus encoded version (spaces as +)
        const plusEncodedKey = s3Key.replace(/ /g, '+');
        fileExists = await checkFileExists(plusEncodedKey);
        
        if (fileExists) {
          finalKey = plusEncodedKey;
        }
      }
    }
    
    if (!fileExists) {
      throw new Error(`File not found: ${s3Key}`);
    }

    // Get fresh signed URL for download (24 hours)
    const signedUrl = await getSignedDownloadURL(finalKey, 86400);
    
    // Create download link
    const link = document.createElement('a');
    link.href = signedUrl;
    link.download = fileName || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('[S3] Download failed:', error);

    // Show user-friendly error message
    if (error.message && (error.message.includes('File not found') || error.message.includes('NoSuchKey'))) {
      alert('File not found. It may have been deleted or moved. Please contact support.');
    } else if (error.message && (error.message.includes('AccessDenied') || error.message.includes('expired') || error.message.includes('Forbidden'))) {
      alert('Access denied. Please check your permissions or contact support.');
    } else if (error.message && error.message.includes('Invalid S3 URL')) {
      alert('Invalid file URL. Please try uploading the file again.');
    } else {
      alert('Failed to download file. Please try again.');
    }

    throw error;
  }
}

/**
 * Open file in new tab with integrated chatbot
 * @param {string} fileUrl - The file URL
 * @param {string} fileName - The file name
 */
export function openFileWithChatbot(fileUrl, fileName) {
  // Create new window with chatbot
  const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  
  if (!newWindow) {
    throw new Error('Popup blocked. Please allow popups for this site.');
  }
  
  // Get file extension for proper display
  const fileExtension = fileName.split('.').pop().toLowerCase();
  const displayName = fileName.split('/').pop(); // Get just the filename
  
  // Create HTML content with chatbot
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${displayName} - BTechVerse</title>
    <link rel="preconnect" href="https://btech-verse.s3.eu-north-1.amazonaws.com">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script src="https://sdk.amazonaws.com/js/aws-sdk-2.1490.0.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            height: 100vh;
            overflow: hidden;
        }
        
        .container {
            display: flex;
            height: 100vh;
        }
        
        .file-viewer {
            flex: 1;
            background: white;
            display: flex;
            flex-direction: column;
        }
        
        .file-header {
            background: #2d3748;
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .file-title {
            font-size: 18px;
            font-weight: 600;
        }
        
        .file-actions {
            display: flex;
            gap: 10px;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        
        .btn-primary {
            background: #4299e1;
            color: white;
        }
        
        .btn-primary:hover {
            background: #3182ce;
        }
        
        .btn-secondary {
            background: #e2e8f0;
            color: #4a5568;
        }
        
        .btn-secondary:hover {
            background: #cbd5e0;
        }
        
        .file-content {
            flex: 1;
            padding: 0;
            overflow: hidden;
        }
        
        .file-iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        
        .chatbot-panel {
            width: 350px;
            background: #f7fafc;
            border-left: 1px solid #e2e8f0;
            display: flex;
            flex-direction: column;
        }
        
        .chatbot-header {
            background: #4a5568;
            color: white;
            padding: 15px 20px;
            text-align: center;
            font-weight: 600;
        }
        
        .chatbot-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            max-height: calc(100vh - 140px);
        }
        
        .message {
            margin-bottom: 15px;
            animation: slideIn 0.3s ease;
        }
        
        .message.user {
            text-align: right;
        }
        
        .message.bot {
            text-align: left;
        }
        
        .message-content {
            display: inline-block;
            max-width: 80%;
            padding: 12px 16px;
            border-radius: 18px;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .message.user .message-content {
            background: #4299e1;
            color: white;
        }
        
        .message.bot .message-content {
            background: white;
            color: #2d3748;
            border: 1px solid #e2e8f0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .chatbot-input {
            padding: 20px;
            background: white;
            border-top: 1px solid #e2e8f0;
        }
        
        .input-group {
            display: flex;
            gap: 10px;
        }
        
        .chat-input {
            flex: 1;
            padding: 12px 16px;
            border: 1px solid #e2e8f0;
            border-radius: 25px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.3s ease;
        }
        
        .chat-input:focus {
            border-color: #4299e1;
        }
        
        .send-btn {
            width: 45px;
            height: 45px;
            border: none;
            border-radius: 50%;
            background: #4299e1;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        
        .send-btn:hover {
            background: #3182ce;
            transform: scale(1.05);
        }
        
        .send-btn:disabled {
            background: #a0aec0;
            cursor: not-allowed;
            transform: none;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .typing-indicator {
            display: none;
            padding: 12px 16px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            color: #718096;
            font-style: italic;
        }
        
        .typing-indicator.show {
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="file-viewer">
            <div class="file-header">
                <div class="file-title">
                    <i class="fas fa-file-alt mr-2"></i>
                    ${displayName}
                </div>
                <div class="file-actions">
                    <button class="btn btn-primary" onclick="downloadFile()">
                        <i class="fas fa-download mr-1"></i>Download
                    </button>
                    <button class="btn btn-secondary" onclick="window.close()">
                        <i class="fas fa-times mr-1"></i>Close
                    </button>
                </div>
            </div>
            <div class="file-content">
                <div id="loadingIndicator" style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f8f9fa; color: #6c757d;">
                    <div style="text-align: center;">
                        <div style="width: 40px; height: 40px; border: 4px solid #e3e3e3; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                        <div>Loading PDF...</div>
                    </div>
                </div>
                <iframe id="pdfFrame" src="about:blank" class="file-iframe" style="display: none;" onload="hideLoading()"></iframe>
            </div>
        </div>
        
        <div class="chatbot-panel">
            <div class="chatbot-header">
                <i class="fas fa-robot mr-2"></i>
                BTechVerse AI Assistant
            </div>
            <div class="chatbot-messages" id="chatbotMessages">
                <div class="message bot">
                    <div class="message-content">
                        <strong>🤖 BTechVerse AI</strong><br>
                        Hi! I'm here to help you understand this document: <strong>${displayName}</strong><br><br>
                        Ask me anything about the content, concepts, or if you need explanations!
                    </div>
                </div>
            </div>
            <div class="chatbot-input">
                <div class="input-group">
                    <input type="text" class="chat-input" id="chatInput" placeholder="Ask about this document..." onkeypress="handleKeyPress(event)">
                    <button class="send-btn" id="sendBtn" onclick="sendMessage()">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        // PDF loading optimizations
        function hideLoading() {
            const loading = document.getElementById('loadingIndicator');
            const iframe = document.getElementById('pdfFrame');
            if (loading) loading.style.display = 'none';
            if (iframe) iframe.style.display = 'block';
        }
        
        // Load PDF directly for faster loading and to avoid CORS issues
        function preloadPDF() {
            const iframe = document.getElementById('pdfFrame');
            const signedUrl = '${fileUrl}';

            // Warm-up connection
            try {
                fetch(signedUrl, { method: 'HEAD', mode: 'no-cors', keepalive: true }).catch(() => {});
            } catch (e) {}

            // Load PDF directly in iframe
            iframe.src = signedUrl + '#toolbar=1&navpanes=1&scrollbar=1&view=FitH';
        }
        
        // Start preloading immediately
        preloadPDF();

        // Chatbot functionality
        let isTyping = false;
        
        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }
        
        async function sendMessage() {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();
            
            if (!message || isTyping) return;
            
            // Add user message
            addMessage(message, 'user');
            input.value = '';
            
            // Show typing indicator
            showTyping();
            
            try {
                // Get AI response
                const response = await getAIResponse(message, '${displayName}');
                hideTyping();
                addMessage(response, 'bot');
            } catch (error) {
                hideTyping();
                addMessage('Sorry, I encountered an error. Please try again.', 'bot');
            }
        }
        
        function addMessage(content, sender) {
            const messagesContainer = document.getElementById('chatbotMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${sender}\`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.innerHTML = content.replace(/\\n/g, '<br>');
            
            messageDiv.appendChild(contentDiv);
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        function showTyping() {
            isTyping = true;
            const messagesContainer = document.getElementById('chatbotMessages');
            const typingDiv = document.createElement('div');
            typingDiv.className = 'typing-indicator show';
            typingDiv.id = 'typingIndicator';
            typingDiv.textContent = 'AI is typing...';
            messagesContainer.appendChild(typingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        function hideTyping() {
            isTyping = false;
            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }
        
        async function getAIResponse(message, fileName) {
            try {
                // Prepare context for the AI
                let context = \`You are BTechVerse AI, an intelligent assistant helping BTech students with their studies. The student is currently viewing a document titled "\${fileName}". Provide helpful, accurate, and educational responses about the document content. If the question is about a specific subject, give detailed explanations with examples. Always be encouraging and supportive.\`;
                
                // Call local server API endpoint (which proxies to OpenAI)
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'gpt-3.5-turbo',
                        messages: [
                            {
                                role: 'system',
                                content: context
                            },
                            {
                                role: 'user',
                                content: message
                            }
                        ],
                        max_tokens: 1000,
                        temperature: 0.7
                    })
                });
                
                if (!response.ok) {
                    throw new Error(\`API request failed: \${response.status}\`);
                }
                
                const data = await response.json();
                return data.choices[0].message.content;
                
            } catch (error) {
                console.error('AI API Error:', error);
                
                // Fallback response
                return \`I'm here to help with "\${fileName}"! While I'm having some technical difficulties, I can still assist you with general questions about BTech subjects like programming, algorithms, data structures, and more. What would you like to know?\`;
            }
        }
        
        function downloadFile() {
            const link = document.createElement('a');
            link.href = '${fileUrl}';
            link.download = '${displayName}';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        // Focus on input when page loads
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('chatInput').focus();
        });
    </script>
</body>
</html>`;

  // Write content to new window
  newWindow.document.write(htmlContent);
  newWindow.document.close();
}

/**
 * View a file from S3 in a new tab
 * @param {string} fileURL - The S3 file URL
 */
export async function viewFileFromS3(fileURL) {
  try {
    // Extract S3 key from URL
    const s3Key = extractS3KeyFromURL(fileURL);
    
    if (!s3Key) {
      throw new Error('Invalid S3 URL - could not extract key');
    }

    // Check if file exists first
    let fileExists = await checkFileExists(s3Key);
    
    // If file doesn't exist with decoded key, try different encoding variations
    let finalKey = s3Key;
    if (!fileExists) {
      // Try 1: URL encoded version (spaces as %20)
      const encodedKey = encodeURIComponent(s3Key).replace(/%2F/g, '/'); // Keep forward slashes unencoded
      fileExists = await checkFileExists(encodedKey);
      
      if (fileExists) {
        finalKey = encodedKey;
      } else {
        // Try 2: Plus encoded version (spaces as +)
        const plusEncodedKey = s3Key.replace(/ /g, '+');
        fileExists = await checkFileExists(plusEncodedKey);
        
        if (fileExists) {
          finalKey = plusEncodedKey;
        }
      }
    }
    
    if (!fileExists) {
      throw new Error(`File not found: ${s3Key}`);
    }

    // Get fresh signed URL for viewing (24 hours)
    const signedUrl = await getSignedViewURL(finalKey, 86400);
    
    // Open in new tab with chatbot
    openFileWithChatbot(signedUrl, finalKey);
    
    return true;
  } catch (error) {
    console.error('[S3] Failed to open file:', error);

    // Show user-friendly error message
    if (error.message && (error.message.includes('File not found') || error.message.includes('NoSuchKey'))) {
      alert('File not found. It may have been deleted or moved. Please contact support.');
    } else if (error.message && (error.message.includes('AccessDenied') || error.message.includes('expired') || error.message.includes('Forbidden'))) {
      alert('Access denied. Please check your permissions or contact support.');
    } else if (error.message && error.message.includes('Popup blocked')) {
      alert('Please allow popups for this site to view files.');
    } else if (error.message && error.message.includes('Invalid S3 URL')) {
      alert('Invalid file URL. Please try uploading the file again.');
    } else {
      alert('Failed to open file. Please try again.');
    }

    throw error;
  }
}

/**
 * Get a signed URL for downloading a file
 * @param {string} s3Key - The S3 object key
 * @param {number} expiresIn - Expiration time in seconds (default: 24 hours)
 */
async function getSignedDownloadURL(s3Key, expiresIn = 86400) {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Expires: expiresIn,
      ResponseContentDisposition: 'attachment'
    };

    s3.getSignedUrl('getObject', params, (err, url) => {
      if (err) {
        console.error('[S3] Failed to generate signed download URL:', err);
        reject(err);
      } else {
        resolve(url);
      }
    });
  });
}

/**
 * Get a signed URL for viewing a file
 * @param {string} s3Key - The S3 object key
 * @param {number} expiresIn - Expiration time in seconds (default: 24 hours)
 */
async function getSignedViewURL(s3Key, expiresIn = 86400) {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Expires: expiresIn
    };

    s3.getSignedUrl('getObject', params, (err, url) => {
      if (err) {
        console.error('[S3] Failed to generate signed URL:', err);
        reject(err);
      } else {
        resolve(url);
      }
    });
  });
}

/**
 * Extract S3 key from S3 URL
 * @param {string} fileURL - The S3 file URL
 */
function extractS3KeyFromURL(fileURL) {
  try {
    // Handle different S3 URL formats
    if (fileURL.includes('amazonaws.com')) {
      // Standard S3 URL formats:
      // https://bucket.s3.region.amazonaws.com/key
      // https://s3.region.amazonaws.com/bucket/key
      const url = new URL(fileURL);
      
      if (url.hostname.startsWith(S3_BUCKET)) {
        // Format: https://btech-verse.s3.eu-north-1.amazonaws.com/key
        const rawKey = url.pathname.substring(1); // Remove leading slash
        const key = decodeURIComponent(rawKey.replace(/\+/g, ' ')); // Replace + with spaces, then decode
        return key;
      } else if (url.hostname.startsWith('s3.')) {
        // Format: https://s3.eu-north-1.amazonaws.com/btech-verse/key
        const rawPath = url.pathname.substring(1); // Remove leading slash
        const pathParts = decodeURIComponent(rawPath.replace(/\+/g, ' ')).split('/'); // Replace + with spaces, decode, and split
        if (pathParts[0] === S3_BUCKET) {
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
      const key = fileURL.replace(`s3://${S3_BUCKET}/`, '');
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

/**
 * Check if a file exists in S3
 * @param {string} s3Key - The S3 object key
 */
export async function checkFileExists(s3Key) {
  try {
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key
    };

    return new Promise((resolve, reject) => {
      s3.headObject(params, (err, data) => {
        if (err) {
          if (err.statusCode === 404) {
            resolve(false);
          } else {
            reject(err);
          }
        } else {
          resolve(true);
        }
      });
    });
  } catch (error) {
    console.error('[S3] Error checking file existence:', error);
    return false;
  }
}

/**
 * Get file metadata from S3
 * @param {string} s3Key - The S3 object key
 */
export async function getFileMetadata(s3Key) {
  try {
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key
    };

    return new Promise((resolve, reject) => {
      s3.headObject(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            size: data.ContentLength,
            lastModified: data.LastModified,
            contentType: data.ContentType,
            etag: data.ETag
          });
        }
      });
    });
  } catch (error) {
    console.error('[S3] Error getting file metadata:', error);
    throw error;
  }
}

/**
 * Delete a file from S3 (admin only)
 * @param {string} s3Key - The S3 object key
 */
export async function deleteFileFromS3(s3Key) {
  try {
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key
    };

    return new Promise((resolve, reject) => {
      s3.deleteObject(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          console.log('[S3] ✅ File deleted:', s3Key);
          resolve(data);
        }
      });
    });
  } catch (error) {
    console.error('[S3] ❌ Error deleting file:', error);
    throw error;
  }
}

/**
 * Refresh a file URL by generating a new signed URL
 * @param {string} fileURL - The S3 file URL
 * @param {string} action - 'view' or 'download'
 */
export async function refreshFileURL(fileURL, action = 'view') {
  try {
    console.log('[S3] Refreshing URL for:', fileURL);
    
    const s3Key = extractS3KeyFromURL(fileURL);
    if (!s3Key) {
      throw new Error('Invalid S3 URL');
    }

    let signedUrl;
    if (action === 'download') {
      signedUrl = await getSignedDownloadURL(s3Key, 86400);
    } else {
      signedUrl = await getSignedViewURL(s3Key, 86400);
    }
    
    console.log('[S3] ✅ URL refreshed successfully');
    return signedUrl;
  } catch (error) {
    console.error('[S3] ❌ Failed to refresh URL:', error);
    throw error;
  }
}

/**
 * Debug function to check file status
 * @param {string} fileURL - The S3 file URL
 */
export async function debugFileStatus(fileURL) {
  try {
    const s3Key = extractS3KeyFromURL(fileURL);
    
    if (!s3Key) {
      return { error: 'Invalid S3 URL - could not extract key' };
    }

    let fileExists = await checkFileExists(s3Key);
    let finalKey = s3Key;
    let keyType = 'decoded';
    
    // If file doesn't exist with decoded key, try different encoding variations
    if (!fileExists) {
      // Try 1: URL encoded version (spaces as %20)
      const encodedKey = encodeURIComponent(s3Key).replace(/%2F/g, '/'); // Keep forward slashes unencoded
      fileExists = await checkFileExists(encodedKey);
      
      if (fileExists) {
        finalKey = encodedKey;
        keyType = 'url-encoded';
      } else {
        // Try 2: Plus encoded version (spaces as +)
        const plusEncodedKey = s3Key.replace(/ /g, '+');
        fileExists = await checkFileExists(plusEncodedKey);
        
        if (fileExists) {
          finalKey = plusEncodedKey;
          keyType = 'plus-encoded';
        }
      }
    }
    
    if (fileExists) {
      const metadata = await getFileMetadata(finalKey);
      return { 
        exists: true, 
        key: finalKey,
        keyType: keyType,
        originalKey: s3Key,
        metadata: metadata 
      };
    } else {
      return { 
        exists: false, 
        key: s3Key,
        keyType: 'none',
        error: 'File not found in S3 with decoded, URL-encoded, or plus-encoded key variations' 
      };
    }
  } catch (error) {
    console.error('[S3] Debug failed:', error);
    return { error: error.message || 'Unknown error occurred' };
  }
}

// Make functions available globally for use in HTML files
window.downloadFileFromS3 = downloadFileFromS3;
window.viewFileFromS3 = viewFileFromS3;
window.openFileWithChatbot = openFileWithChatbot;
window.checkFileExists = checkFileExists;
window.getFileMetadata = getFileMetadata;
window.deleteFileFromS3 = deleteFileFromS3;
window.refreshFileURL = refreshFileURL;
window.debugFileStatus = debugFileStatus;

console.log('S3 Service loaded successfully');
