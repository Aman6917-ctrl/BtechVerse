// Chatbot functionality for BTechVerse
// Provides AI-powered assistance for notes and resources

class BTechVerseChatbot {
    constructor() {
        this.isOpen = false;
        this.currentNote = null;
        this.messages = [];
        this.isTyping = false;
        this.init();
    }

    init() {
        this.createChatbotHTML();
        this.bindEvents();
        this.loadWelcomeMessage();
    }

    createChatbotHTML() {
        // Create chatbot container
        const chatbotHTML = `
            <!-- Chatbot Toggle Button -->
            <div id="chatbotToggle" class="fixed bottom-6 right-6 z-50">
                <button class="chatbot-toggle-btn glass-card p-4 rounded-full hover:scale-110 transition-all duration-300 group">
                    <i class="fas fa-robot text-2xl text-white group-hover:text-blue-400"></i>
                    <div class="chatbot-tooltip absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-slate-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Ask doubts about notes
                    </div>
                </button>
            </div>

            <!-- Chatbot Container -->
            <div id="chatbotContainer" class="fixed bottom-6 right-6 z-40 w-96 h-[500px] transform translate-y-full opacity-0 transition-all duration-500 ease-in-out">
                <div class="glass-card h-full flex flex-col rounded-2xl border border-white/20">
                    <!-- Chatbot Header -->
                    <div class="chatbot-header bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-t-2xl flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <i class="fas fa-robot text-white text-lg"></i>
                            </div>
                            <div>
                                <h3 class="text-white font-semibold">BTechVerse AI</h3>
                                <p class="text-indigo-200 text-xs" id="chatbotContext">Ready to help!</p>
                            </div>
                        </div>
                        <button id="chatbotClose" class="text-white/70 hover:text-white transition-colors">
                            <i class="fas fa-times text-lg"></i>
                        </button>
                    </div>

                    <!-- Chat Messages -->
                    <div id="chatMessages" class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
                        <!-- Messages will be added here -->
                    </div>

                    <!-- Typing Indicator -->
                    <div id="typingIndicator" class="hidden px-4 py-2">
                        <div class="flex items-center space-x-2 text-gray-400">
                            <div class="typing-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <span class="text-sm">AI is thinking...</span>
                        </div>
                    </div>

                    <!-- Chat Input -->
                    <div class="chatbot-input p-4 border-t border-white/10">
                        <div class="flex space-x-2">
                            <input 
                                type="text" 
                                id="chatInput" 
                                placeholder="Ask about this note..."
                                class="flex-1 bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                            <button 
                                id="chatSend" 
                                class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                            >
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                        <div class="mt-2 text-xs text-gray-400 text-center">
                            Ask questions about the current note or general BTech topics
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add to body
        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    }

    bindEvents() {
        // Toggle chatbot
        document.getElementById('chatbotToggle').addEventListener('click', () => {
            this.toggleChatbot();
        });

        // Close chatbot
        document.getElementById('chatbotClose').addEventListener('click', () => {
            this.closeChatbot();
        });

        // Send message
        document.getElementById('chatSend').addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key to send
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            const chatbot = document.getElementById('chatbotContainer');
            const toggle = document.getElementById('chatbotToggle');
            if (this.isOpen && !chatbot.contains(e.target) && !toggle.contains(e.target)) {
                this.closeChatbot();
            }
        });
    }

    toggleChatbot() {
        const container = document.getElementById('chatbotContainer');
        const toggle = document.getElementById('chatbotToggle');
        
        if (this.isOpen) {
            this.closeChatbot();
        } else {
            this.openChatbot();
        }
    }

    openChatbot() {
        const container = document.getElementById('chatbotContainer');
        const toggle = document.getElementById('chatbotToggle');
        
        container.style.transform = 'translateY(0)';
        container.style.opacity = '1';
        toggle.style.transform = 'scale(0.9)';
        
        this.isOpen = true;
        
        // Focus on input
        setTimeout(() => {
            document.getElementById('chatInput').focus();
        }, 300);

        // Animate in
        gsap.fromTo(container, 
            { y: 100, opacity: 0, scale: 0.9 },
            { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" }
        );
    }

    closeChatbot() {
        const container = document.getElementById('chatbotContainer');
        const toggle = document.getElementById('chatbotToggle');
        
        container.style.transform = 'translateY(100%)';
        container.style.opacity = '0';
        toggle.style.transform = 'scale(1)';
        
        this.isOpen = false;
    }

    setNoteContext(noteTitle, noteSubject, noteBranch) {
        this.currentNote = {
            title: noteTitle,
            subject: noteSubject,
            branch: noteBranch
        };

        const contextElement = document.getElementById('chatbotContext');
        if (contextElement) {
            contextElement.textContent = `🤖 GPT-3.5 - Helping with: ${noteTitle}`;
        }

        // Add context message
        this.addMessage('system', `I'm here to help you with "${noteTitle}" from ${noteSubject} (${noteBranch}). What would you like to know?`);
    }

    loadWelcomeMessage() {
        const welcomeMessages = [
            "Hi! I'm BTechVerse AI powered by GPT-3.5. I can help you understand notes, solve problems, and answer questions about your BTech subjects.",
            "Ask me anything about the current note or general engineering concepts! I'm powered by OpenAI's GPT-3.5 for intelligent responses.",
            "I'm here to help you learn better. What would you like to know? I can provide detailed explanations with examples!"
        ];

        const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        this.addMessage('assistant', randomMessage);
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        // Add user message
        this.addMessage('user', message);
        input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Simulate AI response (replace with actual AI integration)
            const response = await this.generateAIResponse(message);
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add AI response
            setTimeout(() => {
                this.addMessage('assistant', response);
            }, 1000);

        } catch (error) {
            console.error('Chatbot error:', error);
            this.hideTypingIndicator();
            this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        }
    }

    async generateAIResponse(message) {
        try {
            // Prepare context for the AI
            let context = "You are BTechVerse AI, an intelligent assistant helping BTech students with their studies. ";
            
        if (this.currentNote) {
                context += `The student is currently viewing a note titled "${this.currentNote.title}" from ${this.currentNote.subject} (${this.currentNote.branch} branch). `;
            }
            
            context += "Provide helpful, accurate, and educational responses. If the question is about a specific subject, give detailed explanations with examples. ";
            context += "Always be encouraging and supportive. If you don't know something, admit it and suggest where they might find the information.";

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
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('API Error Response:', errorData);
                throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || errorData.error || 'Unknown error'}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;

        } catch (error) {
            console.error('AI API Error:', error);
            console.error('Error details:', error.message);
            
            // Return fallback response - don't add message here, let sendMessage handle it
            return this.generateFallbackResponse(message);
        }
    }

    generateFallbackResponse(message) {
        const lowerMessage = message.toLowerCase();
        console.log('🔍 Fallback response for:', lowerMessage);
        
        // Enhanced fallback responses
        if (lowerMessage.includes('algorithm') || lowerMessage.includes('complexity') || lowerMessage.includes('sort') || lowerMessage.includes('search')) {
            return `**Algorithms & Complexity** ⚡
            
**What are Algorithms?**
Step-by-step procedures to solve problems efficiently.

**Time Complexity (Big O):**
• O(1) - Constant time (array access)
• O(log n) - Logarithmic (binary search)  
• O(n) - Linear (linear search)
• O(n²) - Quadratic (bubble sort)

**Common Algorithms:**
• **Sorting**: Bubble, Quick, Merge, Heap sort
• **Searching**: Linear, Binary search
• **Graph**: BFS, DFS, Dijkstra's algorithm

**Example - Binary Search:**
\`\`\`python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
\`\`\`

Which algorithm would you like me to explain?`;
        }
        
        if (lowerMessage.includes('programming') || lowerMessage.includes('code') || lowerMessage.includes('python') || lowerMessage.includes('java') || lowerMessage.includes('javascript') || lowerMessage.includes('c++')) {
            return `**Programming Help** 🚀
            
**Best Practices:**
• Write clean, readable code
• Use meaningful variable names
• Comment your code properly
• Test your code thoroughly

**Common Languages:**
• **Python**: Great for beginners, data science, AI
• **Java**: Object-oriented, platform independent
• **C++**: High performance, system programming
• **JavaScript**: Web development, frontend/backend

**Problem Solving Steps:**
1. Understand the problem clearly
2. Break it into smaller parts
3. Plan your approach
4. Write pseudocode first
5. Implement step by step
6. Test and debug

What programming concept would you like help with?`;
        }
        
        if (lowerMessage.includes('data structure') || lowerMessage.includes('array') || lowerMessage.includes('linked list') || lowerMessage.includes('stack') || lowerMessage.includes('queue') || lowerMessage.includes('tree') || lowerMessage.includes('graph')) {
            return `**Data Structures** 📊
            
**What are Data Structures?**
Ways of organizing and storing data for efficient access and modification.

**Linear Data Structures:**
• **Array**: Fixed size, random access O(1)
• **Linked List**: Dynamic size, sequential access O(n)
• **Stack**: LIFO (Last In, First Out)
• **Queue**: FIFO (First In, First Out)

**Non-Linear Data Structures:**
• **Tree**: Hierarchical structure
• **Graph**: Nodes connected by edges
• **Hash Table**: Key-value pairs, O(1) average access

**Example - Stack Implementation:**
\`\`\`python
class Stack:
    def __init__(self):
        self.items = []
    
    def push(self, item):
        self.items.append(item)
    
    def pop(self):
        return self.items.pop()
    
    def peek(self):
        return self.items[-1]
\`\`\`

Which data structure are you studying?`;
        }
        
        if (lowerMessage.includes('database') || lowerMessage.includes('sql') || lowerMessage.includes('dbms')) {
            return `**Database Management** 🗄️
            
**What is a Database?**
Organized collection of data stored and accessed electronically.

**Key Concepts:**
• **Tables**: Store data in rows and columns
• **Primary Key**: Unique identifier for each row
• **Foreign Key**: Links tables together
• **Indexes**: Speed up data retrieval
• **Normalization**: Reduce data redundancy

**SQL Basics:**
\`\`\`sql
-- Create table
CREATE TABLE students (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    age INT,
    course VARCHAR(50)
);

-- Insert data
INSERT INTO students VALUES (1, 'John', 20, 'CSE');

-- Query data
SELECT * FROM students WHERE age > 18;
\`\`\`

What database topic would you like to explore?`;
        }
        
        if (lowerMessage.includes('machine learning') || lowerMessage.includes('ai') || lowerMessage.includes('neural network') || lowerMessage.includes('ml')) {
            return `**Machine Learning & AI** 🤖
            
**What is Machine Learning?**
AI subset that enables computers to learn from data without explicit programming.

**Types of Learning:**
• **Supervised**: Learn from labeled examples
• **Unsupervised**: Find patterns in unlabeled data
• **Reinforcement**: Learn through trial and error

**Common Algorithms:**
• **Linear Regression**: Predict continuous values
• **Logistic Regression**: Binary classification
• **Decision Trees**: Rule-based classification
• **Neural Networks**: Inspired by brain neurons

**Example - Linear Regression:**
\`\`\`python
from sklearn.linear_model import LinearRegression
import numpy as np

# Sample data
X = np.array([[1], [2], [3], [4], [5]])
y = np.array([2, 4, 6, 8, 10])

# Create and train model
model = LinearRegression()
model.fit(X, y)

# Make prediction
prediction = model.predict([[6]])
print(f"Prediction: {prediction[0]}")  # Output: 12
\`\`\`

What aspect of ML interests you?`;
        }
        
        if (lowerMessage.includes('network') || lowerMessage.includes('protocol') || lowerMessage.includes('tcp') || lowerMessage.includes('ip')) {
            return `**Computer Networks** 🌐
            
**What are Computer Networks?**
Interconnected devices that can communicate and share resources.

**OSI Model (7 Layers):**
1. **Physical**: Cables, signals, hardware
2. **Data Link**: Frames, MAC addresses, error detection
3. **Network**: IP addresses, routing, packet forwarding
4. **Transport**: TCP/UDP, reliable/unreliable delivery
5. **Session**: Connection management, authentication
6. **Presentation**: Data encryption, compression
7. **Application**: HTTP, FTP, SMTP protocols

**Key Protocols:**
• **TCP**: Reliable, connection-oriented
• **UDP**: Fast, connectionless
• **HTTP**: Web page requests
• **HTTPS**: Secure HTTP with SSL/TLS

Which networking concept would you like to understand?`;
        }
        
        // Default response for any question
        return `**I'm here to help with your BTech studies!** 🎓
        
Based on your question, here are the main topics I can help with:

**Programming & Development:**
• Python, Java, C++, JavaScript programming
• Software engineering principles
• Web development (HTML, CSS, JavaScript)

**Computer Science Core:**
• Data Structures & Algorithms
• Database Management Systems (DBMS)
• Operating Systems (OS)
• Computer Networks

**Advanced Topics:**
• Machine Learning & AI
• Data Science & Analytics
• Cybersecurity
• Cloud Computing

**Study & Career:**
• Exam preparation strategies
• Project ideas and guidance
• Interview preparation
• Career advice

**To get better help:**
• Be specific: "Explain binary search algorithm"
• Mention the subject: "Help with Python programming"
• Ask for examples: "Show me how to implement a stack"

What specific topic would you like to learn about?`;
    }

    addMessage(sender, content) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        
        const isUser = sender === 'user';
        const isSystem = sender === 'system';
        
        messageDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;
        
        const messageContent = `
            <div class="max-w-[80%] ${isUser ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : isSystem ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/10'} text-white p-3 rounded-2xl ${isUser ? 'rounded-br-md' : 'rounded-bl-md'}">
                <div class="text-sm">${content}</div>
                <div class="text-xs opacity-70 mt-1">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        
        messageDiv.innerHTML = messageContent;
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Animate message
        gsap.fromTo(messageDiv, 
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
        );
    }

    showTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        indicator.classList.remove('hidden');
        
        // Animate typing dots
        gsap.to('.typing-dots span', {
            scale: 1.2,
            duration: 0.6,
            stagger: 0.2,
            repeat: -1,
            yoyo: true,
            ease: "power2.inOut"
        });
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        indicator.classList.add('hidden');
        
        // Stop animation
        gsap.killTweensOf('.typing-dots span');
    }

    // Public method to set note context from other pages
    setContext(noteTitle, noteSubject, noteBranch) {
        this.setNoteContext(noteTitle, noteSubject, noteBranch);
    }
}

// Initialize chatbot when DOM is loaded
let chatbot;
document.addEventListener('DOMContentLoaded', () => {
    chatbot = new BTechVerseChatbot();
    
    // Make it globally available
    window.BTechVerseChatbot = chatbot;
});

// Export for module use
export { BTechVerseChatbot };
