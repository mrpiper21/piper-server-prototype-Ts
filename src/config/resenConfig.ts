import dotenv from "dotenv";
import { Resend } from "resend";

// Load environment variables
dotenv.config();

// Get API key from environment
const apiKey = process.env.RESEND_API_KEY;

// Create Resend instance only if API key is available
// This allows the app to start even if email service is not configured
let resend: Resend | null = null;

if (apiKey) {
	try {
		resend = new Resend(apiKey);
	} catch (error) {
		console.warn("Failed to initialize Resend:", error);
	}
} else {
	console.warn(
		"RESEND_API_KEY is not set. Email functionality will be disabled."
	);
}

// Export a wrapper that handles missing Resend instance
export default {
	emails: {
		send: async (options: any) => {
			if (!resend) {
				console.error(
					"Resend is not initialized. Please set RESEND_API_KEY in your environment variables."
				);
				return {
					data: null,
					error: {
						message: "Email service is not configured. RESEND_API_KEY is missing.",
					},
				};
			}
			return resend.emails.send(options);
		},
	},
};