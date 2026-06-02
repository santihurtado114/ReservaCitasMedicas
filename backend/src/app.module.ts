import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Doctor } from './domain/entities/doctor.entity';
import { Patient } from './domain/entities/patient.entity';
import { Appointment } from './domain/entities/appointment.entity';
import { Config as ConfigEntity } from './domain/entities/config.entity';
import { User } from './domain/entities/user.entity';
import { DoctorException } from './domain/entities/doctor-exception.entity';
import { AppointmentHistory } from './domain/entities/appointment-history.entity';
import { ConfigController } from './presentation/controllers/config.controller';
import { AppointmentController } from './presentation/controllers/appointment.controller';
import { DoctorController } from './presentation/controllers/doctor.controller';
import { PatientController } from './presentation/controllers/patient.controller';
import { AppointmentService } from './application/services/appointment.service';
import { AvailabilityService } from './application/services/availability.service';
import { StatsService } from './application/services/stats.service';
import { ExportService } from './application/services/export.service';
import { AppointmentJobService } from './application/services/appointment-job.service';
import { NotificationService } from './application/services/notification.service';
import { PatientService } from './application/services/patient.service';
import { DoctorService } from './application/services/doctor.service';
import { DoctorExceptionService } from './application/services/doctor-exception.service';
import { ConfigService as AppConfigService } from './application/services/config.service';
import { AuthModule } from './auth.module';
import { NotificationsClientModule } from './infrastructure/messaging/notifications-client.module';
import { ICsvExporter } from './application/abstractions/icsv-exporter.interface';
import { Json2CsvExporter } from './infrastructure/export/json2csv-exporter';
import { IAppointmentRepository } from './application/ports/appointment.repository';
import { IDoctorRepository } from './application/ports/doctor.repository';
import { IDoctorExceptionRepository } from './application/ports/doctor-exception.repository';
import { IAppointmentHistoryRepository } from './application/ports/appointment-history.repository';
import { TypeOrmAppointmentRepository } from './infrastructure/persistence/typeorm-appointment.repository';
import { TypeOrmDoctorRepository } from './infrastructure/persistence/typeorm-doctor.repository';
import { TypeOrmDoctorExceptionRepository } from './infrastructure/persistence/typeorm-doctor-exception.repository';
import { TypeOrmAppointmentHistoryRepository } from './infrastructure/persistence/typeorm-appointment-history.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [
          Doctor,
          Patient,
          Appointment,
          ConfigEntity,
          User,
          DoctorException,
          AppointmentHistory,
        ],
        synchronize: true,
        logging: true,
      }),
    }),
    TypeOrmModule.forFeature([
      Doctor,
      Patient,
      Appointment,
      ConfigEntity,
      User,
      DoctorException,
      AppointmentHistory,
    ]),
    AuthModule,
    ScheduleModule.forRoot(),
    NotificationsClientModule,
  ],
  controllers: [
    AppointmentController,
    DoctorController,
    ConfigController,
    PatientController,
  ],
  providers: [
    AppointmentService,
    AvailabilityService,
    StatsService,
    ExportService,
    AppointmentJobService,
    NotificationService,
    PatientService,
    DoctorService,
    DoctorExceptionService,
    AppConfigService,
    { provide: ICsvExporter, useClass: Json2CsvExporter },
    { provide: IAppointmentRepository, useClass: TypeOrmAppointmentRepository },
    { provide: IDoctorRepository, useClass: TypeOrmDoctorRepository },
    {
      provide: IDoctorExceptionRepository,
      useClass: TypeOrmDoctorExceptionRepository,
    },
    {
      provide: IAppointmentHistoryRepository,
      useClass: TypeOrmAppointmentHistoryRepository,
    },
  ],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  onModuleInit() {
    this.logger.log('AppModule initialized');
  }
}
