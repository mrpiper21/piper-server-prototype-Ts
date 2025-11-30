/**
 * Email template utilities for sending formatted emails
 */

interface ClerkWelcomeEmailData {
	name: string;
	email: string;
	temporaryPassword: string;
	adminName?: string;
}

/**
 * Generate HTML email template for clerk welcome email
 */
export function generateClerkWelcomeEmail(data: ClerkWelcomeEmailData): string {
	const { name, email, temporaryPassword, adminName } = data;
	const appName = "Print Agent"
	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Welcome to ${appName}</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			line-height: 1.6;
			color: #333333;
			background-color: #f4f4f4;
		}
		.email-container {
			max-width: 600px;
			margin: 0 auto;
			background-color: #ffffff;
		}
		.email-header {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			padding: 40px 20px;
			text-align: center;
			color: #ffffff;
		}
		.email-header h1 {
			font-size: 28px;
			font-weight: 600;
			margin-bottom: 10px;
		}
		.email-body {
			padding: 40px 30px;
		}
		.greeting {
			font-size: 18px;
			font-weight: 600;
			color: #333333;
			margin-bottom: 20px;
		}
		.content {
			font-size: 16px;
			color: #555555;
			margin-bottom: 30px;
			line-height: 1.8;
		}
		.credentials-box {
			background-color: #f8f9fa;
			border-left: 4px solid #667eea;
			padding: 20px;
			margin: 30px 0;
			border-radius: 4px;
		}
		.credentials-box h3 {
			font-size: 16px;
			font-weight: 600;
			color: #333333;
			margin-bottom: 15px;
		}
		.credential-item {
			margin-bottom: 12px;
		}
		.credential-label {
			font-size: 14px;
			font-weight: 600;
			color: #666666;
			display: inline-block;
			width: 120px;
		}
		.credential-value {
			font-size: 14px;
			color: #333333;
			font-family: 'Courier New', monospace;
			background-color: #ffffff;
			padding: 6px 12px;
			border-radius: 4px;
			display: inline-block;
		}
		.password-warning {
			background-color: #fff3cd;
			border-left: 4px solid #ffc107;
			padding: 15px;
			margin: 25px 0;
			border-radius: 4px;
		}
		.password-warning p {
			font-size: 14px;
			color: #856404;
			margin: 0;
		}
		.cta-button {
			display: inline-block;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #ffffff;
			text-decoration: none;
			padding: 14px 32px;
			border-radius: 6px;
			font-weight: 600;
			font-size: 16px;
			margin: 25px 0;
			text-align: center;
		}
		.cta-button:hover {
			opacity: 0.9;
		}
		.footer {
			background-color: #f8f9fa;
			padding: 30px;
			text-align: center;
			border-top: 1px solid #e9ecef;
		}
		.footer p {
			font-size: 14px;
			color: #666666;
			margin-bottom: 10px;
		}
		.footer a {
			color: #667eea;
			text-decoration: none;
		}
		.divider {
			height: 1px;
			background-color: #e9ecef;
			margin: 30px 0;
		}
	</style>
</head>
<body>
	<div class="email-container">
		<div class="email-header">
			<h1>Welcome to ${appName}!</h1>
			<p style="margin-top: 10px; opacity: 0.9;">Your account has been created</p>
		</div>
		
		<div class="email-body">
			<div class="greeting">Hello ${name},</div>
			
			<div class="content">
				${adminName 
					? `<p>${adminName} has created a clerk account for you on the ${appName}. You can now access the system using the credentials below.</p>`
					: `<p>Your clerk account has been created on the ${appName}. You can now access the system using the credentials below.</p>`
				}
			</div>
			
			<div class="credentials-box">
				<h3>Your Login Credentials</h3>
				<div class="credential-item">
					<span class="credential-label">Email:</span>
					<span class="credential-value">${email}</span>
				</div>
				<div class="credential-item">
					<span class="credential-label">Password:</span>
					<span class="credential-value">${temporaryPassword}</span>
				</div>
			</div>
			
			<div class="password-warning">
				<p><strong>⚠️ Important:</strong> This is a temporary password. Please change it after your first login for security purposes.</p>
			</div>
			
			<div class="divider"></div>
			
			<div class="content" style="font-size: 14px; color: #666666;">
				<p><strong>Next Steps:</strong></p>
				<ul style="margin-left: 20px; margin-top: 10px;">
					<li>Open the ${appName} desktop application</li>
					<li>Use the credentials provided above to sign in</li>
					<li>Change your password immediately after first login</li>
					<li>If you have any questions, please contact your administrator</li>
				</ul>
			</div>
		</div>
		
		<div class="footer">
			<p>This is an automated email from ${appName}</p>
			<p>If you did not expect this email, please contact your administrator</p>
		</div>
	</div>
</body>
</html>
	`.trim();
}

/**
 * Generate plain text version of clerk welcome email
 */
export function generateClerkWelcomeEmailText(data: ClerkWelcomeEmailData): string {
	const { name, email, temporaryPassword, adminName } = data;
	const appName = process.env.APP_NAME || "Printer Management System";

	return `
Welcome to ${appName}!

Hello ${name},

${adminName 
	? `${adminName} has created a clerk account for you on the ${appName}. You can now access the system using the credentials below.`
	: `Your clerk account has been created on the ${appName}. You can now access the system using the credentials below.`
}

Your Login Credentials:
Email: ${email}
Password: ${temporaryPassword}

⚠️ Important: This is a temporary password. Please change it after your first login for security purposes.

Next Steps:
1. Open the ${appName} desktop application
2. Use the credentials provided above to sign in
3. Change your password immediately after first login
4. If you have any questions, please contact your administrator

This is an automated email from ${appName}
If you did not expect this email, please contact your administrator
	`.trim();
}

interface PrintJobNotificationData {
	clerkName: string;
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
 * Get category-specific email template based on category type
 */
export function generatePrintJobNotificationEmail(data: PrintJobNotificationData): string {
	const categoryType = data.categoryType;
	
	switch (categoryType) {
		case "wassce_result":
			return generateWassceResultEmail(data);
		case "bece_result":
			return generateBeceResultEmail(data);
		case "novdec_result":
			return generateNovdecResultEmail(data);
		case "large_format":
			return generateLargeFormatEmail(data);
		case "regular_format":
			return generateRegularFormatEmail(data);
		default:
			return generateDefaultPrintJobEmail(data);
	}
}

/**
 * Generate default HTML email template for new print job notification
 */
function generateDefaultPrintJobEmail(data: PrintJobNotificationData): string {
	const { clerkName, fileName, artwork, size, quantity, location, jobId, submittedAt, categoryName } = data;
	const appName = "Print Agent";
	const formattedDate = new Date(submittedAt).toLocaleString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
	const displayFileName = fileName || "No file attached";

	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>New Print Job - ${appName}</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			line-height: 1.6;
			color: #333333;
			background-color: #f4f4f4;
		}
		.email-container {
			max-width: 600px;
			margin: 0 auto;
			background-color: #ffffff;
		}
		.email-header {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			padding: 40px 20px;
			text-align: center;
			color: #ffffff;
		}
		.email-header h1 {
			font-size: 28px;
			font-weight: 600;
			margin-bottom: 10px;
		}
		.email-body {
			padding: 40px 30px;
		}
		.greeting {
			font-size: 18px;
			font-weight: 600;
			color: #333333;
			margin-bottom: 20px;
		}
		.content {
			font-size: 16px;
			color: #555555;
			margin-bottom: 30px;
			line-height: 1.8;
		}
		.job-info-box {
			background-color: #f8f9fa;
			border-left: 4px solid #667eea;
			padding: 20px;
			margin: 30px 0;
			border-radius: 4px;
		}
		.job-info-box h3 {
			font-size: 18px;
			font-weight: 600;
			color: #333333;
			margin-bottom: 20px;
		}
		.info-row {
			display: flex;
			justify-content: space-between;
			padding: 12px 0;
			border-bottom: 1px solid #e9ecef;
		}
		.info-row:last-child {
			border-bottom: none;
		}
		.info-label {
			font-size: 14px;
			font-weight: 600;
			color: #666666;
			flex: 1;
		}
		.info-value {
			font-size: 14px;
			color: #333333;
			flex: 1;
			text-align: right;
			font-weight: 500;
		}
		.status-badge {
			display: inline-block;
			background-color: #ffc107;
			color: #856404;
			padding: 6px 12px;
			border-radius: 20px;
			font-size: 12px;
			font-weight: 600;
			text-transform: uppercase;
		}
		.alert-box {
			background-color: #e7f3ff;
			border-left: 4px solid #2196F3;
			padding: 15px;
			margin: 25px 0;
			border-radius: 4px;
		}
		.alert-box p {
			font-size: 14px;
			color: #1976D2;
			margin: 0;
		}
		.footer {
			background-color: #f8f9fa;
			padding: 30px;
			text-align: center;
			border-top: 1px solid #e9ecef;
		}
		.footer p {
			font-size: 14px;
			color: #666666;
			margin-bottom: 10px;
		}
	</style>
</head>
<body>
	<div class="email-container">
		<div class="email-header">
			<h1>🖨️ New Print Job</h1>
			<p style="margin-top: 10px; opacity: 0.9;">A new job has been submitted</p>
		</div>
		
		<div class="email-body">
			<div class="greeting">Hello ${clerkName},</div>
			
			<div class="content">
				<p>A new print job has been submitted and is waiting for processing.</p>
			</div>
			
			<div class="job-info-box">
				<h3>Job Details</h3>
				${categoryName ? `
				<div class="info-row">
					<span class="info-label">Category:</span>
					<span class="info-value">${categoryName}</span>
				</div>
				` : ''}
				${fileName ? `
				<div class="info-row">
					<span class="info-label">File Name:</span>
					<span class="info-value">${displayFileName}</span>
				</div>
				` : ''}
				<div class="info-row">
					<span class="info-label">Artwork:</span>
					<span class="info-value">${artwork}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Size:</span>
					<span class="info-value">${size}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Quantity:</span>
					<span class="info-value">${quantity}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Location:</span>
					<span class="info-value">${location}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Status:</span>
					<span class="info-value"><span class="status-badge">Pending</span></span>
				</div>
				<div class="info-row">
					<span class="info-label">Submitted:</span>
					<span class="info-value">${formattedDate}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Job ID:</span>
					<span class="info-value" style="font-family: 'Courier New', monospace; font-size: 12px;">${jobId}</span>
				</div>
			</div>
			
			<div class="alert-box">
				<p><strong>📋 Action Required:</strong> Please process this job in the ${appName} application.</p>
			</div>
		</div>
		
		<div class="footer">
			<p>This is an automated notification from ${appName}</p>
			<p>Please check your dashboard for more details</p>
		</div>
	</div>
</body>
</html>
	`.trim();
}

/**
 * Generate plain text version of print job notification email
 */
export function generatePrintJobNotificationEmailText(data: PrintJobNotificationData): string {
	const categoryType = data.categoryType;
	
	switch (categoryType) {
		case "wassce_result":
			return generateWassceResultEmailText(data);
		case "bece_result":
			return generateBeceResultEmailText(data);
		case "novdec_result":
			return generateNovdecResultEmailText(data);
		case "large_format":
			return generateLargeFormatEmailText(data);
		case "regular_format":
			return generateRegularFormatEmailText(data);
		default:
			return generateDefaultPrintJobEmailText(data);
	}
}

/**
 * Generate default plain text email template
 */
function generateDefaultPrintJobEmailText(data: PrintJobNotificationData): string {
	const { clerkName, fileName, artwork, size, quantity, location, jobId, submittedAt, categoryName } = data;
	const appName = "Print Agent";
	const formattedDate = new Date(submittedAt).toLocaleString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
	const displayFileName = fileName || "No file attached";

	return `
New Print Job - ${appName}

Hello ${clerkName},

A new print job has been submitted and is waiting for processing.

Job Details:
-----------
${categoryName ? `Category: ${categoryName}\n` : ''}${fileName ? `File Name: ${displayFileName}\n` : ''}Artwork: ${artwork}
Size: ${size}
Quantity: ${quantity}
Location: ${location}
Status: PENDING
Submitted: ${formattedDate}
Job ID: ${jobId}

Action Required: Please process this job in the ${appName} application.

This is an automated notification from ${appName}
Please check your dashboard for more details
	`.trim();
}

/**
 * Generate WASSCE Result email template
 */
function generateWassceResultEmail(data: PrintJobNotificationData): string {
	const { clerkName, artwork = "", size = "", quantity = 0, location = "", jobId, submittedAt } = data;
	const appName = "Print Agent";
	const formattedDate = new Date(submittedAt).toLocaleString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>WASSCE Result Print Job - ${appName}</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			line-height: 1.6;
			color: #333333;
			background-color: #f4f4f4;
		}
		.email-container {
			max-width: 600px;
			margin: 0 auto;
			background-color: #ffffff;
		}
		.email-header {
			background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
			padding: 40px 20px;
			text-align: center;
			color: #ffffff;
		}
		.email-header h1 {
			font-size: 28px;
			font-weight: 600;
			margin-bottom: 10px;
		}
		.email-body {
			padding: 40px 30px;
		}
		.greeting {
			font-size: 18px;
			font-weight: 600;
			color: #333333;
			margin-bottom: 20px;
		}
		.content {
			font-size: 16px;
			color: #555555;
			margin-bottom: 30px;
			line-height: 1.8;
		}
		.job-info-box {
			background-color: #e3f2fd;
			border-left: 4px solid #1e88e5;
			padding: 20px;
			margin: 30px 0;
			border-radius: 4px;
		}
		.job-info-box h3 {
			font-size: 18px;
			font-weight: 600;
			color: #1565c0;
			margin-bottom: 20px;
		}
		.info-row {
			display: flex;
			justify-content: space-between;
			padding: 12px 0;
			border-bottom: 1px solid #bbdefb;
		}
		.info-row:last-child {
			border-bottom: none;
		}
		.info-label {
			font-size: 14px;
			font-weight: 600;
			color: #1976d2;
			flex: 1;
		}
		.info-value {
			font-size: 14px;
			color: #333333;
			flex: 1;
			text-align: right;
			font-weight: 500;
		}
		.status-badge {
			display: inline-block;
			background-color: #ffc107;
			color: #856404;
			padding: 6px 12px;
			border-radius: 20px;
			font-size: 12px;
			font-weight: 600;
			text-transform: uppercase;
		}
		.alert-box {
			background-color: #fff3e0;
			border-left: 4px solid #ff9800;
			padding: 15px;
			margin: 25px 0;
			border-radius: 4px;
		}
		.alert-box p {
			font-size: 14px;
			color: #e65100;
			margin: 0;
		}
		.footer {
			background-color: #f8f9fa;
			padding: 30px;
			text-align: center;
			border-top: 1px solid #e9ecef;
		}
		.footer p {
			font-size: 14px;
			color: #666666;
			margin-bottom: 10px;
		}
	</style>
</head>
<body>
	<div class="email-container">
		<div class="email-header">
			<h1>📋 WASSCE Result Print Job</h1>
			<p style="margin-top: 10px; opacity: 0.9;">A new WASSCE result form has been submitted</p>
		</div>
		
		<div class="email-body">
			<div class="greeting">Hello ${clerkName},</div>
			
			<div class="content">
				<p>A new WASSCE result print job has been submitted and is waiting for processing.</p>
				<p style="margin-top: 10px;"><strong>Note:</strong> This is a result form that does not require a file upload.</p>
			</div>
			
			<div class="job-info-box">
				<h3>Job Details</h3>
				<div class="info-row">
					<span class="info-label">Category:</span>
					<span class="info-value">WASSCE Result</span>
				</div>
				<div class="info-row">
					<span class="info-label">Artwork:</span>
					<span class="info-value">${artwork}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Size:</span>
					<span class="info-value">${size}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Quantity:</span>
					<span class="info-value">${quantity}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Location:</span>
					<span class="info-value">${location}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Status:</span>
					<span class="info-value"><span class="status-badge">Pending</span></span>
				</div>
				<div class="info-row">
					<span class="info-label">Submitted:</span>
					<span class="info-value">${formattedDate}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Job ID:</span>
					<span class="info-value" style="font-family: 'Courier New', monospace; font-size: 12px;">${jobId}</span>
				</div>
			</div>
			
			<div class="alert-box">
				<p><strong>📋 Action Required:</strong> Please process this WASSCE result form in the ${appName} application.</p>
			</div>
		</div>
		
		<div class="footer">
			<p>This is an automated notification from ${appName}</p>
			<p>Please check your dashboard for more details</p>
		</div>
	</div>
</body>
</html>
	`.trim();
}

/**
 * Generate BECE Result email template
 */
function generateBeceResultEmail(data: PrintJobNotificationData): string {
	const { clerkName, artwork = "", size = "", quantity = 0, location = "", jobId, submittedAt } = data;
	const appName = "Print Agent";
	const formattedDate = new Date(submittedAt).toLocaleString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>BECE Result Print Job - ${appName}</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			line-height: 1.6;
			color: #333333;
			background-color: #f4f4f4;
		}
		.email-container {
			max-width: 600px;
			margin: 0 auto;
			background-color: #ffffff;
		}
		.email-header {
			background: linear-gradient(135deg, #43a047 0%, #2e7d32 100%);
			padding: 40px 20px;
			text-align: center;
			color: #ffffff;
		}
		.email-header h1 {
			font-size: 28px;
			font-weight: 600;
			margin-bottom: 10px;
		}
		.email-body {
			padding: 40px 30px;
		}
		.greeting {
			font-size: 18px;
			font-weight: 600;
			color: #333333;
			margin-bottom: 20px;
		}
		.content {
			font-size: 16px;
			color: #555555;
			margin-bottom: 30px;
			line-height: 1.8;
		}
		.job-info-box {
			background-color: #e8f5e9;
			border-left: 4px solid #43a047;
			padding: 20px;
			margin: 30px 0;
			border-radius: 4px;
		}
		.job-info-box h3 {
			font-size: 18px;
			font-weight: 600;
			color: #2e7d32;
			margin-bottom: 20px;
		}
		.info-row {
			display: flex;
			justify-content: space-between;
			padding: 12px 0;
			border-bottom: 1px solid #c8e6c9;
		}
		.info-row:last-child {
			border-bottom: none;
		}
		.info-label {
			font-size: 14px;
			font-weight: 600;
			color: #388e3c;
			flex: 1;
		}
		.info-value {
			font-size: 14px;
			color: #333333;
			flex: 1;
			text-align: right;
			font-weight: 500;
		}
		.status-badge {
			display: inline-block;
			background-color: #ffc107;
			color: #856404;
			padding: 6px 12px;
			border-radius: 20px;
			font-size: 12px;
			font-weight: 600;
			text-transform: uppercase;
		}
		.alert-box {
			background-color: #fff3e0;
			border-left: 4px solid #ff9800;
			padding: 15px;
			margin: 25px 0;
			border-radius: 4px;
		}
		.alert-box p {
			font-size: 14px;
			color: #e65100;
			margin: 0;
		}
		.footer {
			background-color: #f8f9fa;
			padding: 30px;
			text-align: center;
			border-top: 1px solid #e9ecef;
		}
		.footer p {
			font-size: 14px;
			color: #666666;
			margin-bottom: 10px;
		}
	</style>
</head>
<body>
	<div class="email-container">
		<div class="email-header">
			<h1>📋 BECE Result Print Job</h1>
			<p style="margin-top: 10px; opacity: 0.9;">A new BECE result form has been submitted</p>
		</div>
		
		<div class="email-body">
			<div class="greeting">Hello ${clerkName},</div>
			
			<div class="content">
				<p>A new BECE result print job has been submitted and is waiting for processing.</p>
				<p style="margin-top: 10px;"><strong>Note:</strong> This is a result form that does not require a file upload.</p>
			</div>
			
			<div class="job-info-box">
				<h3>Job Details</h3>
				<div class="info-row">
					<span class="info-label">Category:</span>
					<span class="info-value">BECE Result</span>
				</div>
				<div class="info-row">
					<span class="info-label">Artwork:</span>
					<span class="info-value">${artwork}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Size:</span>
					<span class="info-value">${size}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Quantity:</span>
					<span class="info-value">${quantity}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Location:</span>
					<span class="info-value">${location}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Status:</span>
					<span class="info-value"><span class="status-badge">Pending</span></span>
				</div>
				<div class="info-row">
					<span class="info-label">Submitted:</span>
					<span class="info-value">${formattedDate}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Job ID:</span>
					<span class="info-value" style="font-family: 'Courier New', monospace; font-size: 12px;">${jobId}</span>
				</div>
			</div>
			
			<div class="alert-box">
				<p><strong>📋 Action Required:</strong> Please process this BECE result form in the ${appName} application.</p>
			</div>
		</div>
		
		<div class="footer">
			<p>This is an automated notification from ${appName}</p>
			<p>Please check your dashboard for more details</p>
		</div>
	</div>
</body>
</html>
	`.trim();
}

/**
 * Generate Nov/Dec Result email template
 */
function generateNovdecResultEmail(data: PrintJobNotificationData): string {
	const { clerkName, artwork = "", size = "", quantity = 0, location = "", jobId, submittedAt } = data;
	const appName = "Print Agent";
	const formattedDate = new Date(submittedAt).toLocaleString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Nov/Dec Result Print Job - ${appName}</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			line-height: 1.6;
			color: #333333;
			background-color: #f4f4f4;
		}
		.email-container {
			max-width: 600px;
			margin: 0 auto;
			background-color: #ffffff;
		}
		.email-header {
			background: linear-gradient(135deg, #7b1fa2 0%, #4a148c 100%);
			padding: 40px 20px;
			text-align: center;
			color: #ffffff;
		}
		.email-header h1 {
			font-size: 28px;
			font-weight: 600;
			margin-bottom: 10px;
		}
		.email-body {
			padding: 40px 30px;
		}
		.greeting {
			font-size: 18px;
			font-weight: 600;
			color: #333333;
			margin-bottom: 20px;
		}
		.content {
			font-size: 16px;
			color: #555555;
			margin-bottom: 30px;
			line-height: 1.8;
		}
		.job-info-box {
			background-color: #f3e5f5;
			border-left: 4px solid #7b1fa2;
			padding: 20px;
			margin: 30px 0;
			border-radius: 4px;
		}
		.job-info-box h3 {
			font-size: 18px;
			font-weight: 600;
			color: #4a148c;
			margin-bottom: 20px;
		}
		.info-row {
			display: flex;
			justify-content: space-between;
			padding: 12px 0;
			border-bottom: 1px solid #ce93d8;
		}
		.info-row:last-child {
			border-bottom: none;
		}
		.info-label {
			font-size: 14px;
			font-weight: 600;
			color: #6a1b9a;
			flex: 1;
		}
		.info-value {
			font-size: 14px;
			color: #333333;
			flex: 1;
			text-align: right;
			font-weight: 500;
		}
		.status-badge {
			display: inline-block;
			background-color: #ffc107;
			color: #856404;
			padding: 6px 12px;
			border-radius: 20px;
			font-size: 12px;
			font-weight: 600;
			text-transform: uppercase;
		}
		.alert-box {
			background-color: #fff3e0;
			border-left: 4px solid #ff9800;
			padding: 15px;
			margin: 25px 0;
			border-radius: 4px;
		}
		.alert-box p {
			font-size: 14px;
			color: #e65100;
			margin: 0;
		}
		.footer {
			background-color: #f8f9fa;
			padding: 30px;
			text-align: center;
			border-top: 1px solid #e9ecef;
		}
		.footer p {
			font-size: 14px;
			color: #666666;
			margin-bottom: 10px;
		}
	</style>
</head>
<body>
	<div class="email-container">
		<div class="email-header">
			<h1>📋 Nov/Dec Result Print Job</h1>
			<p style="margin-top: 10px; opacity: 0.9;">A new Nov/Dec result form has been submitted</p>
		</div>
		
		<div class="email-body">
			<div class="greeting">Hello ${clerkName},</div>
			
			<div class="content">
				<p>A new Nov/Dec result print job has been submitted and is waiting for processing.</p>
				<p style="margin-top: 10px;"><strong>Note:</strong> This is a result form that does not require a file upload.</p>
			</div>
			
			<div class="job-info-box">
				<h3>Job Details</h3>
				<div class="info-row">
					<span class="info-label">Category:</span>
					<span class="info-value">Nov/Dec Result</span>
				</div>
				<div class="info-row">
					<span class="info-label">Artwork:</span>
					<span class="info-value">${artwork}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Size:</span>
					<span class="info-value">${size}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Quantity:</span>
					<span class="info-value">${quantity}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Location:</span>
					<span class="info-value">${location}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Status:</span>
					<span class="info-value"><span class="status-badge">Pending</span></span>
				</div>
				<div class="info-row">
					<span class="info-label">Submitted:</span>
					<span class="info-value">${formattedDate}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Job ID:</span>
					<span class="info-value" style="font-family: 'Courier New', monospace; font-size: 12px;">${jobId}</span>
				</div>
			</div>
			
			<div class="alert-box">
				<p><strong>📋 Action Required:</strong> Please process this Nov/Dec result form in the ${appName} application.</p>
			</div>
		</div>
		
		<div class="footer">
			<p>This is an automated notification from ${appName}</p>
			<p>Please check your dashboard for more details</p>
		</div>
	</div>
</body>
</html>
	`.trim();
}

/**
 * Generate Large Format email template
 */
function generateLargeFormatEmail(data: PrintJobNotificationData): string {
	const { clerkName, fileName, artwork = "", size = "", quantity = 0, location = "", jobId, submittedAt } = data;
	const appName = "Print Agent";
	const formattedDate = new Date(submittedAt).toLocaleString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
	const displayFileName = fileName || "No file attached";

	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Large Format Print Job - ${appName}</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			line-height: 1.6;
			color: #333333;
			background-color: #f4f4f4;
		}
		.email-container {
			max-width: 600px;
			margin: 0 auto;
			background-color: #ffffff;
		}
		.email-header {
			background: linear-gradient(135deg, #f57c00 0%, #e65100 100%);
			padding: 40px 20px;
			text-align: center;
			color: #ffffff;
		}
		.email-header h1 {
			font-size: 28px;
			font-weight: 600;
			margin-bottom: 10px;
		}
		.email-body {
			padding: 40px 30px;
		}
		.greeting {
			font-size: 18px;
			font-weight: 600;
			color: #333333;
			margin-bottom: 20px;
		}
		.content {
			font-size: 16px;
			color: #555555;
			margin-bottom: 30px;
			line-height: 1.8;
		}
		.job-info-box {
			background-color: #fff3e0;
			border-left: 4px solid #f57c00;
			padding: 20px;
			margin: 30px 0;
			border-radius: 4px;
		}
		.job-info-box h3 {
			font-size: 18px;
			font-weight: 600;
			color: #e65100;
			margin-bottom: 20px;
		}
		.info-row {
			display: flex;
			justify-content: space-between;
			padding: 12px 0;
			border-bottom: 1px solid #ffcc80;
		}
		.info-row:last-child {
			border-bottom: none;
		}
		.info-label {
			font-size: 14px;
			font-weight: 600;
			color: #ef6c00;
			flex: 1;
		}
		.info-value {
			font-size: 14px;
			color: #333333;
			flex: 1;
			text-align: right;
			font-weight: 500;
		}
		.status-badge {
			display: inline-block;
			background-color: #ffc107;
			color: #856404;
			padding: 6px 12px;
			border-radius: 20px;
			font-size: 12px;
			font-weight: 600;
			text-transform: uppercase;
		}
		.alert-box {
			background-color: #e7f3ff;
			border-left: 4px solid #2196F3;
			padding: 15px;
			margin: 25px 0;
			border-radius: 4px;
		}
		.alert-box p {
			font-size: 14px;
			color: #1976D2;
			margin: 0;
		}
		.footer {
			background-color: #f8f9fa;
			padding: 30px;
			text-align: center;
			border-top: 1px solid #e9ecef;
		}
		.footer p {
			font-size: 14px;
			color: #666666;
			margin-bottom: 10px;
		}
	</style>
</head>
<body>
	<div class="email-container">
		<div class="email-header">
			<h1>🖨️ Large Format Print Job</h1>
			<p style="margin-top: 10px; opacity: 0.9;">A new large format print job has been submitted</p>
		</div>
		
		<div class="email-body">
			<div class="greeting">Hello ${clerkName},</div>
			
			<div class="content">
				<p>A new large format print job has been submitted and is waiting for processing.</p>
			</div>
			
			<div class="job-info-box">
				<h3>Job Details</h3>
				<div class="info-row">
					<span class="info-label">Category:</span>
					<span class="info-value">Large Format</span>
				</div>
				<div class="info-row">
					<span class="info-label">File Name:</span>
					<span class="info-value">${displayFileName}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Artwork:</span>
					<span class="info-value">${artwork}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Size:</span>
					<span class="info-value">${size}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Quantity:</span>
					<span class="info-value">${quantity}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Location:</span>
					<span class="info-value">${location}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Status:</span>
					<span class="info-value"><span class="status-badge">Pending</span></span>
				</div>
				<div class="info-row">
					<span class="info-label">Submitted:</span>
					<span class="info-value">${formattedDate}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Job ID:</span>
					<span class="info-value" style="font-family: 'Courier New', monospace; font-size: 12px;">${jobId}</span>
				</div>
			</div>
			
			<div class="alert-box">
				<p><strong>📋 Action Required:</strong> Please process this large format print job in the ${appName} application.</p>
			</div>
		</div>
		
		<div class="footer">
			<p>This is an automated notification from ${appName}</p>
			<p>Please check your dashboard for more details</p>
		</div>
	</div>
</body>
</html>
	`.trim();
}

/**
 * Generate Regular Format email template
 */
function generateRegularFormatEmail(data: PrintJobNotificationData): string {
	const { clerkName, fileName, artwork = "", size = "", quantity = 0, location = "", jobId, submittedAt } = data;
	const appName = "Print Agent";
	const formattedDate = new Date(submittedAt).toLocaleString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
	const displayFileName = fileName || "No file attached";

	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Regular Format Print Job - ${appName}</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			line-height: 1.6;
			color: #333333;
			background-color: #f4f4f4;
		}
		.email-container {
			max-width: 600px;
			margin: 0 auto;
			background-color: #ffffff;
		}
		.email-header {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			padding: 40px 20px;
			text-align: center;
			color: #ffffff;
		}
		.email-header h1 {
			font-size: 28px;
			font-weight: 600;
			margin-bottom: 10px;
		}
		.email-body {
			padding: 40px 30px;
		}
		.greeting {
			font-size: 18px;
			font-weight: 600;
			color: #333333;
			margin-bottom: 20px;
		}
		.content {
			font-size: 16px;
			color: #555555;
			margin-bottom: 30px;
			line-height: 1.8;
		}
		.job-info-box {
			background-color: #f8f9fa;
			border-left: 4px solid #667eea;
			padding: 20px;
			margin: 30px 0;
			border-radius: 4px;
		}
		.job-info-box h3 {
			font-size: 18px;
			font-weight: 600;
			color: #333333;
			margin-bottom: 20px;
		}
		.info-row {
			display: flex;
			justify-content: space-between;
			padding: 12px 0;
			border-bottom: 1px solid #e9ecef;
		}
		.info-row:last-child {
			border-bottom: none;
		}
		.info-label {
			font-size: 14px;
			font-weight: 600;
			color: #666666;
			flex: 1;
		}
		.info-value {
			font-size: 14px;
			color: #333333;
			flex: 1;
			text-align: right;
			font-weight: 500;
		}
		.status-badge {
			display: inline-block;
			background-color: #ffc107;
			color: #856404;
			padding: 6px 12px;
			border-radius: 20px;
			font-size: 12px;
			font-weight: 600;
			text-transform: uppercase;
		}
		.alert-box {
			background-color: #e7f3ff;
			border-left: 4px solid #2196F3;
			padding: 15px;
			margin: 25px 0;
			border-radius: 4px;
		}
		.alert-box p {
			font-size: 14px;
			color: #1976D2;
			margin: 0;
		}
		.footer {
			background-color: #f8f9fa;
			padding: 30px;
			text-align: center;
			border-top: 1px solid #e9ecef;
		}
		.footer p {
			font-size: 14px;
			color: #666666;
			margin-bottom: 10px;
		}
	</style>
</head>
<body>
	<div class="email-container">
		<div class="email-header">
			<h1>🖨️ Regular Format Print Job</h1>
			<p style="margin-top: 10px; opacity: 0.9;">A new regular format print job has been submitted</p>
		</div>
		
		<div class="email-body">
			<div class="greeting">Hello ${clerkName},</div>
			
			<div class="content">
				<p>A new regular format print job has been submitted and is waiting for processing.</p>
			</div>
			
			<div class="job-info-box">
				<h3>Job Details</h3>
				<div class="info-row">
					<span class="info-label">Category:</span>
					<span class="info-value">Regular Format</span>
				</div>
				<div class="info-row">
					<span class="info-label">File Name:</span>
					<span class="info-value">${displayFileName}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Artwork:</span>
					<span class="info-value">${artwork}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Size:</span>
					<span class="info-value">${size}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Quantity:</span>
					<span class="info-value">${quantity}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Location:</span>
					<span class="info-value">${location}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Status:</span>
					<span class="info-value"><span class="status-badge">Pending</span></span>
				</div>
				<div class="info-row">
					<span class="info-label">Submitted:</span>
					<span class="info-value">${formattedDate}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Job ID:</span>
					<span class="info-value" style="font-family: 'Courier New', monospace; font-size: 12px;">${jobId}</span>
				</div>
			</div>
			
			<div class="alert-box">
				<p><strong>📋 Action Required:</strong> Please process this regular format print job in the ${appName} application.</p>
			</div>
		</div>
		
		<div class="footer">
			<p>This is an automated notification from ${appName}</p>
			<p>Please check your dashboard for more details</p>
		</div>
	</div>
</body>
</html>
	`.trim();
}

/**
 * Generate plain text versions for each category type
 */
function generateWassceResultEmailText(data: PrintJobNotificationData): string {
	const { clerkName, artwork = "", size = "", quantity = 0, location = "", jobId, submittedAt } = data;
	const appName = "Print Agent";
	const formattedDate = new Date(submittedAt).toLocaleString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	return `
WASSCE Result Print Job - ${appName}

Hello ${clerkName},

A new WASSCE result print job has been submitted and is waiting for processing.

Note: This is a result form that does not require a file upload.

Job Details:
-----------
Category: WASSCE Result
Artwork: ${artwork}
Size: ${size}
Quantity: ${quantity}
Location: ${location}
Status: PENDING
Submitted: ${formattedDate}
Job ID: ${jobId}

Action Required: Please process this WASSCE result form in the ${appName} application.

This is an automated notification from ${appName}
Please check your dashboard for more details
	`.trim();
}

function generateBeceResultEmailText(data: PrintJobNotificationData): string {
	const { clerkName, artwork = "", size = "", quantity = 0, location = "", jobId, submittedAt } = data;
	const appName = "Print Agent";
	const formattedDate = new Date(submittedAt).toLocaleString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	return `
BECE Result Print Job - ${appName}

Hello ${clerkName},

A new BECE result print job has been submitted and is waiting for processing.

Note: This is a result form that does not require a file upload.

Job Details:
-----------
Category: BECE Result
Artwork: ${artwork}
Size: ${size}
Quantity: ${quantity}
Location: ${location}
Status: PENDING
Submitted: ${formattedDate}
Job ID: ${jobId}

Action Required: Please process this BECE result form in the ${appName} application.

This is an automated notification from ${appName}
Please check your dashboard for more details
	`.trim();
}

function generateNovdecResultEmailText(data: PrintJobNotificationData): string {
	const { clerkName, artwork = "", size = "", quantity = 0, location = "", jobId, submittedAt } = data;
	const appName = "Print Agent";
	const formattedDate = new Date(submittedAt).toLocaleString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	return `
Nov/Dec Result Print Job - ${appName}

Hello ${clerkName},

A new Nov/Dec result print job has been submitted and is waiting for processing.

Note: This is a result form that does not require a file upload.

Job Details:
-----------
Category: Nov/Dec Result
Artwork: ${artwork}
Size: ${size}
Quantity: ${quantity}
Location: ${location}
Status: PENDING
Submitted: ${formattedDate}
Job ID: ${jobId}

Action Required: Please process this Nov/Dec result form in the ${appName} application.

This is an automated notification from ${appName}
Please check your dashboard for more details
	`.trim();
}

function generateLargeFormatEmailText(data: PrintJobNotificationData): string {
	const { clerkName, fileName, artwork = "", size = "", quantity = 0, location = "", jobId, submittedAt } = data;
	const appName = "Print Agent";
	const formattedDate = new Date(submittedAt).toLocaleString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
	const displayFileName = fileName || "No file attached";

	return `
Large Format Print Job - ${appName}

Hello ${clerkName},

A new large format print job has been submitted and is waiting for processing.

Job Details:
-----------
Category: Large Format
File Name: ${displayFileName}
Artwork: ${artwork}
Size: ${size}
Quantity: ${quantity}
Location: ${location}
Status: PENDING
Submitted: ${formattedDate}
Job ID: ${jobId}

Action Required: Please process this large format print job in the ${appName} application.

This is an automated notification from ${appName}
Please check your dashboard for more details
	`.trim();
}

function generateRegularFormatEmailText(data: PrintJobNotificationData): string {
	const { clerkName, fileName, artwork = "", size = "", quantity = 0, location = "", jobId, submittedAt } = data;
	const appName = "Print Agent";
	const formattedDate = new Date(submittedAt).toLocaleString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
	const displayFileName = fileName || "No file attached";

	return `
Regular Format Print Job - ${appName}

Hello ${clerkName},

A new regular format print job has been submitted and is waiting for processing.

Job Details:
-----------
Category: Regular Format
File Name: ${displayFileName}
Artwork: ${artwork}
Size: ${size}
Quantity: ${quantity}
Location: ${location}
Status: PENDING
Submitted: ${formattedDate}
Job ID: ${jobId}

Action Required: Please process this regular format print job in the ${appName} application.

This is an automated notification from ${appName}
Please check your dashboard for more details
	`.trim();
}

/**
 * Client Job Completion Email Templates
 */
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
 * Generate HTML email template for client job completion notification
 */
export function generateClientJobCompletionEmail(data: ClientJobCompletionData): string {
	const categoryType = data.categoryType;
	
	switch (categoryType) {
		case "wassce_result":
			return generateWassceClientCompletionEmail(data);
		case "bece_result":
			return generateBeceClientCompletionEmail(data);
		case "novdec_result":
			return generateNovdecClientCompletionEmail(data);
		case "large_format":
			return generateLargeFormatClientCompletionEmail(data);
		case "regular_format":
			return generateRegularFormatClientCompletionEmail(data);
		default:
			return generateDefaultClientCompletionEmail(data);
	}
}

/**
 * Generate plain text version of client job completion email
 */
export function generateClientJobCompletionEmailText(data: ClientJobCompletionData): string {
	const categoryType = data.categoryType;
	
	switch (categoryType) {
		case "wassce_result":
			return generateWassceClientCompletionEmailText(data);
		case "bece_result":
			return generateBeceClientCompletionEmailText(data);
		case "novdec_result":
			return generateNovdecClientCompletionEmailText(data);
		case "large_format":
			return generateLargeFormatClientCompletionEmailText(data);
		case "regular_format":
			return generateRegularFormatClientCompletionEmailText(data);
		default:
			return generateDefaultClientCompletionEmailText(data);
	}
}

/**
 * Generate default client completion email
 */
function generateDefaultClientCompletionEmail(data: ClientJobCompletionData): string {
	const { clientName, fileName, artwork = "", size = "", quantity = 0, location = "", jobId, completedAt, categoryName } = data;
	const appName = "Print Agent";
	const formattedDate = new Date(completedAt).toLocaleString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
	const displayFileName = fileName || "No file attached";

	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Your Print Job is Ready - ${appName}</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			line-height: 1.6;
			color: #333333;
			background-color: #f4f4f4;
		}
		.email-container {
			max-width: 600px;
			margin: 0 auto;
			background-color: #ffffff;
		}
		.email-header {
			background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
			padding: 40px 20px;
			text-align: center;
			color: #ffffff;
		}
		.email-header h1 {
			font-size: 28px;
			font-weight: 600;
			margin-bottom: 10px;
		}
		.email-body {
			padding: 40px 30px;
		}
		.greeting {
			font-size: 18px;
			font-weight: 600;
			color: #333333;
			margin-bottom: 20px;
		}
		.content {
			font-size: 16px;
			color: #555555;
			margin-bottom: 30px;
			line-height: 1.8;
		}
		.success-box {
			background-color: #e8f5e9;
			border-left: 4px solid #4caf50;
			padding: 20px;
			margin: 30px 0;
			border-radius: 4px;
		}
		.success-box h3 {
			font-size: 18px;
			font-weight: 600;
			color: #2e7d32;
			margin-bottom: 20px;
		}
		.info-row {
			display: flex;
			justify-content: space-between;
			padding: 12px 0;
			border-bottom: 1px solid #c8e6c9;
		}
		.info-row:last-child {
			border-bottom: none;
		}
		.info-label {
			font-size: 14px;
			font-weight: 600;
			color: #388e3c;
			flex: 1;
		}
		.info-value {
			font-size: 14px;
			color: #333333;
			flex: 1;
			text-align: right;
			font-weight: 500;
		}
		.status-badge {
			display: inline-block;
			background-color: #4caf50;
			color: #ffffff;
			padding: 6px 12px;
			border-radius: 20px;
			font-size: 12px;
			font-weight: 600;
			text-transform: uppercase;
		}
		.alert-box {
			background-color: #fff3e0;
			border-left: 4px solid #ff9800;
			padding: 15px;
			margin: 25px 0;
			border-radius: 4px;
		}
		.alert-box p {
			font-size: 14px;
			color: #e65100;
			margin: 0;
		}
		.footer {
			background-color: #f8f9fa;
			padding: 30px;
			text-align: center;
			border-top: 1px solid #e9ecef;
		}
		.footer p {
			font-size: 14px;
			color: #666666;
			margin-bottom: 10px;
		}
	</style>
</head>
<body>
	<div class="email-container">
		<div class="email-header">
			<h1>✅ Your Print Job is Ready!</h1>
			<p style="margin-top: 10px; opacity: 0.9;">Your order has been completed</p>
		</div>
		
		<div class="email-body">
			<div class="greeting">Hello ${clientName},</div>
			
			<div class="content">
				<p>Great news! Your print job has been completed and is ready for pickup.</p>
			</div>
			
			<div class="success-box">
				<h3>Job Details</h3>
				${categoryName ? `
				<div class="info-row">
					<span class="info-label">Category:</span>
					<span class="info-value">${categoryName}</span>
				</div>
				` : ''}
				${fileName ? `
				<div class="info-row">
					<span class="info-label">File Name:</span>
					<span class="info-value">${displayFileName}</span>
				</div>
				` : ''}
				<div class="info-row">
					<span class="info-label">Artwork:</span>
					<span class="info-value">${artwork}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Size:</span>
					<span class="info-value">${size}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Quantity:</span>
					<span class="info-value">${quantity}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Pickup Location:</span>
					<span class="info-value">${location}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Status:</span>
					<span class="info-value"><span class="status-badge">Completed</span></span>
				</div>
				<div class="info-row">
					<span class="info-label">Completed:</span>
					<span class="info-value">${formattedDate}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Job ID:</span>
					<span class="info-value" style="font-family: 'Courier New', monospace; font-size: 12px;">${jobId}</span>
				</div>
			</div>
			
			<div class="alert-box">
				<p><strong>📍 Pickup Information:</strong> Please visit ${location} to collect your completed print job. Remember to bring a valid ID.</p>
			</div>
		</div>
		
		<div class="footer">
			<p>Thank you for using ${appName}</p>
			<p>If you have any questions, please contact us</p>
		</div>
	</div>
</body>
</html>
	`.trim();
}

/**
 * Generate default plain text client completion email
 */
function generateDefaultClientCompletionEmailText(data: ClientJobCompletionData): string {
	const { clientName, fileName, artwork = "", size = "", quantity = 0, location = "", jobId, completedAt, categoryName } = data;
	const appName = "Print Agent";
	const formattedDate = new Date(completedAt).toLocaleString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
	const displayFileName = fileName || "No file attached";

	return `
Your Print Job is Ready - ${appName}

Hello ${clientName},

Great news! Your print job has been completed and is ready for pickup.

Job Details:
-----------
${categoryName ? `Category: ${categoryName}\n` : ''}${fileName ? `File Name: ${displayFileName}\n` : ''}Artwork: ${artwork}
Size: ${size}
Quantity: ${quantity}
Pickup Location: ${location}
Status: COMPLETED
Completed: ${formattedDate}
Job ID: ${jobId}

Pickup Information: Please visit ${location} to collect your completed print job. Remember to bring a valid ID.

Thank you for using ${appName}
If you have any questions, please contact us
	`.trim();
}

/**
 * Generate WASSCE Result client completion email
 */
function generateWassceClientCompletionEmail(data: ClientJobCompletionData): string {
	const { clientName, artwork = "", size = "", quantity = 0, location = "", jobId, completedAt, indexNumber = "", dateOfBirth = "", yearOfCompletion = "" } = data;
	const appName = "Print Agent";
	const formattedDate = new Date(completedAt).toLocaleString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Your WASSCE Result is Ready - ${appName}</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			line-height: 1.6;
			color: #333333;
			background-color: #f4f4f4;
		}
		.email-container {
			max-width: 600px;
			margin: 0 auto;
			background-color: #ffffff;
		}
		.email-header {
			background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
			padding: 40px 20px;
			text-align: center;
			color: #ffffff;
		}
		.email-header h1 {
			font-size: 28px;
			font-weight: 600;
			margin-bottom: 10px;
		}
		.email-body {
			padding: 40px 30px;
		}
		.greeting {
			font-size: 18px;
			font-weight: 600;
			color: #333333;
			margin-bottom: 20px;
		}
		.content {
			font-size: 16px;
			color: #555555;
			margin-bottom: 30px;
			line-height: 1.8;
		}
		.success-box {
			background-color: #e3f2fd;
			border-left: 4px solid #1e88e5;
			padding: 20px;
			margin: 30px 0;
			border-radius: 4px;
		}
		.success-box h3 {
			font-size: 18px;
			font-weight: 600;
			color: #1565c0;
			margin-bottom: 20px;
		}
		.info-row {
			display: flex;
			justify-content: space-between;
			padding: 12px 0;
			border-bottom: 1px solid #bbdefb;
		}
		.info-row:last-child {
			border-bottom: none;
		}
		.info-label {
			font-size: 14px;
			font-weight: 600;
			color: #1976d2;
			flex: 1;
		}
		.info-value {
			font-size: 14px;
			color: #333333;
			flex: 1;
			text-align: right;
			font-weight: 500;
		}
		.status-badge {
			display: inline-block;
			background-color: #4caf50;
			color: #ffffff;
			padding: 6px 12px;
			border-radius: 20px;
			font-size: 12px;
			font-weight: 600;
			text-transform: uppercase;
		}
		.alert-box {
			background-color: #fff3e0;
			border-left: 4px solid #ff9800;
			padding: 15px;
			margin: 25px 0;
			border-radius: 4px;
		}
		.alert-box p {
			font-size: 14px;
			color: #e65100;
			margin: 0;
		}
		.footer {
			background-color: #f8f9fa;
			padding: 30px;
			text-align: center;
			border-top: 1px solid #e9ecef;
		}
		.footer p {
			font-size: 14px;
			color: #666666;
			margin-bottom: 10px;
		}
	</style>
</head>
<body>
	<div class="email-container">
		<div class="email-header">
			<h1>✅ Your WASSCE Result is Ready!</h1>
			<p style="margin-top: 10px; opacity: 0.9;">Your WASSCE result form has been completed</p>
		</div>
		
		<div class="email-body">
			<div class="greeting">Hello ${clientName},</div>
			
			<div class="content">
				<p>Great news! Your WASSCE result print job has been completed and is ready for pickup.</p>
			</div>
			
			<div class="success-box">
				<h3>Job Details</h3>
				<div class="info-row">
					<span class="info-label">Category:</span>
					<span class="info-value">WASSCE Result</span>
				</div>
				${indexNumber ? `
				<div class="info-row">
					<span class="info-label">Index Number:</span>
					<span class="info-value">${indexNumber}</span>
				</div>
				` : ''}
				${dateOfBirth ? `
				<div class="info-row">
					<span class="info-label">Date of Birth:</span>
					<span class="info-value">${dateOfBirth}</span>
				</div>
				` : ''}
				${yearOfCompletion ? `
				<div class="info-row">
					<span class="info-label">Year of Completion:</span>
					<span class="info-value">${yearOfCompletion}</span>
				</div>
				` : ''}
				<div class="info-row">
					<span class="info-label">Artwork:</span>
					<span class="info-value">${artwork}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Size:</span>
					<span class="info-value">${size}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Quantity:</span>
					<span class="info-value">${quantity}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Pickup Location:</span>
					<span class="info-value">${location}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Status:</span>
					<span class="info-value"><span class="status-badge">Completed</span></span>
				</div>
				<div class="info-row">
					<span class="info-label">Completed:</span>
					<span class="info-value">${formattedDate}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Job ID:</span>
					<span class="info-value" style="font-family: 'Courier New', monospace; font-size: 12px;">${jobId}</span>
				</div>
			</div>
			
			<div class="alert-box">
				<p><strong>📍 Pickup Information:</strong> Please visit ${location} to collect your completed WASSCE result. Remember to bring a valid ID and your index number for verification.</p>
			</div>
		</div>
		
		<div class="footer">
			<p>Thank you for using ${appName}</p>
			<p>If you have any questions, please contact us</p>
		</div>
	</div>
</body>
</html>
	`.trim();
}

function generateWassceClientCompletionEmailText(data: ClientJobCompletionData): string {
	const { clientName, artwork = "", size = "", quantity = 0, location = "", jobId, completedAt, indexNumber = "", dateOfBirth = "", yearOfCompletion = "" } = data;
	const appName = "Print Agent";
	const formattedDate = new Date(completedAt).toLocaleString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	return `
Your WASSCE Result is Ready - ${appName}

Hello ${clientName},

Great news! Your WASSCE result print job has been completed and is ready for pickup.

Job Details:
-----------
Category: WASSCE Result
${indexNumber ? `Index Number: ${indexNumber}\n` : ''}${dateOfBirth ? `Date of Birth: ${dateOfBirth}\n` : ''}${yearOfCompletion ? `Year of Completion: ${yearOfCompletion}\n` : ''}Artwork: ${artwork}
Size: ${size}
Quantity: ${quantity}
Pickup Location: ${location}
Status: COMPLETED
Completed: ${formattedDate}
Job ID: ${jobId}

Pickup Information: Please visit ${location} to collect your completed WASSCE result. Remember to bring a valid ID and your index number for verification.

Thank you for using ${appName}
If you have any questions, please contact us
	`.trim();
}

/**
 * Generate BECE Result client completion email
 */
function generateBeceClientCompletionEmail(data: ClientJobCompletionData): string {
	return generateWassceClientCompletionEmail({ ...data, categoryName: "BECE Result" }).replace(/WASSCE/g, "BECE");
}

function generateBeceClientCompletionEmailText(data: ClientJobCompletionData): string {
	return generateWassceClientCompletionEmailText({ ...data, categoryName: "BECE Result" }).replace(/WASSCE/g, "BECE");
}

/**
 * Generate Nov/Dec Result client completion email
 */
function generateNovdecClientCompletionEmail(data: ClientJobCompletionData): string {
	return generateWassceClientCompletionEmail({ ...data, categoryName: "Nov/Dec Result" }).replace(/WASSCE/g, "Nov/Dec");
}

function generateNovdecClientCompletionEmailText(data: ClientJobCompletionData): string {
	return generateWassceClientCompletionEmailText({ ...data, categoryName: "Nov/Dec Result" }).replace(/WASSCE/g, "Nov/Dec");
}

/**
 * Generate Large Format client completion email
 */
function generateLargeFormatClientCompletionEmail(data: ClientJobCompletionData): string {
	return generateDefaultClientCompletionEmail({ ...data, categoryName: "Large Format" });
}

function generateLargeFormatClientCompletionEmailText(data: ClientJobCompletionData): string {
	return generateDefaultClientCompletionEmailText({ ...data, categoryName: "Large Format" });
}

/**
 * Generate Regular Format client completion email
 */
function generateRegularFormatClientCompletionEmail(data: ClientJobCompletionData): string {
	return generateDefaultClientCompletionEmail({ ...data, categoryName: "Regular Format" });
}

function generateRegularFormatClientCompletionEmailText(data: ClientJobCompletionData): string {
	return generateDefaultClientCompletionEmailText({ ...data, categoryName: "Regular Format" });
}

/**
 * Business Payment Setup Email Templates
 */
interface BusinessPaymentSetupData {
	adminName: string;
	businessName?: string;
	email: string;
	paystackSubaccountCode: string;
}

/**
 * Generate HTML email template for business payment system setup notification
 */
export function generateBusinessPaymentSetupEmail(data: BusinessPaymentSetupData): string {
	const { adminName, businessName, email, paystackSubaccountCode } = data;
	const appName = process.env.APP_NAME || "Printer Management System";
	const displayName = businessName || adminName;

	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Payment System Setup Complete</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			line-height: 1.6;
			color: #333333;
			background-color: #f4f4f4;
		}
		.email-container {
			max-width: 600px;
			margin: 0 auto;
			background-color: #ffffff;
		}
		.email-header {
			background: linear-gradient(135deg, #10b981 0%, #059669 100%);
			padding: 40px 20px;
			text-align: center;
			color: #ffffff;
		}
		.email-header h1 {
			font-size: 28px;
			font-weight: 600;
			margin-bottom: 10px;
		}
		.email-header .icon {
			font-size: 48px;
			margin-bottom: 10px;
		}
		.email-body {
			padding: 40px 30px;
		}
		.greeting {
			font-size: 18px;
			font-weight: 600;
			color: #1f2937;
			margin-bottom: 20px;
		}
		.message {
			font-size: 16px;
			color: #4b5563;
			margin-bottom: 30px;
			line-height: 1.8;
		}
		.info-box {
			background-color: #f0fdf4;
			border-left: 4px solid #10b981;
			padding: 20px;
			margin: 30px 0;
			border-radius: 4px;
		}
		.info-box-title {
			font-size: 16px;
			font-weight: 600;
			color: #065f46;
			margin-bottom: 10px;
		}
		.info-box-content {
			font-size: 14px;
			color: #047857;
			line-height: 1.6;
		}
		.code-display {
			background-color: #ffffff;
			border: 2px solid #10b981;
			border-radius: 6px;
			padding: 15px;
			margin: 15px 0;
			font-family: 'Courier New', monospace;
			font-size: 16px;
			font-weight: 600;
			color: #059669;
			text-align: center;
			letter-spacing: 1px;
		}
		.benefits-list {
			background-color: #f9fafb;
			padding: 25px;
			margin: 30px 0;
			border-radius: 8px;
		}
		.benefits-list h3 {
			font-size: 18px;
			color: #1f2937;
			margin-bottom: 15px;
		}
		.benefits-list ul {
			list-style: none;
			padding: 0;
		}
		.benefits-list li {
			padding: 10px 0;
			padding-left: 30px;
			position: relative;
			color: #4b5563;
			font-size: 15px;
		}
		.benefits-list li:before {
			content: "✓";
			position: absolute;
			left: 0;
			color: #10b981;
			font-weight: bold;
			font-size: 18px;
		}
		.next-steps {
			background-color: #eff6ff;
			border-left: 4px solid #3b82f6;
			padding: 20px;
			margin: 30px 0;
			border-radius: 4px;
		}
		.next-steps h3 {
			font-size: 16px;
			color: #1e40af;
			margin-bottom: 15px;
		}
		.next-steps ol {
			margin-left: 20px;
			color: #1e3a8a;
		}
		.next-steps li {
			margin: 8px 0;
			line-height: 1.6;
		}
		.email-footer {
			background-color: #f9fafb;
			padding: 30px;
			text-align: center;
			border-top: 1px solid #e5e7eb;
		}
		.email-footer p {
			font-size: 14px;
			color: #6b7280;
			margin: 5px 0;
		}
		.support-link {
			color: #3b82f6;
			text-decoration: none;
		}
		.support-link:hover {
			text-decoration: underline;
		}
	</style>
</head>
<body>
	<div class="email-container">
		<div class="email-header">
			<div class="icon">✅</div>
			<h1>Payment System Setup Complete!</h1>
		</div>
		<div class="email-body">
			<div class="greeting">
				Hello ${adminName},
			</div>
			<div class="message">
				Great news! Your business payment system has been successfully set up and configured. 
				${businessName ? `Your business <strong>${businessName}</strong> is now ready to accept payments.` : 'You can now start accepting payments through the platform.'}
			</div>
			
			<div class="info-box">
				<div class="info-box-title">📋 Payment Account Details</div>
				<div class="info-box-content">
					Your Paystack subaccount has been successfully linked to your business account.
				</div>
				<div class="code-display">
					Subaccount Code: ${paystackSubaccountCode}
				</div>
			</div>

			<div class="benefits-list">
				<h3>What This Means for You:</h3>
				<ul>
					<li>You can now receive payments directly to your business account</li>
					<li>All transactions will be automatically tracked and recorded</li>
					<li>You'll have access to detailed payment reports and analytics</li>
					<li>Your customers can pay securely through multiple payment methods</li>
					<li>Funds will be settled to your account according to your payment schedule</li>
				</ul>
			</div>

			<div class="next-steps">
				<h3>Next Steps:</h3>
				<ol>
					<li>Verify your payment settings in your business dashboard</li>
					<li>Test a payment transaction to ensure everything is working correctly</li>
					<li>Review your payment preferences and settlement schedule</li>
					<li>Start accepting payments from your customers</li>
				</ol>
			</div>

			<div class="message">
				If you have any questions or need assistance with your payment setup, please don't hesitate to contact our support team. We're here to help!
			</div>
		</div>
		<div class="email-footer">
			<p><strong>${appName}</strong></p>
			<p>This is an automated notification email.</p>
			<p>If you have any questions, please contact our <a href="#" class="support-link">support team</a>.</p>
			<p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
				This email was sent to ${email}
			</p>
		</div>
	</div>
</body>
</html>
	`.trim();
}

/**
 * Generate plain text version of business payment setup email
 */
export function generateBusinessPaymentSetupEmailText(data: BusinessPaymentSetupData): string {
	const { adminName, businessName, email, paystackSubaccountCode } = data;
	const appName = process.env.APP_NAME || "Printer Management System";
	const displayName = businessName || adminName;

	return `
Payment System Setup Complete!

Hello ${adminName},

Great news! Your business payment system has been successfully set up and configured. 
${businessName ? `Your business ${businessName} is now ready to accept payments.` : 'You can now start accepting payments through the platform.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAYMENT ACCOUNT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your Paystack subaccount has been successfully linked to your business account.

Subaccount Code: ${paystackSubaccountCode}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT THIS MEANS FOR YOU:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ You can now receive payments directly to your business account
✓ All transactions will be automatically tracked and recorded
✓ You'll have access to detailed payment reports and analytics
✓ Your customers can pay securely through multiple payment methods
✓ Funds will be settled to your account according to your payment schedule

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Verify your payment settings in your business dashboard
2. Test a payment transaction to ensure everything is working correctly
3. Review your payment preferences and settlement schedule
4. Start accepting payments from your customers

If you have any questions or need assistance with your payment setup, please don't hesitate to contact our support team. We're here to help!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${appName}
This is an automated notification email.

If you have any questions, please contact our support team.

This email was sent to ${email}
	`.trim();
}

