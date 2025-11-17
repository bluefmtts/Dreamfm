// ============================================
// DREAMFM - MOBILE APP LOGIC
// ============================================

console.log("🚀 DreamFM App Starting...");

// Global Variables
window.allAudiobooks = [];
let currentFilter = 'all';

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ DOM Loaded");
    setupMobileNavigation();
    setupEventListeners();
    
    // Load home page after auth check
    setTimeout(() => {
        if (window.currentUser) {
            loadHomePage();
        }
    }, 1500);
});

// ============================================
// MOBILE NAVIGATION
// ============================================

function setupMobileNavigation() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const drawerOverlay = document.getElementById('drawerOverlay');
    const drawerClose = document.getElementById('drawerClose');

    function openDrawer() {
        mobileDrawer.classList.add('active');
        drawerOverlay.classList.add('active');
        mobileMenuBtn.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        mobileDrawer.classList.remove('active');
        drawerOverlay.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
        document.body.style.overflow = '';
    }

    mobileMenuBtn?.addEventListener('click', openDrawer);
    drawerClose?.addEventListener('click', closeDrawer);
    drawerOverlay?.addEventListener('click', closeDrawer);

    // Navigation links
    document.querySelectorAll('.drawer-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            
            // Update active state
            document.querySelectorAll('.drawer-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Navigate
            navigateTo(page);
            closeDrawer();
        });
    });
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Prevent pull-to-refresh
    let lastTouchY = 0;
    const mainContent = document.getElementById('mainContent');

    mainContent?.addEventListener('touchstart', (e) => {
        lastTouchY = e.touches[0].clientY;
    }, { passive: true });

    mainContent?.addEventListener('touchmove', (e) => {
        const touchY = e.touches[0].clientY;
        const diff = touchY - lastTouchY;
        
        if (mainContent.scrollTop === 0 && diff > 0) {
            e.preventDefault();
        }
    }, { passive: false });

    console.log("✅ Event listeners setup");
}

// ============================================
// NAVIGATION SYSTEM
// ============================================

function navigateTo(page) {
    console.log("📍 Navigating to:", page);
    
    switch(page) {
        case 'home':
            loadHomePage();
            break;
        case 'library':
            loadLibraryPage();
            break;
        case 'favorites':
            loadFavoritesPage();
            break;
        case 'profile':
            loadProfilePage();
            break;
        case 'settings':
            loadSettingsPage();
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
    
    console.log("📄 Loading Home Page...");
    
    mainContent.innerHTML = `
        <div class="home-page">
            <div class="search-section">
                <div class="search-box">
                    <span class="search-icon">🔍</span>
                    <input type="text" id="searchInput" placeholder="Search audiobooks..." class="search-input">
                </div>
            </div>

            <section class="section">
                <h2 class="section-title">Categories</h2>
                <div class="categories-scroll">
                    <button class="category-chip active" onclick="filterByCategory('all')">All</button>
                    <button class="category-chip" onclick="filterByCategory('Fiction')">Fiction</button>
                    <button class="category-chip" onclick="filterByCategory('Romance')">Romance</button>
                    <button class="category-chip" onclick="filterByCategory('Mystery')">Mystery</button>
                    <button class="category-chip" onclick="filterByCategory('Thriller')">Thriller</button>
                    <button class="category-chip" onclick="filterByCategory('Business')">Business</button>
                    <button class="category-chip" onclick="filterByCategory('Self-Help')">Self-Help</button>
                    <button class="category-chip" onclick="filterByCategory('Horror')">Horror</button>
                </div>
            </section>

            <section class="section">
                <div class="section-header">
                    <h2 class="section-title">Featured Audiobooks</h2>
                    <span class="books-count" id="booksCount">0 books</span>
                </div>
                
                <div id="featuredBooks" class="book-grid">
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                        <p>Loading audiobooks...</p>
                    </div>
                </div>
            </section>
        </div>
    `;
    
    // Load audiobooks
    loadAudiobooks();
    
    // Setup search
    setTimeout(() => {
        const searchInput = document.getElementById('searchInput');
        searchInput?.addEventListener('input', (e) => {
            searchBooks(e.target.value);
        });
    }, 500);
}

// ============================================
// LOAD AUDIOBOOKS FROM FIRESTORE
// ============================================

async function loadAudiobooks() {
    try {
        console.log("📡 Fetching audiobooks from Firestore...");
        
        const snapshot = await window.db.collection('audiobooks')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        
        const booksContainer = document.getElementById('featuredBooks');
        
        if (snapshot.empty) {
            console.warn("⚠️ No audiobooks found");
            booksContainer.innerHTML = `
                <div class="no-books">
                    <div class="no-books-icon">📚</div>
                    <h3>No Audiobooks Yet</h3>
                    <p>Add some books from admin panel</p>
                </div>
            `;
            
            updateBooksCount(0);
            return;
        }
        
        // Store all books
        window.allAudiobooks = [];
        snapshot.forEach(doc => {
            window.allAudiobooks.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ Loaded ${window.allAudiobooks.length} audiobooks`);
        
        // Display books
        displayBooks(window.allAudiobooks);
        updateBooksCount(window.allAudiobooks.length);
        
    } catch (error) {
        console.error("❌ Error loading audiobooks:", error);
        
        const booksContainer = document.getElementById('featuredBooks');
        booksContainer.innerHTML = `
            <div class="error-message">
                <div class="error-icon">❌</div>
                <h3>Error Loading Audiobooks</h3>
                <p>${error.message}</p>
                <button class="btn-retry" onclick="loadAudiobooks()">Retry</button>
            </div>
        `;
    }
}

// ============================================
// DISPLAY BOOKS
// ============================================

function displayBooks(books) {
    const booksContainer = document.getElementById('featuredBooks');
    
    if (!booksContainer) {
        console.error("❌ Books container not found");
        return;
    }
    
    if (books.length === 0) {
        booksContainer.innerHTML = `
            <div class="no-books">
                <div class="no-books-icon">🔍</div>
                <h3>No Books Found</h3>
                <p>Try a different category or search</p>
            </div>
        `;
        updateBooksCount(0);
        return;
    }
    
    booksContainer.innerHTML = books.map(book => createBookCard(book)).join('');
    updateBooksCount(books.length);
}

// ============================================
// CREATE BOOK CARD
// ============================================

function createBookCard(book) {
    const rating = book.rating || 4.0;
    const stars = '⭐'.repeat(Math.floor(rating));
    
    return `
        <div class="book-card" onclick="openBook('${book.id}')">
            <div class="book-cover">
                <img src="${book.coverUrl || 'https://via.placeholder.com/300x400/1a2140/4f8ff7?text=No+Cover'}" 
                     alt="${book.title}"
                     onerror="this.src='https://via.placeholder.com/300x400/1a2140/4f8ff7?text=DreamFM'"
                     loading="lazy">
                <div class="play-overlay">▶️</div>
                ${book.language ? `<span class="book-badge">${book.language}</span>` : ''}
            </div>
            <div class="book-info">
                <div class="book-title">${book.title}</div>
                <div class="book-author">${book.author || 'Unknown Author'}</div>
                <div class="book-meta">
                    <span class="book-duration">⏱️ ${book.duration || 'N/A'}</span>
                    <span class="book-chapters">📑 ${book.totalChapters || 0}</span>
                </div>
                <div class="book-rating">
                    ${stars} <span class="rating-text">${rating.toFixed(1)}</span>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// FILTER & SEARCH
// ============================================

function filterByCategory(category) {
    console.log("🔍 Filtering by:", category);
    
    // Update active chip
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    event.target.classList.add('active');
    
    currentFilter = category;
    
    if (category === 'all') {
        displayBooks(window.allAudiobooks);
    } else {
        const filtered = window.allAudiobooks.filter(book => 
            book.category === category
        );
        displayBooks(filtered);
    }
}

function searchBooks(query) {
    if (!query || query.trim() === '') {
        if (currentFilter === 'all') {
            displayBooks(window.allAudiobooks);
        } else {
            filterByCategory(currentFilter);
        }
        return;
    }
    
    const searchTerm = query.toLowerCase().trim();
    const filtered = window.allAudiobooks.filter(book => 
        book.title.toLowerCase().includes(searchTerm) ||
        (book.author && book.author.toLowerCase().includes(searchTerm)) ||
        (book.category && book.category.toLowerCase().includes(searchTerm))
    );
    
    displayBooks(filtered);
}

function updateBooksCount(count) {
    const booksCountEl = document.getElementById('booksCount');
    if (booksCountEl) {
        booksCountEl.textContent = `${count} book${count !== 1 ? 's' : ''}`;
    }
}

// ============================================
// OPEN BOOK (PLAY)
// ============================================

window.openBook = function(bookId) {
    console.log("📖 Opening book:", bookId);
    
    const book = window.allAudiobooks.find(b => b.id === bookId);
    
    if (book) {
        // Call player function
        if (typeof playAudiobook === 'function') {
            playAudiobook(bookId, book);
        } else {
            console.error("❌ playAudiobook function not found");
            alert("Player not ready. Please refresh the page.");
        }
    } else {
        console.error("❌ Book not found:", bookId);
        alert("Book not found!");
    }
}

// Make filterByCategory global
window.filterByCategory = filterByCategory;

// ============================================
// LIBRARY PAGE
// ============================================

function loadLibraryPage() {
    const mainContent = document.getElementById('mainContent');
    
    mainContent.innerHTML = `
        <div class="library-page">
            <div class="library-header">
                <h1>📚 My Library</h1>
                <p>All your audiobooks in one place</p>
            </div>
            
            <div class="search-section">
                <div class="search-box">
                    <span class="search-icon">🔍</span>
                    <input type="text" id="librarySearch" placeholder="Search library..." class="search-input">
                </div>
            </div>
            
            <div class="filter-chips">
                <button class="filter-chip active" onclick="filterLibrary('all')">All</button>
                <button class="filter-chip" onclick="filterLibrary('Fiction')">Fiction</button>
                <button class="filter-chip" onclick="filterLibrary('Romance')">Romance</button>
                <button class="filter-chip" onclick="filterLibrary('Thriller')">Thriller</button>
                <button class="filter-chip" onclick="filterLibrary('Business')">Business</button>
            </div>
            
            <div id="libraryBooks" class="book-grid">
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Loading library...</p>
                </div>
            </div>
        </div>
    `;
    
    displayBooks(window.allAudiobooks);
    
    setTimeout(() => {
        const librarySearch = document.getElementById('librarySearch');
        librarySearch?.addEventListener('input', (e) => {
            searchBooks(e.target.value);
        });
    }, 300);
}

window.filterLibrary = function(category) {
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    event.target.classList.add('active');
    
    filterByCategory(category);
}

// ============================================
// FAVORITES PAGE
// ============================================

function loadFavoritesPage() {
    const mainContent = document.getElementById('mainContent');
    
    mainContent.innerHTML = `
        <div class="favorites-page">
            <div class="page-header">
                <h1>❤️ Favorites</h1>
                <p>Your favorite audiobooks</p>
            </div>
            
            <div class="no-books">
                <div class="no-books-icon">❤️</div>
                <h3>No Favorites Yet</h3>
                <p>Start adding books to your favorites</p>
            </div>
        </div>
    `;
}

// ============================================
// PROFILE PAGE
// ============================================

function loadProfilePage() {
    const mainContent = document.getElementById('mainContent');
    
    const user = window.currentUser;
    
    if (!user) {
        mainContent.innerHTML = `
            <div class="profile-page">
                <div class="no-auth">
                    <div class="no-books-icon">🔒</div>
                    <h3>Not Logged In</h3>
                    <p>Please login to view profile</p>
                </div>
            </div>
        `;
        return;
    }
    
    mainContent.innerHTML = `
        <div class="profile-page">
            <div class="profile-header">
                <img src="${user.photoURL || 'https://ui-avatars.com/api/?name=' + user.email + '&background=4f8ff7&color=fff'}" 
                     class="profile-avatar">
                <h1>${user.displayName || 'User'}</h1>
                <p>${user.email}</p>
            </div>
            
            <div class="profile-stats">
                <div class="stat-card">
                    <div class="stat-icon">📚</div>
                    <h3>${window.allAudiobooks.length}</h3>
                    <p>Books Available</p>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⏰</div>
                    <h3>0h</h3>
                    <p>Listened</p>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">❤️</div>
                    <h3>0</h3>
                    <p>Favorites</p>
                </div>
            </div>
            
            <div class="profile-actions">
                <button class="action-btn" onclick="navigateTo('library')">
                    <span>📚</span> Browse Library
                </button>
                <button class="action-btn" onclick="navigateTo('settings')">
                    <span>⚙️</span> Settings
                </button>
                <button class="action-btn danger" onclick="logout()">
                    <span>🚪</span> Logout
                </button>
            </div>
        </div>
    `;
}

// ============================================
// SETTINGS PAGE
// ============================================

function loadSettingsPage() {
    const mainContent = document.getElementById('mainContent');
    
    mainContent.innerHTML = `
        <div class="settings-page">
            <div class="page-header">
                <h1>⚙️ Settings</h1>
                <p>Customize your experience</p>
            </div>
            
            <div class="settings-list">
                <div class="setting-item">
                    <div class="setting-info">
                        <span class="setting-icon">🌙</span>
                        <div>
                            <h3>Dark Mode</h3>
                            <p>Always enabled</p>
                        </div>
                    </div>
                </div>
                
                <div class="setting-item">
                    <div class="setting-info">
                        <span class="setting-icon">🔔</span>
                        <div>
                            <h3>Notifications</h3>
                            <p>Coming soon</p>
                        </div>
                    </div>
                </div>
                
                <div class="setting-item">
                    <div class="setting-info">
                        <span class="setting-icon">📥</span>
                        <div>
                            <h3>Downloads</h3>
                            <p>Manage offline books</p>
                        </div>
                    </div>
                </div>
                
                <div class="setting-item">
                    <div class="setting-info">
                        <span class="setting-icon">ℹ️</span>
                        <div>
                            <h3>About</h3>
                            <p>DreamFM v1.0.0</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Toast Notification
function showToast(message) {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

window.showToast = showToast;

// Add sample book (for testing)
window.addSampleAudiobook = async function() {
    try {
        await window.db.collection('audiobooks').add({
            title: "Sample Book " + Date.now(),
            author: "Test Author",
            narrator: "AI Voice",
            coverUrl: "https://picsum.photos/300/400?random=" + Date.now(),
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
        
        showToast("✅ Sample book added!");
        loadAudiobooks();
    } catch (error) {
        console.error("❌ Error:", error);
        showToast("❌ Error adding book");
    }
}

console.log(`
%c🎧 DreamFM Loaded Successfully! 🎧

%caddSampleAudiobook() %c- Add test book
%cloadAudiobooks() %c- Reload books
%cnaviggateTo('home') %c- Go to home

`, 
'font-size: 16px; font-weight: bold; color: #4f8ff7;',
'color: #4f8ff7; font-weight: bold;', 'color: #ccc;',
'color: #4f8ff7; font-weight: bold;', 'color: #ccc;',
'color: #4f8ff7; font-weight: bold;', 'color: #ccc;'
);
