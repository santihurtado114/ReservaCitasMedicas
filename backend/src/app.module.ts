import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Doctor } from './domain/entities/doctor.entity';
import { Patient } from './domain/entities/patient.entity';
import { Appointment } from './domain/entities/appointment.entity';
import { Config as ConfigEntity } from './domain/entities/config.entity';
import { User, UserRole } from './domain/entities/user.entity';
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

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(ConfigEntity)
    private readonly configRepo: Repository<ConfigEntity>,
  ) {}

  async onModuleInit() {
    const userCount = await this.userRepo.count();
    if (userCount > 0) {
      this.logger.log(`DB ya tiene datos (${userCount} usuarios). Seed omitido.`);
      return;
    }

    this.logger.log('BD vacía — sembrando datos iniciales...');
    const passwordHash = await bcrypt.hash('123456', 10);

    const admin = this.userRepo.create({
      email: 'admin@piedrazul.com',
      password: passwordHash,
      firstName: 'Sofia',
      lastName: 'Paz',
      role: UserRole.ADMIN,
    });
    await this.userRepo.save(admin);

    const doctorUser = this.userRepo.create({
      email: 'medico@piedrazul.com',
      password: passwordHash,
      firstName: 'Juan',
      lastName: 'Lopez',
      role: UserRole.DOCTOR,
    });
    await this.userRepo.save(doctorUser);

    const doctor = this.doctorRepo.create({
      name: 'Juan Lopez',
      specialty: 'Cardiología',
      scheduleStart: '08:00',
      scheduleEnd: '18:00',
      slotDuration: 30,
    });
    await this.doctorRepo.save(doctor);

    const patient = this.patientRepo.create({
      document: '123456789',
      firstName: 'Luisa',
      lastName: 'Perez',
      phone: '3000000000',
      gender: 'F',
      email: 'paciente@piedrazul.com',
      password: passwordHash,
    });
    await this.patientRepo.save(patient);

    const config = this.configRepo.create({
      key: 'appointment_rules',
      value: JSON.stringify({
        maxPerDay: 20,
        minHoursBefore: 2,
        maxDaysInAdvance: 30,
        defaultSlotDuration: 30,
      }),
      description: 'Reglas generales de agendamiento',
    });
    await this.configRepo.save(config);

    this.logger.log('Seed completado.');
    this.logger.log('admin@piedrazul.com / 123456');
    this.logger.log('medico@piedrazul.com / 123456');
    this.logger.log('Paciente: 123456789');
  }
}
