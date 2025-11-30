/**
 * Service for sending print job notifications to clerks
 */
import Clerk from "../models/clerk.model.js";
import brevo from "../config/brevoConfig.js";
import {
	generatePrintJobNotificationEmail,
	generatePrintJobNotificationEmailText,
} from "../utils/emailTemplates.js";

interface PrintJobData {
	fileName?: string | null;
	artwork?: string;
	size?: string;
	quantity?: number;
	location?: string;
	jobId: string;
	submittedAt: Date | string;
	categoryType?: string;
	categoryName?: string;
}

/**
 * Send email notifications to all clerks for a new print job
 */
export async function notifyClerksOfNewPrintJob(
	adminId: string,
	printJobData: PrintJobData
): Promise<void> {
	try {
		// Find all active clerks for this admin
		const clerks = await Clerk.find({ adminId, isActive: true }).select(
			"email name"
		);

		if (!clerks || clerks.length === 0) {
			console.log(`No active clerks found for adminId: ${adminId}`);
			return;
		}

		// Send email to each clerk
		const emailPromises = clerks.map(async (clerk) => {
			try {
				const emailHtml = generatePrintJobNotificationEmail({
					clerkName: clerk.name,
					...printJobData,
				});

				const emailText = generatePrintJobNotificationEmailText({
					clerkName: clerk.name,
					...printJobData,
				});

				// Generate subject based on category type
				const categoryName = printJobData.categoryName || "Print Job";
				const fileName = printJobData.fileName || "No file";
				const subject = `New ${categoryName}: ${fileName}`;

				const { error } = await brevo.emails.send({
					from: process.env.BREVO_SENDER_EMAIL || "noreply@example.com",
					to: clerk.email,
					subject: subject,
					html: emailHtml,
					text: emailText,
				});

				if (error) {
					console.error(
						`Failed to send print job notification to ${clerk.email}:`,
						error.message
					);
				} else {
					console.log(`Print job notification sent to ${clerk.email}`);
				}
			} catch (error: any) {
				console.error(
					`Error sending notification to clerk ${clerk.email}:`,
					error.message
				);
			}
		});

		// Wait for all emails to be sent (don't fail if some fail)
		await Promise.allSettled(emailPromises);
	} catch (error: any) {
		console.error("Error in notifyClerksOfNewPrintJob:", error.message);
		// Don't throw - email failures shouldn't break the print job submission
	}
}

