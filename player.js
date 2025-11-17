// ============================================
// DREAMFM SECURE AUDIO PLAYER (MOBILE OPTIMIZED)
// ============================================

console.log("🎧 Secure Player.js loaded");

// Global Player State
const PlayerState = {
    currentBook: null,
    currentChapter: 1,
    isPlaying: false,
    audioElement: null,
    playbackSpeed: 1.0,
    volume: 1.0,
    blobUrl: null
};

// 🔒 SECURITY: Disable Right Click
document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'AUDIO' || e.target.closest('.full-player')) {
        e.preventDefault();
        showToast('⚠️ Download not allowed');
    }
});

// 🔒 Disable download shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey && e.key === 's') || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        e.key === 'F12' ||
        (e.ctrlKey && e.key === 'u')) {
        if (document.getElementById('fullPlayer').style.display !== 'none') {
            e.preventDefault();
            showToast('⚠️ Action not allowed');
        }
    }
});

// Initialize Player
function initializePlayer() {
    PlayerState.audioElement = document.getElementById('audioElement');
    
    if (!PlayerState.audioElement) {
        console.error("❌ Audio element not found!");
        return;
    }
    
    PlayerState.audioElement.controls = false;
    PlayerState.audioElement.controlsList = 'nodownload noplaybackrate';
    
    // Event Listeners
    PlayerState.audioElement.addEventListener('loadedmetadata', onAudioLoaded);
    PlayerState.audioElement.addEventListener('timeupdate', onTimeUpdate);
    PlayerState.audioElement.addEventListener('ended', onAudioEnded);
    PlayerState.audioElement.addEventListener('error', onAudioError);
    
    // Control Buttons
    document.getElementById('miniPlayBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlayPause();
    });
    
    document.getElementById('playPauseBtn')?.addEventListener('click', togglePlayPause);
    document.getElementById('prevChapterBtn')?.addEventListener('click', previousChapter);
    document.getElementById('nextChapterBtn')?.addEventListener('click', nextChapter);
    document.getElementById('closePlayer')?.addEventListener('click', closeFullPlayer);
    document.getElementById('miniPlayerClick')?.addEventListener('click', openFullPlayer);
    document.getElementById('seekBar')?.addEventListener('input', onSeek);
    document.getElementById('volumeSlider')?.addEventListener('input', onVolumeChange);
    document.getElementById('speedBtn')?.addEventListener('click', cycleSpeed);
    document.getElementById('chaptersBtn')?.addEventListener('click', toggleChaptersList);
    document.getElementById('volumeBtn')?.addEventListener('click', toggleVolumePanel);
    
    // Forward/Rewind buttons
    document.getElementById('forward10')?.addEventListener('click', () => {
        if (PlayerState.audioElement) {
            PlayerState.audioElement.currentTime += 10;
        }
    });
    
    document.getElementById('rewind10')?.addEventListener('click', () => {
        if (PlayerState.audioElement) {
            PlayerState.audioElement.currentTime -= 10;
        }
    });
    
    // Swipe down to close (mobile)
    setupSwipeToClose();
    
    console.log("✅ Secure Player initialized");
}

// 🔒 Secure Audio Loading
function playAudiobook(bookId, bookData) {
    console.log("🎵 Playing:", bookData.title);
    
    PlayerState.currentBook = {
        id: bookId,
        ...bookData
    };
    PlayerState.currentChapter = 1;
    
    updatePlayerUI();
    loadChapter(1);
    
    document.getElementById('miniPlayer').style.display = 'block';
    openFullPlayer();
}

// Make it global
window.playAudiobook = playAudiobook;

// Load Chapter with Blob URL
async function loadChapter(chapterNum) {
    const book = PlayerState.currentBook;
    
    if (!book) {
        console.error("❌ No book loaded");
        return;
    }
    
    PlayerState.currentChapter = chapterNum;
    
    // Clean up old blob
    if (PlayerState.blobUrl) {
        URL.revokeObjectURL(PlayerState.blobUrl);
    }
    
    const audioUrl = generateAudioURL(book.audioSlug, chapterNum);
    console.log("🔒 Loading secure audio:", audioUrl);
    
    try {
        showToast(`📖 Loading Chapter ${chapterNum}...`);
        
        const response = await fetch(audioUrl);
        
        if (!response.ok) {
            throw new Error('Chapter not available');
        }
        
        const blob = await response.blob();
        PlayerState.blobUrl = URL.createObjectURL(blob);
        
        PlayerState.audioElement.src = PlayerState.blobUrl;
        PlayerState.audioElement.load();
        
        updatePlayerUI();
        showToast(`✅ Chapter ${chapterNum} loaded`);
        
    } catch (error) {
        console.error('❌ Load error:', error);
        showToast(`❌ Chapter ${chapterNum} not available`);
    }
}

// Generate Audio URL
function generateAudioURL(audioSlug, chapterNum) {
    const WORKER_URL = 'https://gentle-union-d9c6.singhvikas21571.workers.dev';
    return `${WORKER_URL}/${audioSlug}/chapter-${chapterNum}.mp3`;
}

// Update Player UI
function updatePlayerUI() {
    const book = PlayerState.currentBook;
    if (!book) return;
    
    const chapterNum = PlayerState.currentChapter;
    
    // Mini Player
    document.getElementById('miniCover').src = book.coverUrl;
    document.getElementById('miniTitle').textContent = book.title;
    document.getElementById('miniChapter').textContent = `Chapter ${chapterNum}`;
    
    // Full Player
    document.getElementById('playerCoverImg').src = book.coverUrl;
    document.getElementById('playerBookTitle').textContent = book.title;
    document.getElementById('playerAuthor').textContent = book.author;
    document.getElementById('playerChapterTitle').textContent = `Chapter ${chapterNum} of ${book.totalChapters}`;
    
    updatePlayButton();
    loadChaptersList();
}

// Toggle Play/Pause
function togglePlayPause() {
    if (!PlayerState.audioElement || !PlayerState.audioElement.src) {
        showToast("⚠️ No audio loaded");
        return;
    }
    
    if (PlayerState.isPlaying) {
        PlayerState.audioElement.pause();
        PlayerState.isPlaying = false;
    } else {
        PlayerState.audioElement.play()
            .then(() => {
                PlayerState.isPlaying = true;
                updatePlayButton();
            })
            .catch(err => {
                console.error("❌ Play error:", err);
                showToast("❌ Failed to play audio");
            });
    }
    
    updatePlayButton();
}

// Update Play Button
function updatePlayButton() {
    const icon = PlayerState.isPlaying ? '⏸️' : '▶️';
    
    const miniBtn = document.getElementById('miniPlayBtn');
    const fullBtn = document.getElementById('playPauseBtn');
    
    if (miniBtn) miniBtn.textContent = icon;
    if (fullBtn) fullBtn.textContent = icon;
}

// Previous/Next Chapter
function previousChapter() {
    if (PlayerState.currentChapter > 1) {
        loadChapter(PlayerState.currentChapter - 1);
        if (PlayerState.isPlaying) {
            setTimeout(() => PlayerState.audioElement.play(), 200);
        }
    } else {
        showToast("⚠️ First chapter");
    }
}

function nextChapter() {
    const book = PlayerState.currentBook;
    if (book && PlayerState.currentChapter < book.totalChapters) {
        loadChapter(PlayerState.currentChapter + 1);
        if (PlayerState.isPlaying) {
            setTimeout(() => PlayerState.audioElement.play(), 200);
        }
    } else {
        showToast("⚠️ Last chapter");
    }
}

// Audio Event Handlers
function onAudioLoaded() {
    const duration = PlayerState.audioElement.duration;
    console.log("✅ Audio loaded, duration:", formatTime(duration));
    document.getElementById('durationDisplay').textContent = formatTime(duration);
}

function onTimeUpdate() {
    const current = PlayerState.audioElement.currentTime;
    const duration = PlayerState.audioElement.duration;
    
    if (duration > 0) {
        const percentage = (current / duration) * 100;
        
        document.getElementById('miniProgressBar').style.width = percentage + '%';
        document.getElementById('seekBar').value = percentage;
        document.getElementById('currentTimeDisplay').textContent = formatTime(current);
    }
}

function onAudioEnded() {
    console.log("✅ Chapter ended");
    PlayerState.isPlaying = false;
    updatePlayButton();
    
    // Auto play next chapter
    setTimeout(() => nextChapter(), 1000);
}

function onAudioError(e) {
    console.error("❌ Audio error:", e);
    showToast('❌ Audio file not found!');
    PlayerState.isPlaying = false;
    updatePlayButton();
}

// Seek
function onSeek(e) {
    const percentage = e.target.value;
    const duration = PlayerState.audioElement.duration;
    
    if (duration > 0) {
        PlayerState.audioElement.currentTime = (percentage / 100) * duration;
    }
}

// Volume
function onVolumeChange(e) {
    const volume = e.target.value / 100;
    PlayerState.audioElement.volume = volume;
    PlayerState.volume = volume;
}

function toggleVolumePanel() {
    const panel = document.getElementById('volumeControl');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

// Speed
function cycleSpeed() {
    const speeds = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
    const currentIndex = speeds.indexOf(PlayerState.playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    
    PlayerState.playbackSpeed = speeds[nextIndex];
    PlayerState.audioElement.playbackRate = PlayerState.playbackSpeed;
    
    document.getElementById('speedText').textContent = PlayerState.playbackSpeed + 'x';
    showToast(`⚡ Speed: ${PlayerState.playbackSpeed}x`);
}

// Chapters List
function toggleChaptersList() {
    const list = document.getElementById('chaptersList');
    if (list) {
        list.style.display = list.style.display === 'none' ? 'block' : 'none';
    }
}

function loadChaptersList() {
    const book = PlayerState.currentBook;
    if (!book) return;
    
    const container = document.getElementById('chaptersContent');
    container.innerHTML = '';
    
    for (let i = 1; i <= book.totalChapters; i++) {
        const chapterDiv = document.createElement('div');
        chapterDiv.className = 'chapter-item';
        if (i === PlayerState.currentChapter) {
            chapterDiv.classList.add('active');
        }
        
        chapterDiv.innerHTML = `<div>📖 Chapter ${i}</div>`;
        
        chapterDiv.addEventListener('click', () => {
            loadChapter(i);
            if (PlayerState.isPlaying) {
                setTimeout(() => PlayerState.audioElement.play(), 200);
            }
        });
        
        container.appendChild(chapterDiv);
    }
}

// Open/Close Player
function openFullPlayer() {
    const fullPlayer = document.getElementById('fullPlayer');
    fullPlayer.style.display = 'block';
    document.body.style.overflow = 'hidden';
    setTimeout(() => fullPlayer.classList.add('active'), 10);
}

function closeFullPlayer() {
    const fullPlayer = document.getElementById('fullPlayer');
    fullPlayer.classList.remove('active');
    setTimeout(() => {
        fullPlayer.style.display = 'none';
        document.body.style.overflow = '';
    }, 300);
}

// Swipe to Close (Mobile)
function setupSwipeToClose() {
    const fullPlayer = document.getElementById('fullPlayer');
    let startY = 0;
    let currentY = 0;
    
    fullPlayer?.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
    }, { passive: true });
    
    fullPlayer?.addEventListener('touchmove', (e) => {
        currentY = e.touches[0].clientY;
        const diff = currentY - startY;
        
        if (diff > 0 && diff < 300) {
            fullPlayer.style.transform = `translateY(${diff}px)`;
        }
    }, { passive: true });
    
    fullPlayer?.addEventListener('touchend', () => {
        const diff = currentY - startY;
        
        if (diff > 150) {
            closeFullPlayer();
        } else {
            fullPlayer.style.transform = 'translateY(0)';
        }
    });
}

// Format Time
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Cleanup
window.addEventListener('beforeunload', () => {
    if (PlayerState.blobUrl) {
        URL.revokeObjectURL(PlayerState.blobUrl);
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', initializePlayer);

console.log("✅ Player ready!");
