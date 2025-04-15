const SPOTIFY_CONFIG = {
    clientId: "c3c6f141c28441f9bdd0988863be0d92", // Replace with your actual Spotify Client ID
    redirectUri: 'https://itzsudipta.github.io/GrooveGraph/callback.html',
    scopes: ['user-top-read', 'user-read-recently-played'],
    authEndpoint: 'https://accounts.spotify.com/authorize'
};

class SpotifyAuth {
    constructor(config) {
        this.config = config;
    }

    generateState() {
        return crypto.getRandomValues(new Uint8Array(16)).join('');
    }

    async initiateLogin() {
        try {
            const state = this.generateState();
            sessionStorage.setItem('spotify_auth_state', state);

            const params = new URLSearchParams({
                client_id: this.config.clientId,
                response_type: 'token', // <- Changed here
                redirect_uri: this.config.redirectUri,
                scope: this.config.scopes.join(' '),
                state: state
            });

            window.location.href = `${this.config.authEndpoint}?${params.toString()}`;
        } catch (error) {
            console.error('Login initialization failed:', error);
            this.handleError('Failed to initialize login');
        }
    }

    handleError(message) {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }
}

class DataVisualizer {
    constructor() {
        this.chartElement = document.getElementById('tracks-chart');
    }

    showLoading() {
        if (this.chartElement) {
            this.chartElement.innerHTML = `
                <div class="loading-spinner">
                    <span>Loading your top tracks...</span>
                </div>`;
        }
    }

    displayError(message) {
        if (this.chartElement) {
            this.chartElement.innerHTML = `
                <div class="error-message">
                    <p>${message}</p>
                    <button onclick="location.reload()">Try Again</button>
                </div>`;
        }
    }

    async displayTopTracks(tracks) {
        if (!this.chartElement) return;

        try {
            // Placeholder: You can add chart logic here
            this.chartElement.innerHTML = 'Top tracks data will be displayed here.';
        } catch (error) {
            this.displayError('Failed to display tracks data');
        }
    }
}

// Initialize components
const spotifyAuth = new SpotifyAuth(SPOTIFY_CONFIG);
const dataVisualizer = new DataVisualizer();

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', () => spotifyAuth.initiateLogin());
    }

    // Initialize data display if user is already authenticated
    if (sessionStorage.getItem('spotify_access_token')) {
        dataVisualizer.showLoading();
        fetchTopTracks();
    }
});

// API Functions
async function fetchTopTracks() {
    try {
        const accessToken = sessionStorage.getItem('spotify_access_token');
        if (!accessToken) {
            throw new Error('No access token available');
        }

        dataVisualizer.showLoading();

        // Simulated API call (replace with actual fetch)
        setTimeout(() => {
            dataVisualizer.displayTopTracks([]);
        }, 2000);

    } catch (error) {
        console.error('Error fetching top tracks:', error);
        dataVisualizer.displayError('Failed to fetch your top tracks');
    }
}
