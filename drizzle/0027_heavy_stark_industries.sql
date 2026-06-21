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
