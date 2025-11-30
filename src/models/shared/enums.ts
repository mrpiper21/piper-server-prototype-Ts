// Shared enums and constants used across multiple models

// User roles enum
export enum UserRole {
	ADMIN = "admin",
	CLERK = "clerk",
	SUPERADMIN = "superadmin",
}

// User permissions enum
export enum Permission {
	// Admin permissions
	MANAGE_USERS = "manage_users",
	VIEW_ANALYTICS = "view_analytics",
	MANAGE_SYSTEM = "manage_system",
	VIEW_ALL_JOBS = "view_all_jobs",

	// Clerk permissions
	MANAGE_JOBS = "manage_jobs",
	SUBMIT_PRINTS = "submit_prints",
	VIEW_AGENTS = "view_agents",

	// Manager permissions
	VIEW_REPORTS = "view_reports",
	MANAGE_AGENTS = "manage_agents",

	// Technician permissions
	MAINTAIN_PRINTERS = "maintain_printers",
	VIEW_LOGS = "view_logs",

	// Customer permissions
	SUBMIT_JOBS = "submit_jobs",
	VIEW_OWN_JOBS = "view_own_jobs",
}

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
	[UserRole.ADMIN]: [
		Permission.MANAGE_USERS,
		Permission.VIEW_ANALYTICS,
		Permission.MANAGE_SYSTEM,
		Permission.VIEW_ALL_JOBS,
		Permission.MANAGE_JOBS,
		Permission.SUBMIT_PRINTS,
		Permission.VIEW_AGENTS,
		Permission.VIEW_REPORTS,
		Permission.MANAGE_AGENTS,
		Permission.MAINTAIN_PRINTERS,
		Permission.VIEW_LOGS,
	],
	[UserRole.CLERK]: [
		Permission.MANAGE_JOBS,
		Permission.SUBMIT_PRINTS,
		// Permission.VIEW_AGENTS,
		Permission.VIEW_OWN_JOBS,
		Permission.MANAGE_USERS,
	],
	[UserRole.SUPERADMIN]: [
		// SuperAdmin has all permissions
		Permission.MANAGE_USERS,
		Permission.VIEW_ANALYTICS,
		Permission.MANAGE_SYSTEM,
		Permission.VIEW_ALL_JOBS,
		Permission.MANAGE_JOBS,
		Permission.SUBMIT_PRINTS,
		Permission.VIEW_AGENTS,
		Permission.VIEW_REPORTS,
		Permission.MANAGE_AGENTS,
		Permission.MAINTAIN_PRINTERS,
		Permission.VIEW_LOGS,
	],
};

