ALTER TABLE `template_categories` ADD `isPublic` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `template_categories` ADD `creatorName` varchar(255);