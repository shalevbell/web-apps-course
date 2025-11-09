// Video Player with Viewing Progress Tracking

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const contentId = urlParams.get('contentId');
// Try both possible localStorage keys for profile ID
const profileId = localStorage.getItem('activeProfileId') || localStorage.getItem('selectedProfileId');

// DOM Elements
const videoPlayer = document.getElementById('videoPlayer');
const videoSource = document.getElementById('videoSource');
const playPauseBtn = document.getElementById('playPauseBtn');
const centerPlayBtn = document.getElementById('centerPlayBtn');
const rewindBtn = document.getElementById('rewindBtn');
const forwardBtn = document.getElementById('forwardBtn');
const progressBar = document.getElementById('progressBar');
const progressFilled = document.getElementById('progressFilled');
const currentTimeDisplay = document.getElementById('currentTime');
const durationDisplay = document.getElementById('duration');
const volumeBtn = document.getElementById('volumeBtn');
const volumeSlider = document.getElementById('volumeSlider');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const controlsOverlay = document.getElementById('controlsOverlay');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const backBtn = document.getElementById('backBtn');
const errorBackBtn = document.getElementById('errorBackBtn');
const contentTitle = document.getElementById('contentTitle');
const contentDescription = document.getElementById('contentDescription');

// State
let content = null;
let lastSavedTime = 0;
let controlsTimeout = null;
let isMouseMoving = false;
let resumeTime = 0; // Store the time to resume from

// Initialize player
async function initializePlayer() {
    console.log('=== Video Player Initialization ===');
    console.log('Content ID from URL:', contentId);
    console.log('Profile ID from localStorage:', profileId);
    console.log('localStorage keys:', Object.keys(localStorage));
    console.log('All localStorage:', { ...localStorage });

    if (!contentId || !profileId) {
        console.error('Missing required data:', { contentId, profileId });
        showError('Invalid content or profile. Please try again.');
        return;
    }

    try {
        console.log('Fetching content from API...');
        // Fetch content details
        const contentResponse = await fetch('/api/content');
        if (!contentResponse.ok) {
            throw new Error(`Failed to fetch content: ${contentResponse.status}`);
        }
        const allContent = await contentResponse.json();
        console.log(`Fetched ${allContent.length} content items`);

        content = allContent.find(c => c.id === parseInt(contentId));
        console.log('Found content:', content ? content.name : 'NOT FOUND');

        if (!content) {
            console.error('Content not found for ID:', contentId);
            showError('Content not found.');
            return;
        }

        // Update content info
        contentTitle.textContent = content.name;
        contentDescription.textContent = content.description;

        // Check if video URL exists
        console.log('Video URL:', content.videoUrl);
        if (!content.videoUrl) {
            console.warn('No video URL for content:', content.name);
            showError('This content does not have a video available yet. Demo video URLs can be added by an admin.');
            return;
        }

        // Determine if videoUrl is a full URL or a local path
        let videoSrc;
        if (content.videoUrl.startsWith('http://') || content.videoUrl.startsWith('https://')) {
            // It's a full URL, use as-is
            videoSrc = content.videoUrl;
            console.log('Using external URL:', videoSrc);
        } else {
            // It's a local path relative to public directory
            // Ensure path starts with ./ for consistency with other assets
            if (!content.videoUrl.startsWith('./') && !content.videoUrl.startsWith('/')) {
                videoSrc = `./_videos/${content.videoUrl}`;
            } else {
                videoSrc = content.videoUrl;
            }
            console.log('Using local path:', videoSrc);
        }

        // Set video source
        console.log('Setting video source to:', videoSrc);
        videoSource.src = videoSrc;
        videoPlayer.load();

        // Load viewing progress
        console.log('Loading viewing progress...');
        await loadViewingProgress();

        // Setup event listeners
        console.log('Setting up event listeners...');
        setupEventListeners();

        console.log('=== Player initialized successfully ===');
        console.log(`Now playing: ${content.name} (ID: ${content.id})`);

    } catch (error) {
        console.error('Error initializing player:', error);
        console.error('Error stack:', error.stack);
        showError('Failed to load video. Please try again.');
    }
}

// Load viewing progress from server
async function loadViewingProgress() {
    try {
        console.log(`Fetching viewing progress for profile ${profileId}, content ${contentId}`);
        const response = await fetch(`/api/profiles/${profileId}/viewing-history/${contentId}`);
        const result = await response.json();
        console.log('Viewing progress response:', result);

        if (result.success && result.data && result.data.currentTime > 0) {
            resumeTime = result.data.currentTime;
            lastSavedTime = resumeTime;
            console.log(`✓ Will resume from ${formatTime(resumeTime)} once metadata is loaded`);
        } else {
            console.log('No saved progress found, starting from beginning');
        }
    } catch (error) {
        console.error('Error loading viewing progress:', error);
        console.log('Continuing without saved progress...');
        // Continue without saved progress
    }
}

// Save viewing progress to server
async function saveViewingProgress() {
    if (!profileId || !contentId) {
        console.warn('Cannot save progress: missing profileId or contentId');
        return;
    }

    const currentTime = Math.floor(videoPlayer.currentTime);
    const duration = Math.floor(videoPlayer.duration);

    // Only save if time has changed significantly (more than 5 seconds)
    if (Math.abs(currentTime - lastSavedTime) < 5) {
        return;
    }

    const completed = (duration - currentTime) < 30; // Mark as completed if within 30 seconds of end

    try {
        const response = await fetch(`/api/profiles/${profileId}/viewing-history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contentId: parseInt(contentId),
                currentTime: currentTime,
                duration: duration,
                completed: completed
            })
        });

        if (response.ok) {
            lastSavedTime = currentTime;
            console.log(`✓ Progress saved: ${formatTime(currentTime)} / ${formatTime(duration)}${completed ? ' [COMPLETED]' : ''}`);
        } else {
            console.error('Failed to save progress:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error saving viewing progress:', error);
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Video events
    videoPlayer.addEventListener('loadedmetadata', onLoadedMetadata);
    videoPlayer.addEventListener('timeupdate', onTimeUpdate);
    videoPlayer.addEventListener('play', onPlay);
    videoPlayer.addEventListener('pause', onPause);
    videoPlayer.addEventListener('ended', onEnded);
    videoPlayer.addEventListener('waiting', () => loadingSpinner.style.display = 'flex');
    videoPlayer.addEventListener('playing', () => loadingSpinner.style.display = 'none');

    // Control buttons
    playPauseBtn.addEventListener('click', togglePlayPause);
    centerPlayBtn.addEventListener('click', togglePlayPause);
    rewindBtn.addEventListener('click', () => skip(-10));
    forwardBtn.addEventListener('click', () => skip(10));
    progressBar.addEventListener('input', onProgressBarChange);
    volumeBtn.addEventListener('click', toggleMute);
    volumeSlider.addEventListener('input', onVolumeChange);
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    backBtn.addEventListener('click', goBack);
    errorBackBtn.addEventListener('click', goBack);

    // Mouse movement for controls visibility
    document.addEventListener('mousemove', showControls);
    videoPlayer.addEventListener('click', togglePlayPause);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);

    // Save progress periodically
    setInterval(saveViewingProgress, 10000); // Save every 10 seconds

    // Save progress when leaving page
    window.addEventListener('beforeunload', saveViewingProgress);
}

// Video event handlers
function onLoadedMetadata() {
    durationDisplay.textContent = formatTime(videoPlayer.duration);
    progressBar.max = videoPlayer.duration;
    loadingSpinner.style.display = 'none';

    // Resume from saved position if available
    if (resumeTime > 0) {
        videoPlayer.currentTime = resumeTime;
        console.log(`✓ Resumed playback from ${formatTime(resumeTime)}`);
    }
}

function onTimeUpdate() {
    if (!isNaN(videoPlayer.duration)) {
        // Update progress bar
        const percentage = (videoPlayer.currentTime / videoPlayer.duration) * 100;
        progressBar.value = videoPlayer.currentTime;
        progressFilled.style.width = percentage + '%';

        // Update time display
        currentTimeDisplay.textContent = formatTime(videoPlayer.currentTime);
    }
}

function onPlay() {
    playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
    centerPlayBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
    centerPlayBtn.style.display = 'none';
}

function onPause() {
    playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
    centerPlayBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
    centerPlayBtn.style.display = 'flex';
    saveViewingProgress(); // Save when paused
}

function onEnded() {
    centerPlayBtn.style.display = 'flex';
    centerPlayBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i>';
    saveViewingProgress(); // Save final progress
}

// Control functions
function togglePlayPause() {
    if (videoPlayer.paused) {
        videoPlayer.play();
    } else {
        videoPlayer.pause();
    }
}

function skip(seconds) {
    videoPlayer.currentTime += seconds;
    saveViewingProgress();
}

function onProgressBarChange(e) {
    videoPlayer.currentTime = e.target.value;
}

function toggleMute() {
    videoPlayer.muted = !videoPlayer.muted;
    updateVolumeIcon();
}

function onVolumeChange(e) {
    videoPlayer.volume = e.target.value / 100;
    videoPlayer.muted = false;
    updateVolumeIcon();
}

function updateVolumeIcon() {
    const icon = volumeBtn.querySelector('i');
    if (videoPlayer.muted || videoPlayer.volume === 0) {
        icon.className = 'bi bi-volume-mute-fill';
    } else if (videoPlayer.volume < 0.5) {
        icon.className = 'bi bi-volume-down-fill';
    } else {
        icon.className = 'bi bi-volume-up-fill';
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.querySelector('.player-container').requestFullscreen();
        fullscreenBtn.innerHTML = '<i class="bi bi-fullscreen-exit"></i>';
    } else {
        document.exitFullscreen();
        fullscreenBtn.innerHTML = '<i class="bi bi-arrows-fullscreen"></i>';
    }
}

function goBack() {
    saveViewingProgress(); // Save before leaving
    // Check if there's history to go back to, otherwise redirect to feed
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = '/feed.html';
    }
}

// Controls visibility
function showControls() {
    isMouseMoving = true;
    controlsOverlay.classList.add('visible');
    document.querySelector('.player-container').style.cursor = 'default';

    clearTimeout(controlsTimeout);

    if (!videoPlayer.paused) {
        controlsTimeout = setTimeout(() => {
            controlsOverlay.classList.remove('visible');
            document.querySelector('.player-container').style.cursor = 'none';
            isMouseMoving = false;
        }, 3000);
    }
}

// Keyboard shortcuts
function handleKeyboard(e) {
    switch(e.key) {
        case ' ':
        case 'k':
            e.preventDefault();
            togglePlayPause();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            skip(-10);
            break;
        case 'ArrowRight':
            e.preventDefault();
            skip(10);
            break;
        case 'ArrowUp':
            e.preventDefault();
            videoPlayer.volume = Math.min(1, videoPlayer.volume + 0.1);
            volumeSlider.value = videoPlayer.volume * 100;
            updateVolumeIcon();
            break;
        case 'ArrowDown':
            e.preventDefault();
            videoPlayer.volume = Math.max(0, videoPlayer.volume - 0.1);
            volumeSlider.value = videoPlayer.volume * 100;
            updateVolumeIcon();
            break;
        case 'f':
            e.preventDefault();
            toggleFullscreen();
            break;
        case 'm':
            e.preventDefault();
            toggleMute();
            break;
    }
}

// Utility functions
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
    document.querySelector('.video-wrapper').style.display = 'none';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializePlayer);
