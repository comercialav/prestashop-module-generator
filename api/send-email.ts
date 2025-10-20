// Import the Resend SDK. Your deployment environment (like Vercel)
// will need to install this dependency.
import { Resend } from 'resend';

// This is an example for a Vercel Edge Function environment.
export const config = {
  runtime: 'edge',
};

// Define CORS headers. Allowing all origins ('*') is essential for the browser
// to permit the request from your frontend.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};


export default async function handler(request: Request) {
  console.log(`--- [PROXY LOG] New Request Received: ${request.method} ---`);

  // Handle CORS preflight requests from the browser. This is a critical step.
  // The browser sends an OPTIONS request first to check if the server will allow the actual POST request.
  if (request.method === 'OPTIONS') {
    console.log('[PROXY LOG] Handling OPTIONS preflight request. Sending CORS headers.');
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Reject any method that is not POST.
  if (request.method !== 'POST') {
    console.warn(`[PROXY LOG] Denied non-POST request (method: ${request.method})`);
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // Check for the Resend API key on the server.
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[PROXY LOG] FATAL: RESEND_API_KEY environment variable not found on the server.');
    return new Response(JSON.stringify({ message: 'Server configuration error: API key missing.' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
  console.log('[PROXY LOG] RESEND_API_KEY found.');

  // Initialize Resend with the secret key from the server's environment.
  const resend = new Resend(apiKey);

  try {
    const frontendPayload = await request.json();
    console.log('[PROXY LOG] Successfully parsed JSON payload from frontend.');

    // Prepare the payload for the Resend SDK.
    const resendPayload = {
      from: 'PrestaShop ModuleGenius <onboarding@resend.dev>',
      to: frontendPayload.to,
      subject: frontendPayload.subject,
      html: frontendPayload.html,
      attachments: frontendPayload.attachments,
    };
    
    console.log('[PROXY LOG] Sending request to Resend API...');
    const { data, error } = await resend.emails.send(resendPayload);

    if (error) {
      console.error('[PROXY LOG] Resend SDK returned an error:', error);
      // Forward the detailed error from the SDK to our frontend.
      return new Response(JSON.stringify(error), {
        status: 400, // Bad Request, as the payload might have been invalid.
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    console.log('[PROXY LOG] Resend SDK call successful. Sending success response back to frontend.');
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[PROXY LOG] An unexpected error occurred in the handler: ${errorMessage}`);
    return new Response(JSON.stringify({ message: `Proxy handler error: ${errorMessage}` }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
}
