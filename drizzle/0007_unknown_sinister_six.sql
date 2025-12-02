ALTER TABLE `prompt_templates` ADD `isPublic` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `prompt_templates` ADD `creatorName` varchar(255);