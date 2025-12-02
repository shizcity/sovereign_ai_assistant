CREATE TABLE `conversation_sentinels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`sentinelId` int NOT NULL,
	`role` enum('primary','collaborator') NOT NULL,
	`messageCount` int NOT NULL DEFAULT 0,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`lastActiveAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversation_sentinels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sentinel_memory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sentinelId` int NOT NULL,
	`interactionCount` int NOT NULL DEFAULT 0,
	`lastInteraction` timestamp NOT NULL,
	`collaborationAreas` text,
	`keyInsights` text,
	`relationshipStrength` int DEFAULT 0,
	`preferredTopics` text,
	`conversationStyle` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sentinel_memory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sentinels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`name` varchar(100) NOT NULL,
	`archetype` varchar(255) NOT NULL,
	`primaryFunction` text NOT NULL,
	`energySignature` text,
	`communicationStyle` text NOT NULL,
	`interactionPatterns` text,
	`relationshipApproach` text,
	`specializationDomains` text,
	`idealUseCases` text,
	`systemPrompt` text NOT NULL,
	`colorPrimary` varchar(20) NOT NULL,
	`colorSecondary` varchar(20) NOT NULL,
	`colorAccent` varchar(20) NOT NULL,
	`symbolEmoji` varchar(10) NOT NULL,
	`avatarConcept` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sentinels_id` PRIMARY KEY(`id`),
	CONSTRAINT `sentinels_slug_unique` UNIQUE(`slug`)
);
