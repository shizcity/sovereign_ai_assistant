ALTER TABLE `messages` ADD `provider` varchar(20);--> statement-breakpoint
ALTER TABLE `messages` ADD `promptTokens` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `messages` ADD `completionTokens` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `messages` ADD `totalTokens` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `messages` ADD `costUsd` varchar(20);