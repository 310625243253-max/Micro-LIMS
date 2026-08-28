import { AuditRepository } from './audit.repository.js';
import { AuditLogQueryDto } from './audit.dto.js';
import { AuditLog } from '../../types/index.js';

export class AuditService {
  private auditRepo: AuditRepository;

  constructor() {
    this.auditRepo = new AuditRepository();
  }

  async listAuditLogs(query: AuditLogQueryDto): Promise<{ logs: AuditLog[]; total: number }> {
    return this.auditRepo.findAll(query);
  }

  async getAuditLogById(id: string): Promise<AuditLog> {
    const log = await this.auditRepo.findById(id);
    if (!log) throw new Error(`Audit log entry '${id}' not found`);
    return log;
  }
}
