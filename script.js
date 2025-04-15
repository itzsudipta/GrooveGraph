const SPOTIFY_CONFIG = {
    clientId: 'c3c6f141c28441f9bdd0988863be0d92',
    redirectUri: 'https://itzsudipta.github.io/GrooveGraph/callback.html', // Remove encodeURIComponent
    authEndpoint: 'https://accounts.spotify.com/authorize',
    apiEndpoint: 'https://api.spotify.com/v1',
    scopes: [
        'user-top-read',
        'user-read-private',
        'user-read-email',
        'user-read-recently-played',
        'playlist-read-private',
        'user-library-read'
    ].join(' ')
};

class SpotifyAuth {
    constructor(config) {
        this.config = config;
        this.checkAuthenticationOnLoad();
    }

    checkAuthenticationOnLoad() {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const storedState = sessionStorage.getItem('spotify_auth_state');

        if (code && state === storedState) {
            this.exchangeCodeForToken(code);
        }
    }

    generateState() {
        return crypto.randomUUID();
    }

    async initiateLogin() {
        try {
            const state = this.generateState();
            sessionStorage.setItem('spotify_auth_state', state);

            const params = new URLSearchParams({
                client_id: this.config.clientId,
                response_type: 'code',
                redirect_uri: this.config.redirectUri,
                scope: this.config.scopes,
                state: state,
                show_dialog: true
            });

            window.location.href = `${this.config.authEndpoint}?${params}`;
        } catch (error) {
            this.handleError('Failed to initialize login');
        }
    }

    async exchangeCodeForToken(code) {
        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: this.config.redirectUri,
                    client_id: this.config.clientId
                })
            });

            if (!response.ok) throw new Error('Token exchange failed');

            const data = await response.json();
            sessionStorage.setItem('spotify_access_token', data.access_token);
            sessionStorage.setItem('spotify_refresh_token', data.refresh_token);

            window.location.href = '/'; // Redirect to main page
        } catch (error) {
            this.handleError('Authentication failed');
        }
    }

    handleError(message) {
        console.error(message);
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
                    <div class="spinner"></div>
                    <span>Loading your top tracks...</span>
                </div>`;
        }
    }

    displayError(message) {
        if (this.chartElement) {
            this.chartElement.innerHTML = `
                <div class="error-message">
                    <p>${message}</p>
                    <button class="retry-button" onclick="location.reload()">Try Again</button>
                </div>`;
        }
    }

    async displayTopTracks(tracks) {
        if (!this.chartElement || !tracks.length) {
            this.displayError('No tracks available');
            return;
        }

        try {
            // Implementation will be added in next iteration
            this.chartElement.innerHTML = `
                <div class="tracks-container">
                    <h2>Your Top Tracks</h2>
                    <div class="tracks-list">
                        ${tracks.map(track => `
                            <div class="track-item">
                                <span>${track.name}</span>
                                <span>${track.artists[0].name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
        } catch (error) {
            this.displayError('Failed to display tracks data');
        }
    }
}

async function fetchTopTracks() {
    try {
        const accessToken = sessionStorage.getItem('spotify_access_token');
        if (!accessToken) throw new Error('No access token available');

        const response = await fetch(`${SPOTIFY_CONFIG.apiEndpoint}/me/top/tracks`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch tracks');

        const data = await response.json();
        return data.items;
    } catch (error) {
        console.error('Error fetching top tracks:', error);
        throw error;
    }
}

// Initialize components
const spotifyAuth = new SpotifyAuth(SPOTIFY_CONFIG);
const dataVisualizer = new DataVisualizer();

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', () => spotifyAuth.initiateLogin());
    }

    if (sessionStorage.getItem('spotify_access_token')) {
        try {
            dataVisualizer.showLoading();
            const tracks = await fetchTopTracks();
            dataVisualizer.displayTopTracks(tracks);
        } catch (error) {
            dataVisualizer.displayError('Failed to load your music data');
        }
    }
});
