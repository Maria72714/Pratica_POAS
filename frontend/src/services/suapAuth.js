const CLIENT_ID = '6IPsGy1xSQlxdmEydLEfygqTVwoH06vkxdCwyZQa';
const REDIRECT_URI = 'http://localhost:5173/callback';

const SUAP_AUTH_URL =
  `https://suap.ifrn.edu.br/o/authorize/?response_type=code` +
  `&client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

export function login() {
  window.location.href = SUAP_AUTH_URL;
}
