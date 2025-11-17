// ============================================
// DREAMFM - MAIN APP LOGIC
// ============================================

console.log("🚀 DreamFM App Starting...");

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ DOM Loaded");
    setupEventListeners();
    loadHomePage();
});

// Setup Event Listeners
function setupEventListeners() {
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', loginWithGoogle);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('href').substring(1);
            navigateTo(page);
        });
    });
    
    console.log("✅ Event listeners setup complete");
}

// Navigation System
function navigateTo(page) {
    console.log("📍 Navigating to:", page);
    
    // Update active nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`[href="#${page}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Load page content
    switch(page) {
        case 'home':
            loadHomePage();
            break;
        case 'library':
            loadLibraryPage();
            break;
        case 'profile':
            loadProfilePage();
            break;
        default:
            loadHomePage();
    }
}

// ============================================
// HOME PAGE
// ============================================

function loadHomePage() {
    const mainContent = document.getElementById('mainContent');
    
    if (!mainContent) {
        console.error("❌ mainContent element not found!");
        return;
    }
    
    console.log("📄 Loading Home Page...");
    
    mainContent.innerHTML = `
        <div class="home-page">
            <div class="hero">
                <h1>🎧 Welcome to DreamFM</h1>
                <p>Premium Audiobooks at Your Fingertips</p>
                <div class="hero-stats">
                    <div class="stat-item">
                        <div class="stat-number" id="totalBooks">-</div>
                        <div class="stat-label">Audiobooks</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">Free</div>
                        <div class="stat-label">Unlimited Streaming</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">HD</div>
                        <div class="stat-label">Audio Quality</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>🔥 Featured Audiobooks</h2>
                <div id="featuredBooks" class="book-grid">
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                        <p>Loading audiobooks...</p>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>📚 Browse by Category</h2>
                <div class="categories">
                    <div class="category-card" onclick="filterByCategory('Fiction')">📚 Fiction</div>
                    <div class="category-card" onclick="filterByCategory('Business')">💼 Business</div>
                    <div class="category-card" onclick="filterByCategory('Self-Help')">🧠 Self-Help</div>
                    <div class="category-card" onclick="filterByCategory('Romance')">❤️ Romance</div>
                    <div class="category-card" onclick="filterByCategory('Thriller')">🔍 Thriller</div>
                    <div class="category-card" onclick="filterByCategory('Horror')">🎭 Horror</div>
                    <div class="category-card" onclick="filterByCategory('Mystery')">🕵️ Mystery</div>
                </div>
            </div>
        </div>
    `;
    
    // Load audiobooks from Firestore
    loadAudiobooks();
}

// Load Audiobooks from Firestore
async function loadAudiobooks() {
    try {
        console.log("📡 Fetching audiobooks from Firestore...");
        
        const snapshot = await db.collection('audiobooks')
            .orderBy('createdAt', 'desc')
            .get();
        
        const booksContainer = document.getElementById('featuredBooks');
        
        if (snapshot.empty) {
            console.warn("⚠️ No audiobooks found");
            booksContainer.innerHTML = `
                <div class="no-books">
                    <div style="font-size: 4rem; margin-bottom: 20px;">📚</div>
                    <h3>No audiobooks yet</h3>
                    <p>Add some books to get started!</p>
                </div>
            `;
            return;
        }
        
        console.log(`✅ Loaded ${snapshot.size} audiobooks`);
        
        // Store all books in window object
        window.allAudiobooks = [];
        snapshot.forEach(doc => {
            window.allAudiobooks.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Update total count
        const totalBooksEl = document.getElementById('totalBooks');
        if (totalBooksEl) {
            totalBooksEl.textContent = snapshot.size;
        }
        
        // Display books
        displayBooks(window.allAudiobooks);
        
    } catch (error) {
        console.error("❌ Error loading audiobooks:", error);
        const booksContainer = document.getElementById('featuredBooks');
        booksContainer.innerHTML = `
            <div class="error-message">
                <div style="font-size: 3rem; margin-bottom: 15px;">❌</div>
                <h3>Error Loading Audiobooks</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadAudiobooks()">Retry</button>
            </div>
        `;
    }
}

// Display Books in Grid
function displayBooks(books) {
    const booksContainer = document.getElementById('featuredBooks');
    
    if (!booksContainer) {
        console.error("❌ Books container not found");
        return;
    }
    
    if (books.length === 0) {
        booksContainer.innerHTML = `
            <div class="no-books">
                <div style="font-size: 4rem; margin-bottom: 20px;">🔍</div>
                <h3>No books found</h3>
                <p>Try a different filter</p>
            </div>
        `;
        return;
    }
    
    booksContainer.innerHTML = '';
    
    books.forEach(book => {
        booksContainer.innerHTML += createBookCard(book);
    });
}

// Create Book Card HTML
function createBookCard(book) {
    const rating = book.rating || 0;
    const stars = '⭐'.repeat(Math.floor(rating));
    
    return `
        <div class="book-card" onclick="openBook('${book.id}')">
            <div class="book-cover">
                <img src="${book.coverUrl || 'https://via.placeholder.com/200x300/6B46C1/FFFFFF?text=No+Cover'}" 
                     alt="${book.title}"
                     onerror="this.src='https://via.placeholder.com/200x300/6B46C1/FFFFFF?text=DreamFM'">
                <div class="play-overlay">▶️</div>
                ${book.language ? `<div class="book-badge">${book.language}</div>` : ''}
            </div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.author || 'Unknown Author'}</p>
                <div class="book-meta">
                    <span class="book-duration">🕐 ${book.duration || 'N/A'}</span>
                    <span class="book-chapters">📑 ${book.totalChapters || 0} Ch</span>
                </div>
                <div class="book-rating">
                    ${stars} <span class="rating-text">${rating.toFixed(1)}</span>
                </div>
            </div>
        </div>
    `;
}

// Open Book (Play Audiobook)
function openBook(bookId) {
    console.log("📖 Opening book:", bookId);
    
    // Find book in window.allAudiobooks
    const book = window.allAudiobooks.find(b => b.id === bookId);
    
    if (book) {
        playAudiobook(bookId, book);
    } else {
        console.error("❌ Book not found:", bookId);
        alert("Book not found!");
    }
}

// Filter by Category
function filterByCategory(category) {
    console.log("🔍 Filtering by category:", category);
    
    const filtered = window.allAudiobooks.filter(book => 
        book.category === category
    );
    
    // Update page title
    const mainContent = document.getElementById('mainContent');
    const sectionTitle = mainContent.querySelector('.section h2');
    if (sectionTitle) {
        sectionTitle.textContent = `📚 ${category} Books`;
    }
    
    displayBooks(filtered);
}

// ============================================
// LIBRARY PAGE
// ============================================

function loadLibraryPage() {
    const mainContent = document.getElementById('mainContent');
    
    mainContent.innerHTML = `
        <div class="library-page">
            <div class="library-header">
                <h1>📚 Audiobook Library</h1>
                <div class="library-controls">
                    <input type="text" id="searchInput" class="search-input" placeholder="🔍 Search books...">
                    <select id="sortSelect" class="sort-select">
                        <option value="recent">Recent</option>
                        <option value="popular">Popular</option>
                        <option value="rating">Highest Rated</option>
                        <option value="title">Title A-Z</option>
                    </select>
                </div>
            </div>
            
            <div class="filter-chips">
                <button class="filter-chip active" onclick="filterLibrary('all')">All</button>
                <button class="filter-chip" onclick="filterLibrary('Fiction')">Fiction</button>
                <button class="filter-chip" onclick="filterLibrary('Romance')">Romance</button>
                <button class="filter-chip" onclick="filterLibrary('Thriller')">Thriller</button>
                <button class="filter-chip" onclick="filterLibrary('Business')">Business</button>
                <button class="filter-chip" onclick="filterLibrary('Self-Help')">Self-Help</button>
            </div>
            
            <div id="libraryBooks" class="book-grid">
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Loading library...</p>
                </div>
            </div>
        </div>
    `;
    
    // Load all books
    loadLibraryBooks();
    
    // Setup search and sort
    setTimeout(() => {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchBooks(e.target.value);
            });
        }
        
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                sortBooks(e.target.value);
            });
        }
    }, 100);
}

async function loadLibraryBooks() {
    try {
        const snapshot = await db.collection('audiobooks').get();
        
        window.allAudiobooks = [];
        snapshot.forEach(doc => {
            window.allAudiobooks.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        displayLibraryBooks(window.allAudiobooks);
        
    } catch (error) {
        console.error("Error loading library:", error);
    }
}

function displayLibraryBooks(books) {
    const container = document.getElementById('libraryBooks');
    if (!container) return;
    
    if (books.length === 0) {
        container.innerHTML = `
            <div class="no-books">
                <h3>No books found</h3>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    books.forEach(book => {
        container.innerHTML += createBookCard(book);
    });
}

function filterLibrary(category) {
    // Update active chip
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    event.target.classList.add('active');
    
    if (category === 'all') {
        displayLibraryBooks(window.allAudiobooks);
    } else {
        const filtered = window.allAudiobooks.filter(book => book.category === category);
        displayLibraryBooks(filtered);
    }
}

function searchBooks(query) {
    if (!query) {
        displayLibraryBooks(window.allAudiobooks);
        return;
    }
    
    const filtered = window.allAudiobooks.filter(book => 
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        book.author.toLowerCase().includes(query.toLowerCase())
    );
    
    displayLibraryBooks(filtered);
}

function sortBooks(sortBy) {
    let sorted = [...window.allAudiobooks];
    
    switch(sortBy) {
        case 'popular':
            sorted.sort((a, b) => (b.plays || 0) - (a.plays || 0));
            break;
        case 'rating':
            sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'title':
            sorted.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'recent':
        default:
            // Already sorted by createdAt
            break;
    }
    
    displayLibraryBooks(sorted);
}

// ============================================
// PROFILE PAGE
// ============================================

function loadProfilePage() {
    const mainContent = document.getElementById('mainContent');
    
    if (!window.currentUser) {
        mainContent.innerHTML = `
            <div class="profile-page">
                <div class="auth-container">
                    <div style="font-size: 5rem; margin-bottom: 20px;">🔒</div>
                    <h1>Login Required</h1>
                    <p>Please login to access your profile</p>
                    <button onclick="loginWithGoogle()" class="btn btn-primary">
                        🔐 Login with Google
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    mainContent.innerHTML = `
        <div class="profile-page">
            <div class="profile-header">
                <img src="${window.currentUser.photoURL || 'https://ui-avatars.com/api/?name=' + window.currentUser.email}" 
                     class="profile-avatar-large">
                <h1>${window.currentUser.displayName || 'User'}</h1>
                <p>${window.currentUser.email}</p>
            </div>
            
            <div class="profile-stats">
                <div class="stat-card">
                    <div class="stat-icon">📚</div>
                    <h3>0</h3>
                    <p>Books Played</p>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⏰</div>
                    <h3>0h</h3>
                    <p>Hours Listened</p>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">❤️</div>
                    <h3>0</h3>
                    <p>Favorites</p>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🏆</div>
                    <h3>Member</h3>
                    <p>Status</p>
                </div>
            </div>
            
            <div class="profile-sections">
                <div class="section">
                    <h2>Continue Listening</h2>
                    <p style="color: rgba(255,255,255,0.6);">No recent books</p>
                </div>
                
                <div class="section">
                    <h2>Favorites</h2>
                    <p style="color: rgba(255,255,255,0.6);">No favorites yet</p>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Add sample audiobook (for testing)
async function addSampleAudiobook() {
    try {
        await db.collection('audiobooks').add({
            title: "Sample Audiobook " + Date.now(),
            author: "Test Author",
            narrator: "AI Voice",
            coverUrl: "https://picsum.photos/400/600?random=" + Date.now(),
            description: "This is a test audiobook",
            category: "Fiction",
            language: "English",
            duration: "2h 30m",
            totalChapters: 10,
            rating: 4.5,
            plays: 0,
            audioSlug: "sample-" + Date.now(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("✅ Sample audiobook added!");
        loadAudiobooks();
    } catch (error) {
        console.error("❌ Error adding sample:", error);
    }
}

// Console helper
console.log(`
%c🎧 DreamFM Console Commands 🎧

%caddSampleAudiobook() %c- Add a test book
%cloadAudiobooks() %c- Reload books
%cnavigateTo('home') %c- Go to home
%cnavigateTo('library') %c- Go to library
%cnavigateTo('profile') %c- Go to profile

`, 
'font-size: 16px; font-weight: bold; color: #6B46C1;',
'color: #9333ea; font-weight: bold;', 'color: #ccc;',
'color: #9333ea; font-weight: bold;', 'color: #ccc;',
'color: #9333ea; font-weight: bold;', 'color: #ccc;',
'color: #9333ea; font-weight: bold;', 'color: #ccc;',
'color: #9333ea; font-weight: bold;', 'color: #ccc;'
);
