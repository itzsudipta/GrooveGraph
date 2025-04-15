const SPOTIFY_CONFIG = {
    clientId: 'c3c6f141c28441f9bdd0988863be0d92',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '', // Add your client secret in .env
    redirectUri: 'https://itzsudipta.github.io/GrooveGraph/callback.html',
    homePageUrl: 'https://itzsudipta.github.io/GrooveGraph/',
    authEndpoint: 'https://accounts.spotify.com/authorize',
    tokenEndpoint: 'https://accounts.spotify.com/api/token',
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
            const response = await fetch(this.config.tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(`${this.config.clientId}:${this.config.clientSecret}`)
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: this.config.redirectUri
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Token exchange failed: ${errorData.error}`);
            }

            const data = await response.json();
            this.saveTokenData(data);
            window.location.href = this.config.homePageUrl;
        } catch (error) {
            console.error('Token exchange error:', error);
            this.handleError('Authentication failed');
        }
    }

    saveTokenData(data) {
        sessionStorage.setItem('spotify_access_token', data.access_token);
        sessionStorage.setItem('spotify_refresh_token', data.refresh_token);
        sessionStorage.setItem('spotify_token_expiry', Date.now() + (data.expires_in * 1000));
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
            this.chartElement.innerHTML = `
                <div class="tracks-container">
                    <h2>Your Top Tracks</h2>
                    <div class="tracks-list">
                        ${tracks.map(track => `
                            <div class="track-item">
                                <img src="${track.album.images[2].url}" alt="${track.name}" />
                                <div class="track-info">
                                    <span class="track-name">${track.name}</span>
                                    <span class="artist-name">${track.artists[0].name}</span>
                                </div>
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