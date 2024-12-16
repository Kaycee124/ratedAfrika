// src/collaborators/repositories/collaborator-split.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CollaboratorSplit } from '../entities/collaborator-split.entity';
import { SplitType } from '../types/collaborator-types';

@Injectable()
export class CollaboratorSplitRepository {
  private readonly logger = new Logger(CollaboratorSplitRepository.name);

  constructor(
    @InjectRepository(CollaboratorSplit)
    private repository: Repository<CollaboratorSplit>,
    private dataSource: DataSource,
  ) {}

  async getTotalSplitPercentage(
    songId: string,
    splitType: SplitType,
  ): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('split')
      .select('COALESCE(SUM(split.percentage), 0)', 'total')
      .where('split.songId = :songId', { songId })
      .andWhere('split.splitType = :splitType', { splitType })
      .andWhere('split.deletedAt IS NULL')
      .getRawOne();

    return parseFloat(result.total || '0');
  }

  async findBySongId(songId: string): Promise<CollaboratorSplit[]> {
    return this.repository.find({
      where: { songId },
      relations: ['collaborator'],
    });
  }

  async findBySongAndType(
    songId: string,
    splitType: SplitType,
  ): Promise<CollaboratorSplit[]> {
    return this.repository.find({
      where: { songId, splitType },
      relations: ['collaborator'],
    });
  }

  async validateSplitAllocation(
    songId: string,
    splitType: SplitType,
    newPercentage: number,
    excludeSplitId?: string,
  ): Promise<boolean> {
    const queryBuilder = this.repository
      .createQueryBuilder('split')
      .select('COALESCE(SUM(split.percentage), 0)', 'total')
      .where('split.songId = :songId', { songId })
      .andWhere('split.splitType = :splitType', { splitType });

    if (excludeSplitId) {
      queryBuilder.andWhere('split.id != :excludeSplitId', { excludeSplitId });
    }

    const result = await queryBuilder.getRawOne();
    const currentTotal = parseFloat(result.total || '0');
    return currentTotal + newPercentage <= 100;
  }

  async createSplit(
    split: Partial<CollaboratorSplit>,
  ): Promise<CollaboratorSplit> {
    try {
      return await this.repository.save(this.repository.create(split));
    } catch (error) {
      this.logger.error(`Error creating split: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateSplit(
    id: string,
    data: Partial<CollaboratorSplit>,
  ): Promise<CollaboratorSplit> {
    await this.repository.update(id, data);
    return this.repository.findOne({
      where: { id },
      relations: ['collaborator'],
    });
  }

  async findOne(options: any): Promise<CollaboratorSplit> {
    return this.repository.findOne(options);
  }

  async deleteSplit(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async updateMultipleSplits(
    splits: Partial<CollaboratorSplit>[],
  ): Promise<CollaboratorSplit[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updatedSplits = [];
      for (const split of splits) {
        const result = await queryRunner.manager.save(CollaboratorSplit, split);
        updatedSplits.push(result);
      }

      await queryRunner.commitTransaction();
      return updatedSplits;
    } catch (error) {
      this.logger.error(`Error in bulk update: ${error.message}`, error.stack);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async verifySplit(
    id: string,
    verifiedBy: string,
  ): Promise<CollaboratorSplit> {
    return this.updateSplit(id, {
      isVerified: true,
      verifiedBy,
      verifiedAt: new Date(),
    });
  }

  async lockSplit(id: string): Promise<CollaboratorSplit> {
    return this.updateSplit(id, { isLocked: true });
  }
}
