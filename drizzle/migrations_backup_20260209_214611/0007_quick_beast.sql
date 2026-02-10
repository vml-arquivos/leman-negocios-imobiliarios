CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`tenantId` int NOT NULL,
	`ownerId` int NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'ACTIVE',
	`rentAmount` int NOT NULL,
	`adminFeeRate` int NOT NULL DEFAULT 10,
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`paymentDay` int NOT NULL DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`sentimentScore` int,
	`aiSummary` text,
	`lastInteraction` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lead_insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64) DEFAULT 'local';--> statement-breakpoint
ALTER TABLE `site_settings` ADD `themeStyle` enum('modern','classic') DEFAULT 'modern';--> statement-breakpoint
ALTER TABLE `site_settings` ADD `primaryColor` varchar(7) DEFAULT '#0f172a';--> statement-breakpoint
ALTER TABLE `site_settings` ADD `heroTitle` varchar(255);--> statement-breakpoint
ALTER TABLE `site_settings` ADD `heroSubtitle` text;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `heroBackgroundImage` varchar(500);--> statement-breakpoint
ALTER TABLE `site_settings` ADD `aboutSectionTitle` varchar(255);--> statement-breakpoint
ALTER TABLE `site_settings` ADD `aboutSectionContent` text;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `aboutSectionImage` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);