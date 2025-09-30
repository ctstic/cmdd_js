PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_rec_aux_materials_save` (
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
	`profile` text DEFAULT () => JSON.stringify([]) NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_rec_aux_materials_save`("id", "specimen_name", "recommend_number", "filter_ventilation", "filter_pressure_drop", "permeability", "quantitative", "citrate", "tar", "nicotine", "co", "target_tar", "target_nicotine", "target_co", "tar_weight", "nicotine_weight", "co_weight", "filter_ventilation_ranger", "filter_pressure_drop_ranger", "permeability_ranger", "quantitative_ranger", "citrate_ranger", "profile", "created_at", "updated_at") SELECT "id", "specimen_name", "recommend_number", "filter_ventilation", "filter_pressure_drop", "permeability", "quantitative", "citrate", "tar", "nicotine", "co", "target_tar", "target_nicotine", "target_co", "tar_weight", "nicotine_weight", "co_weight", "filter_ventilation_ranger", "filter_pressure_drop_ranger", "permeability_ranger", "quantitative_ranger", "citrate_ranger", "profile", "created_at", "updated_at" FROM `rec_aux_materials_save`;--> statement-breakpoint
DROP TABLE `rec_aux_materials_save`;--> statement-breakpoint
ALTER TABLE `__new_rec_aux_materials_save` RENAME TO `rec_aux_materials_save`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_simulation_rediction_save` (
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
	`profile` text DEFAULT () => JSON.stringify([]) NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_simulation_rediction_save`("id", "specimen_name", "filter_ventilation", "filter_pressure_drop", "permeability", "quantitative", "citrate", "tar", "nicotine", "co", "profile", "created_at", "updated_at") SELECT "id", "specimen_name", "filter_ventilation", "filter_pressure_drop", "permeability", "quantitative", "citrate", "tar", "nicotine", "co", "profile", "created_at", "updated_at" FROM `simulation_rediction_save`;--> statement-breakpoint
DROP TABLE `simulation_rediction_save`;--> statement-breakpoint
ALTER TABLE `__new_simulation_rediction_save` RENAME TO `simulation_rediction_save`;