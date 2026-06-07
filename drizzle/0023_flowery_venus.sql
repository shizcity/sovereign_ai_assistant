ALTER TABLE `sentinel_memory` ADD `currentStreak` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sentinel_memory` ADD `lastStreakDate` varchar(10);