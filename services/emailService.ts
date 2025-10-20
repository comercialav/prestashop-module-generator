/**
 * Sends an email notification by calling a secure backend proxy.
 *
 * =================================================================================
 * CRITICAL: THIS IS NOW A PRODUCTION-READY SERVICE
 * =================================================================================
 * The development mock has been removed. This function now makes a REAL network
 * request to a backend endpoint. For this to work, you MUST:
 *
 * 1.  **Deploy a Backend Proxy:**
 *     - The backend code is now located at `/api/send-email.ts`.
 *     - Vercel will automatically deploy this as a serverless function.
 *     - During deployment, set the `RESEND_API_KEY` environment variable with
 *       your key from https://resend.com/. The key MUST start with `re_`.
 *
 * 2.  **Configure the URL Below:**
 *     - The URL has been updated to the absolute path of your Vercel deployment
 *       to ensure the connection is stable.
 *
 * @param moduleName The name of the module being sent.
 * @param zipAsBase64 The generated module zip file, encoded as a base64 string.
 * @param recipientEmail The email address to send the module to.
 * @returns A promise that resolves on success or throws a detailed error on failure.
 */

// UPDATED: Using the full, absolute URL to your Vercel deployment as requested.
// This ensures the frontend knows exactly where to send the request.
// If this still fails, the most likely cause is a missing or INVALID `RESEND_API_KEY`
// in your Vercel project's environment variables.
const BACKEND_PROXY_URL = 'https://prestashop-module-generator.vercel.app/api/send-email';

export async function sendEmailNotification(moduleName: string, zipAsBase64: string, recipientEmail: string): Promise<void> {
    if (!recipientEmail) {
        throw new Error("Recipient email cannot be empty.");
    }
    
    const emailPayload = {
        to: [recipientEmail],
        subject: `Your PrestaShop Module "${moduleName}" is Ready!`,
        html: `
            <h1>Module Generation Complete</h1>
            <p>Hello,</p>
            <p>The PrestaShop module "<strong>${moduleName}</strong>" has been successfully generated.</p>
            <p>You can find the complete module attached to this email as a .zip file.</p>
            <br>
            <p>Best regards,</p>
            <p><strong>PrestaShop ModuleGenius AI</strong></p>
        `,
        attachments: [
            {
                filename: `${moduleName}.zip`,
                content: zipAsBase64,
            },
        ],
    };

    let response: Response;
    try {
        console.log(`DEBUG (emailService): Attempting to POST to ${BACKEND_PROXY_URL}`);
        response = await fetch(BACKEND_PROXY_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload),
        });
        console.log(`DEBUG (emailService): Received response from proxy with status: ${response.status}`);

    } catch (error) {
        console.error("DEBUG (emailService): Fetch failed.", error);
        if (error instanceof TypeError && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
             throw new Error(
                'FAIL: Network Error. Could not connect to the backend. Please check your Vercel deployment logs for errors related to the `/api/send-email` function. Also, verify the URL is correct and the backend is running.'
            );
        }
        throw new Error(`FAIL: An unexpected network error occurred: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!response.ok) {
        console.error(`DEBUG (emailService): Proxy returned an error status: ${response.status} ${response.statusText}`);
        const errorBodyText = await response.text(); // Get raw text first to avoid losing it
        
        try {
            // Try to parse it as JSON for a structured error message
            const errorBodyJSON = JSON.parse(errorBodyText);
            console.error('DEBUG (emailService): Proxy error body (JSON):', JSON.stringify(errorBodyJSON, null, 2));

            // Extract a clean message from known error structures
            const errorMessage = errorBodyJSON.message || 
                                 (errorBodyJSON.name && errorBodyJSON.message ? `Resend API Error (${errorBodyJSON.name}): ${errorBodyJSON.message}` : 
                                 JSON.stringify(errorBodyJSON));
            throw new Error(`FAIL: The backend proxy reported an error: ${errorMessage}`);
        } catch (jsonError) {
            // If it's not JSON, it might be a Vercel error page or simple text
            console.error('DEBUG (emailService): Could not parse error body as JSON. Raw text:', errorBodyText);
            throw new Error(`FAIL: Backend proxy returned a non-JSON error (Status: ${response.status}). Raw response: "${errorBodyText.substring(0, 200)}..."`);
        }
    }

    console.log('DEBUG (emailService): Proxy returned success. Email sending process complete from frontend perspective.');
}