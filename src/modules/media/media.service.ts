import { MediaRepository } from './media.repository.js';
import { CreateMediaLotDto, MediaLotQueryDto } from './media.dto.js';
import { MediaLot } from '../../types/index.js';
import { recordAuditLog } from '../../middleware/audit.middleware.js';

export class MediaService {
  private mediaRepo: MediaRepository;

  constructor() {
    this.mediaRepo = new MediaRepository();
  }

  async listMediaLots(query: MediaLotQueryDto): Promise<{ mediaLots: MediaLot[]; total: number }> {
    return this.mediaRepo.findAll(query);
  }

  async getMediaLotById(id: string): Promise<MediaLot> {
    const lot = await this.mediaRepo.findById(id);
    if (!lot) throw new Error(`Media lot '${id}' not found`);
    return lot;
  }

  async createMediaLot(
    dto: CreateMediaLotDto,
    user: { userId: string; email: string }
  ): Promise<MediaLot> {
    const existing = await this.mediaRepo.findByLotNumber(dto.lotNumber);
    if (existing) {
      throw new Error(`Media lot with number '${dto.lotNumber}' already exists`);
    }

    const lot = await this.mediaRepo.create(dto);

    await recordAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: 'MEDIA_LOT_REGISTERED',
      entityType: 'media_lot',
      entityId: lot.id,
      newState: lot,
      reason: 'New media lot received and registered into laboratory inventory',
    });

    return lot;
  }

  async updateMediaLotStatus(
    id: string,
    status: string,
    user: { userId: string; email: string }
  ): Promise<MediaLot> {
    const current = await this.getMediaLotById(id);
    const updated = await this.mediaRepo.updateStatus(id, status);
    if (!updated) throw new Error(`Failed to update media lot '${id}'`);

    await recordAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: 'MEDIA_LOT_STATUS_CHANGED',
      entityType: 'media_lot',
      entityId: id,
      previousState: { status: current.status },
      newState: { status: updated.status },
      reason: `Media lot status updated to ${status}`,
    });

    return updated;
  }
}
