import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('message')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  sender!: string;

  @Column()
  recipient!: string;

  @Column()
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
