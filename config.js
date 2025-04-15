export const loadEnvVariables = () => {
    const config = {
        clientId: process.env.SPOTIFY_CLIENT_ID || 'c3c6f141c28441f9bdd0988863be0d92',
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        redirectUri: 'https://itzsudipta.github.io/GrooveGraph/callback.html',
        authEndpoint: 'https://accounts.spotify.com/authorize',
        tokenEndpoint: 'https://accounts.spotify.com/api/token',
        apiEndpoint: 'https://api.spotify.com/v1'
    };

    if (!config.clientSecret) {
        console.warn('Environment variables not loaded. Using development configuration.');
    }

    return config;
};