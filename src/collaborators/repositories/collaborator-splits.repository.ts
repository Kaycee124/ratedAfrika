// src/collaborators/repositories/collaborator-splits.repository.ts
import { EntityRepository, Repository } from 'typeorm';
import { CollaboratorSplit } from '../entities/collaborator-split.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
@EntityRepository(CollaboratorSplit)
export class CollaboratorSplitsRepository extends Repository<CollaboratorSplit> {
  async getTotalSplitPercentage(
    songId: string,
    splitType: string,
  ): Promise<number> {
    const result = await this.createQueryBuilder('split')
      .where('split.songId = :songId', { songId })
      .andWhere('split.splitType = :splitType', { splitType })
      .select('SUM(split.percentage)', 'total')
      .getRawOne();

    return Number(result.total) || 0;
  }
}
