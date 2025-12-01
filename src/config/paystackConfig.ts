import dotenv from "dotenv";
import axios from "axios";
import type { AxiosInstance } from "axios";

// Load environment variables
dotenv.config();

// Get Paystack secret key from environment
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

if (!paystackSecretKey) {
	console.warn(
		"PAYSTACK_SECRET_KEY is not defined in environment variables. Payment features will be disabled."
	);
}

// Create axios instance for Paystack API
const paystackApi: AxiosInstance = axios.create({
	baseURL: "https://api.paystack.co",
	headers: {
		Authorization: `Bearer ${paystackSecretKey}`,
		"Content-Type": "application/json",
	},
});

// Export helper function to check if Paystack is configured
export const isPaystackConfigured = (): boolean => {
	return !!paystackSecretKey;
};

// Export paystack API instance
export { paystackApi };

