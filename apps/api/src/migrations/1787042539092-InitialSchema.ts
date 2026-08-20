import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1787042539092 implements MigrationInterface {
    name = 'InitialSchema1787042539092'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`academic_periods\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`teacher_id\` varchar(255) NOT NULL, \`academic_year\` varchar(255) NOT NULL, \`semester\` varchar(255) NOT NULL, \`start_date\` date NOT NULL, \`end_date\` date NOT NULL, UNIQUE INDEX \`IDX_0dbdcb9379d0c48c05b755a959\` (\`teacher_id\`, \`academic_year\`, \`semester\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`audit_logs\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` varchar(255) NOT NULL, \`action\` varchar(255) NOT NULL, \`entity_type\` varchar(255) NOT NULL, \`entity_id\` varchar(255) NOT NULL, \`metadata\` json NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`teacher_schedules\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`teacher_id\` varchar(255) NOT NULL, \`academic_period_id\` varchar(255) NOT NULL, \`day_of_week\` enum ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL, \`start_time\` time NOT NULL, \`end_time\` time NOT NULL, UNIQUE INDEX \`IDX_a7bddad27b1b4165343755b85d\` (\`teacher_id\`, \`academic_period_id\`, \`day_of_week\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`email\` varchar(255) NOT NULL, \`password_hash\` varchar(255) NOT NULL, \`role\` enum ('TEACHER', 'ADMIN') NOT NULL DEFAULT 'TEACHER', \`is_active\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`teacher_profiles\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` varchar(255) NOT NULL, \`employee_id\` varchar(255) NOT NULL, \`first_name\` varchar(255) NOT NULL, \`middle_name\` varchar(255) NULL, \`last_name\` varchar(255) NOT NULL, \`position\` varchar(255) NULL, \`department\` varchar(255) NULL, \`campus\` varchar(255) NULL, UNIQUE INDEX \`IDX_b9627de400103265c502c57b56\` (\`user_id\`), UNIQUE INDEX \`IDX_ff67d7647bfe0f8a626ab481d0\` (\`employee_id\`), UNIQUE INDEX \`REL_b9627de400103265c502c57b56\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`dtr_days\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`dtr_period_id\` varchar(255) NOT NULL, \`date\` date NOT NULL, \`schedule_start_time\` time NULL, \`schedule_end_time\` time NULL, \`arrival_time\` time NULL, \`departure_time\` time NULL, \`status\` enum ('REGULAR', 'ONLINE', 'SUSPENDED', 'HOLIDAY', 'NO_CLASS', 'OTHER') NOT NULL DEFAULT 'REGULAR', \`reason\` varchar(255) NULL, \`remarks\` text NULL, UNIQUE INDEX \`IDX_c91921b64329bf45a7e165fbc8\` (\`dtr_period_id\`, \`date\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`dtr_generations\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`teacher_id\` varchar(255) NOT NULL, \`dtr_period_id\` varchar(255) NOT NULL, \`version\` int NOT NULL DEFAULT '1', \`file_name\` varchar(255) NOT NULL, \`file_path\` varchar(255) NOT NULL, \`generated_at\` timestamp NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`dtr_periods\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`teacher_id\` varchar(255) NOT NULL, \`academic_period_id\` varchar(255) NOT NULL, \`start_date\` date NOT NULL, \`end_date\` date NOT NULL, \`label\` varchar(255) NULL, UNIQUE INDEX \`IDX_918e599fa63a2ee7b6270809bf\` (\`teacher_id\`, \`academic_period_id\`, \`start_date\`, \`end_date\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`teacher_profiles\` ADD CONSTRAINT \`FK_b9627de400103265c502c57b56b\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`teacher_profiles\` DROP FOREIGN KEY \`FK_b9627de400103265c502c57b56b\``);
        await queryRunner.query(`DROP INDEX \`IDX_918e599fa63a2ee7b6270809bf\` ON \`dtr_periods\``);
        await queryRunner.query(`DROP TABLE \`dtr_periods\``);
        await queryRunner.query(`DROP TABLE \`dtr_generations\``);
        await queryRunner.query(`DROP INDEX \`IDX_c91921b64329bf45a7e165fbc8\` ON \`dtr_days\``);
        await queryRunner.query(`DROP TABLE \`dtr_days\``);
        await queryRunner.query(`DROP INDEX \`REL_b9627de400103265c502c57b56\` ON \`teacher_profiles\``);
        await queryRunner.query(`DROP INDEX \`IDX_ff67d7647bfe0f8a626ab481d0\` ON \`teacher_profiles\``);
        await queryRunner.query(`DROP INDEX \`IDX_b9627de400103265c502c57b56\` ON \`teacher_profiles\``);
        await queryRunner.query(`DROP TABLE \`teacher_profiles\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_a7bddad27b1b4165343755b85d\` ON \`teacher_schedules\``);
        await queryRunner.query(`DROP TABLE \`teacher_schedules\``);
        await queryRunner.query(`DROP TABLE \`audit_logs\``);
        await queryRunner.query(`DROP INDEX \`IDX_0dbdcb9379d0c48c05b755a959\` ON \`academic_periods\``);
        await queryRunner.query(`DROP TABLE \`academic_periods\``);
    }

}
