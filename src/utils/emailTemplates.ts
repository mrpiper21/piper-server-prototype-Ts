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

