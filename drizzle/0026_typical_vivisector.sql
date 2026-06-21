CREATE TABLE `agent_blueprints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`code` text NOT NULL,
	`language` varchar(32) NOT NULL DEFAULT 'python',
	`framework` varchar(64) NOT NULL DEFAULT 'custom',
	`sentinelId` int,
	`shareToken` varchar(64) NOT NULL,
	`isPublic` boolean NOT NULL DEFAULT true,
	`viewCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_blueprints_id` PRIMARY KEY(`id`),
	CONSTRAINT `agent_blueprints_shareToken_unique` UNIQUE(`shareToken`)
);
--> statement-breakpoint
CREATE TABLE `agent_builder_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`metric` varchar(64) NOT NULL,
	`value` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_builder_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_builder_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sentinelId` int NOT NULL,
	`framework` varchar(64),
	`goal` text,
	`lastCode` text,
	`lastError` text,
	`stepReached` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_builder_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `template_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`templateId` varchar(128) NOT NULL,
	`action` varchar(16) NOT NULL,
	`rating` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `template_interactions_id` PRIMARY KEY(`id`)
);
