import { Column, Entity, PrimaryColumn } from 'typeorm'

export enum Breed {
  BENGAL = 'bengal',
  BIRMAN = 'birman',
  MAINE_COON = 'maine_coon',
  PERSIAN = 'persian',
  SIAMESE = 'siamese',
}

@Entity()
export class Cat {
  @PrimaryColumn()
  id: string

  @Column()
  name: string

  @Column({ type: 'int' })
  age: number

  @Column({ type: 'boolean' })
  isVaccinated: boolean

  @Column({ type: 'enum', enum: Breed })
  breed: Breed

  @Column({ type: 'int' })
  magicNumber: number

  @Column({ type: 'timestamp' })
  createdAt: Date
}
