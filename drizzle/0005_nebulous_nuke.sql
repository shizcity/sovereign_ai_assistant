DROP TABLE `conversationSentinels`;--> statement-breakpoint
DROP TABLE `message_reactions`;--> statement-breakpoint
DROP TABLE `sentinelMemory`;--> statement-breakpoint
DROP TABLE `sentinels`;--> statement-breakpoint
ALTER TABLE `userSettings` MODIFY COLUMN `theme` varchar(20) DEFAULT 'light';