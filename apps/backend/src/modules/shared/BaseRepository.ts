import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../config/database.js';

export abstract class BaseRepository {
  protected readonly prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }
}
