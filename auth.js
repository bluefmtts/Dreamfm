// Authentication System
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
        loginBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        userName.textContent = user.displayName || user.email;
        userPhoto.src = user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=6B46C1&color=fff`;
    } else {
        loginBtn.style.display = 'block';
        userInfo.style.display = 'none';
    }
}

// Google Login
async function loginWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        console.log("Google login success:", result.user);
    } catch (error) {
        console.error("Login error:", error);
        alert("Login failed: " + error.message);
    }
}

// Email Login (for later)
async function loginWithEmail(email, password) {
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        console.error("Email login error:", error);
    }
}

// Logout
async function logout() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error("Logout error:", error);
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
                isPremium: false
            });
            console.log("New user created in Firestore");
        }
    } catch (error) {
        console.error("Error loading user data:", error);
    }
}
