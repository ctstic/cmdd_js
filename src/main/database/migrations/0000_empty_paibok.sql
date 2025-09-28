CREATE TABLE `cigarettes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`specimen_name` text NOT NULL,
	`filter_ventilation` text NOT NULL,
	`filter_pressure_drop` integer NOT NULL,
	`permeability` text NOT NULL,
	`quantitative` text NOT NULL,
	`citrate` text NOT NULL,
	`potassium_ratio` text NOT NULL,
	`tar` text NOT NULL,
	`nicotine` text NOT NULL,
	`co` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cigarettes_code_unique` ON `cigarettes` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `cigarettes_specimen_name_unique` ON `cigarettes` (`specimen_name`);--> statement-breakpoint
CREATE TABLE `harmful_constants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`specimen_name` text NOT NULL,
	`type` text NOT NULL,
	`batch_no` text NOT NULL,
	`changliang` text NOT NULL,
	`filter_vent_coef` text NOT NULL,
	`filter_pressure_coef` text NOT NULL,
	`permeability_coef` text NOT NULL,
	`quantitative_coef` text NOT NULL,
	`citrate_coef` text NOT NULL,
	`potassium_coef` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `harmful_constants_specimen_name_unique` ON `harmful_constants` (`specimen_name`);--> statement-breakpoint
CREATE TABLE `ram_mark` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mark` text NOT NULL,
	`filter_ventilation` text NOT NULL,
	`filter_pressure_drop` integer NOT NULL,
	`permeability` text NOT NULL,
	`quantitative` text NOT NULL,
	`citrate` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ram_mark_mark_unique` ON `ram_mark` (`mark`);--> statement-breakpoint
CREATE TABLE `rec_aux_materials_save` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`specimen_name` text NOT NULL,
	`recommend_number` text NOT NULL,
	`filter_ventilation` text NOT NULL,
	`filter_pressure_drop` integer NOT NULL,
	`permeability` text NOT NULL,
	`quantitative` text NOT NULL,
	`citrate` text NOT NULL,
	`tar` text NOT NULL,
	`nicotine` text NOT NULL,
	`co` text NOT NULL,
	`target_tar` text NOT NULL,
	`target_nicotine` text NOT NULL,
	`target_co` text NOT NULL,
	`tar_weight` text NOT NULL,
	`nicotine_weight` text NOT NULL,
	`co_weight` text NOT NULL,
	`filter_ventilation_ranger` text NOT NULL,
	`filter_pressure_drop_ranger` text NOT NULL,
	`permeability_ranger` text NOT NULL,
	`quantitative_ranger` text NOT NULL,
	`citrate_ranger` text NOT NULL,
	`profile` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rec_aux_materials_save_specimen_name_unique` ON `rec_aux_materials_save` (`specimen_name`);--> statement-breakpoint
CREATE TABLE `rfg_mark` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mark` text NOT NULL,
	`tar` text NOT NULL,
	`nicotine` text NOT NULL,
	`co` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rfg_mark_mark_unique` ON `rfg_mark` (`mark`);--> statement-breakpoint
CREATE TABLE `simulation_rediction_save` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`specimen_name` text NOT NULL,
	`filter_ventilation` text NOT NULL,
	`filter_pressure_drop` integer NOT NULL,
	`permeability` text NOT NULL,
	`quantitative` text NOT NULL,
	`citrate` text NOT NULL,
	`tar` text NOT NULL,
	`nicotine` text NOT NULL,
	`co` text NOT NULL,
	`profile` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `simulation_rediction_save_specimen_name_unique` ON `simulation_rediction_save` (`specimen_name`);