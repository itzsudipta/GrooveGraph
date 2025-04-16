export const loadEnvVariables = () => {
    const config = {
        clientId: 'c3c6f141c28441f9bdd0988863be0d92', // Only the client ID here
        redirectUri: 'https://itzsudipta.github.io/GrooveGraph/callback.html',
        authEndpoint: 'https://accounts.spotify.com/authorize',
        tokenEndpoint: 'https://your-backend-server.com/exchange-token', // Backend endpoint for token exchange
        apiEndpoint: 'https://api.spotify.com/v1'
    };

    return config;
};
