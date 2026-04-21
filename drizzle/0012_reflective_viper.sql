CREATE TABLE `custom_sentinels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`archetype` varchar(255) NOT NULL,
	`primaryFunction` text NOT NULL,
	`personalityTraits` text NOT NULL,
	`communicationStyle` text NOT NULL,
	`specializationDomains` text NOT NULL,
	`primaryColor` varchar(20) NOT NULL DEFAULT '#8b5cf6',
	`symbolEmoji` varchar(10) NOT NULL DEFAULT '✨',
	`systemPrompt` text NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custom_sentinels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memory_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conversationId` int NOT NULL,
	`messageId` int NOT NULL,
	`sentinelId` int,
	`content` text NOT NULL,
	`category` enum('insight','decision','goal','milestone','achievement','preference','challenge','pattern') NOT NULL,
	`importance` int NOT NULL,
	`tags` json,
	`reasoning` text,
	`status` enum('pending','accepted','dismissed','edited') NOT NULL DEFAULT 'pending',
	`feedback` text,
	`savedMemoryId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`respondedAt` timestamp,
	CONSTRAINT `memory_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`refereeId` int,
	`code` varchar(16) NOT NULL,
	`xpAwarded` int NOT NULL DEFAULT 0,
	`claimedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `round_table_reasoning` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`sentinelId` int NOT NULL,
	`sentinelName` varchar(100) NOT NULL,
	`sentinelEmoji` varchar(10) DEFAULT '🤖',
	`round` int NOT NULL,
	`thinkingChain` text NOT NULL,
	`conclusion` text NOT NULL,
	`confidence` varchar(10) NOT NULL,
	`concerns` text,
	`dissent` text,
	`memoriesUsed` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `round_table_reasoning_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `round_table_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`question` text NOT NULL,
	`sentinelIds` text NOT NULL,
	`sentinelNames` text NOT NULL,
	`status` enum('running','completed','failed') NOT NULL DEFAULT 'running',
	`rounds` int NOT NULL DEFAULT 2,
	`consensusScore` varchar(10),
	`hasContradiction` int NOT NULL DEFAULT 0,
	`contradictionSummary` text,
	`finalAnswer` text,
	`finalSentinelId` int,
	`finalSentinelName` varchar(100),
	`memoryIds` text,
	`savedMemoryId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `round_table_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sentinel_memory_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sentinelId` int NOT NULL,
	`conversationId` int,
	`category` enum('insight','decision','milestone','preference','goal','achievement','challenge','pattern') NOT NULL,
	`content` text NOT NULL,
	`context` text,
	`importance` int NOT NULL DEFAULT 50,
	`tags` text,
	`relatedMemoryIds` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sentinel_memory_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementId` varchar(100) NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_streaks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastActiveDate` varchar(10),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_streaks_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_streaks_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `xp_ledger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`xpAwarded` int NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `xp_ledger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `messages` ADD `sentinelId` int;--> statement-breakpoint
ALTER TABLE `prompt_templates` ADD `recommended_sentinel_id` int;--> statement-breakpoint
ALTER TABLE `prompt_templates` ADD `memory_tags` text;--> statement-breakpoint
ALTER TABLE `prompt_templates` ADD `follow_up_prompts` text;--> statement-breakpoint
ALTER TABLE `sentinels` ADD `personalityTraits` text;--> statement-breakpoint
ALTER TABLE `sentinels` ADD `primaryColor` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `sentinels` ADD `secondaryColor` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `sentinels` ADD `accentColor` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `sentinels` ADD `displayOrder` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `emailDigestFrequency` varchar(20) DEFAULT 'weekly';--> statement-breakpoint
ALTER TABLE `userSettings` ADD `lastDigestSent` timestamp;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `ttsEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionTier` varchar(20) DEFAULT 'free';--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` varchar(20) DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionCurrentPeriodEnd` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingCompleted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingStep` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `referralCode` varchar(16);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_referralCode_unique` UNIQUE(`referralCode`);--> statement-breakpoint
ALTER TABLE `sentinels` DROP COLUMN `interactionPatterns`;--> statement-breakpoint
ALTER TABLE `sentinels` DROP COLUMN `relationshipApproach`;--> statement-breakpoint
ALTER TABLE `sentinels` DROP COLUMN `colorPrimary`;--> statement-breakpoint
ALTER TABLE `sentinels` DROP COLUMN `colorSecondary`;--> statement-breakpoint
ALTER TABLE `sentinels` DROP COLUMN `colorAccent`;--> statement-breakpoint
ALTER TABLE `sentinels` DROP COLUMN `avatarConcept`;