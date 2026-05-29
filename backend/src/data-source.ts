import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

import { Doctor } from './domain/entities/doctor.entity';
import { Patient } from './domain/entities/patient.entity';
import { Appointment } from './domain/entities/appointment.entity';
import { Config } from './domain/entities/config.entity';
import { User } from './domain/entities/user.entity';
import { DoctorException } from './domain/entities/doctor-exception.entity';
import { AppointmentHistory } from './domain/entities/appointment-history.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'piedrazul',
  entities: [
    Doctor,
    Patient,
    Appointment,
    Config,
    User,
    DoctorException,
    AppointmentHistory,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: true,
});
