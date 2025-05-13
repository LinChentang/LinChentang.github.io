const fetch = require('node-fetch'); // 如果函数需要，确保安装了此依赖

exports.handler = async (event, context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://linchentang.netlify.app', // 或者你的自定义域名
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed', headers: corsHeaders };
  }

  try {
    const { code } = JSON.parse(event.body);

    if (!code) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Authorization code not provided.' }), headers: corsHeaders };
    }

    const GITHUB_CLIENT_ID = process.env.GITALK_OAUTH_CLIENT_ID;
    const GITHUB_CLIENT_SECRET = process.env.GITALK_OAUTH_CLIENT_SECRET;

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      console.error('Server OAuth credentials not configured.');
      return { statusCode: 500, body: JSON.stringify({ error: 'OAuth credentials not configured on server.' }), headers: corsHeaders };
    }

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });

    const data = await response.json();

    if (response.ok && data.access_token) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ access_token: data.access_token }),
      };
    } else {
      console.error('Error from GitHub:', data);
      return { statusCode: response.status, body: JSON.stringify({ error: data.error_description || 'Failed to get token' }), headers: corsHeaders };
    }
  } catch (error) {
    console.error('Proxy Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal Server Error in proxy.' }),
    };
  }
};