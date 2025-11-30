/**
 * Service for sending print job completion notifications to clients
 */
import Client from "../models/client.model.js";
import brevo from "../config/brevoConfig.js";
import {
	generateClientJobCompletionEmail,
	generateClientJobCompletionEmailText,
} from "../utils/emailTemplates.js";

interface ClientJobCompletionData {
	clientName: string;
	fileName?: string | null;
	artwork?: string;
	size?: string;
	quantity?: number;
	location?: string;
	jobId: string;
	completedAt: Date | string;
	categoryType?: string;
	categoryName?: string;
	indexNumber?: string;
	dateOfBirth?: string;
	yearOfCompletion?: string;
}

/**
 * Send email notification to client when their print job is completed
 */
export async function notifyClientOfJobCompletion(
	clientId: string,
	jobData: ClientJobCompletionData
): Promise<void> {
	try {
		// Find the client
		const client = await Client.findById(clientId).select("email fullName");

		if (!client) {
			console.log(`Client not found for clientId: ${clientId}`);
			return;
		}

		// Generate email content
		const emailHtml = generateClientJobCompletionEmail({
			...jobData,
			clientName: client.fullName,
		});

		const emailText = generateClientJobCompletionEmailText({
			...jobData,
			clientName: client.fullName,
		});

		// Generate subject based on category type
		const categoryName = jobData.categoryName || "Print Job";
		const subject = `Your ${categoryName} is Ready for Pickup`;

		// Send email
		const { error } = await brevo.emails.send({
			from:
				process.env.BREVO_SENDER_EMAIL ||
				"noreply@example.com",
			to: client.email,
			subject: subject,
			html: emailHtml,
			text: emailText,
		});

		if (error) {
			console.error(
				`Failed to send job completion notification to client ${client.email}:`,
				error.message
			);
		} else {
			console.log(`Job completion notification sent to client ${client.email}`);
		}
	} catch (error: any) {
		console.error("Error in notifyClientOfJobCompletion:", error.message);
		// Don't throw - email failures shouldn't break the status update
	}
}

