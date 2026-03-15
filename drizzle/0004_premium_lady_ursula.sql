CREATE TABLE `sentinels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`archetype` varchar(100) NOT NULL,
	`primaryFunction` text NOT NULL,
	`energySignature` varchar(100),
	`personalityTraits` text NOT NULL,
	`communicationStyle` text NOT NULL,
	`specializationDomains` text NOT NULL,
	`idealUseCases` text NOT NULL,
	`primaryColor` varchar(7) NOT NULL,
	`secondaryColor` varchar(7) NOT NULL,
	`accentColor` varchar(7) NOT NULL,
	`symbolEmoji` varchar(10) NOT NULL,
	`systemPrompt` text NOT NULL,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sentinels_id` PRIMARY KEY(`id`),
	CONSTRAINT `sentinels_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `sentinelMemory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sentinelId` int NOT NULL,
	`totalInteractions` int NOT NULL DEFAULT 0,
	`firstInteraction` timestamp NOT NULL DEFAULT (now()),
	`lastInteraction` timestamp NOT NULL DEFAULT (now()),
	`collaborationAreas` text,
	`keyInsights` text,
	`relationshipNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sentinelMemory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversationSentinels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`sentinelId` int NOT NULL,
	`role` enum('primary','collaborator') NOT NULL DEFAULT 'primary',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`messageCount` int NOT NULL DEFAULT 0,
	CONSTRAINT `conversationSentinels_id` PRIMARY KEY(`id`)
);
