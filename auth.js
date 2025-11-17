// ===================================
// DREAMFM - AUTHENTICATION SYSTEM
// ===================================

console.log('🔐 Auth.js loaded');

let currentUser = null;

// Listen for auth changes
auth.onAuthStateChanged((user) => {
    currentUser = user;
    updateUI(user);
    
    if (user) {
        console.log("✅ User logged in:", user.email);
        loadUserData(user);
    } else {
        console.log("❌ User logged out");
    }
});

// Update UI based on auth state
function updateUI(user) {
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const userPhoto = document.getElementById('userPhoto');
    
    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        if (userName) userName.textContent = user.displayName || user.email;
        if (userPhoto) {
            userPhoto.src = user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=6B46C1&color=fff`;
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
    }
}

// Google Login
async function loginWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        console.log("✅ Google login success:", result.user.email);
        showToast('✅ Login successful!');
    } catch (error) {
        console.error("❌ Login error:", error);
        alert("Login failed: " + error.message);
    }
}

// Email Login (for later)
async function loginWithEmail(email, password) {
    try {
        await auth.signInWithEmailAndPassword(email, password);
        console.log("✅ Email login success");
        showToast('✅ Login successful!');
    } catch (error) {
        console.error("❌ Email login error:", error);
        showToast('❌ Login failed: ' + error.message);
    }
}

// Logout with Cache Clearing
async function logout() {
    try {
        console.log('🚪 Logging out...');
        
        // Clear audio cache on logout
        if (window.clearAudioCache) {
            try {
                await window.clearAudioCache();
                console.log('✅ Audio cache cleared');
            } catch (error) {
                console.error('⚠️ Cache clear failed:', error);
            }
        }
        
        // Sign out from Firebase
        await auth.signOut();
        
        // Clear local storage
        localStorage.clear();
        
        console.log('✅ Logged out successfully');
        showToast('✅ Logged out successfully');
        
    } catch (error) {
        console.error("❌ Logout error:", error);
        alert('Logout failed: ' + error.message);
    }
}

// Load user data from Firestore
async function loadUserData(user) {
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // Create new user document
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                favorites: [],
                listeningHistory: [],
                isPremium: false,
                totalListeningTime: 0,
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("✅ New user created in Firestore");
        } else {
            // Update last login
            await db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("✅ User data loaded");
        }
    } catch (error) {
        console.error("❌ Error loading user data:", error);
    }
}

// Helper: Show Toast
function showToast(message) {
    // Check if function exists in pwa-install.js
    if (typeof window.showToast === 'function') {
        window.showToast(message);
    } else {
        // Fallback
        console.log('Toast:', message);
    }
}

console.log('✅ Auth.js ready');
