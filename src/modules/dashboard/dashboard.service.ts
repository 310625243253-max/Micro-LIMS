import { DashboardRepository, DashboardMetrics } from './dashboard.repository.js';
import { getCache, setCache } from '../../utils/cache.js';

export class DashboardService {
  private dashboardRepo: DashboardRepository;

  constructor() {
    this.dashboardRepo = new DashboardRepository();
  }

  async getMetrics(): Promise<DashboardMetrics> {
    const cacheKey = 'dashboard:metrics';
    const cached = await getCache<DashboardMetrics>(cacheKey);
    if (cached) {
      return cached;
    }

    const metrics = await this.dashboardRepo.getMetrics();
    // Cache for 30 seconds
    await setCache(cacheKey, metrics, 30);
    return metrics;
  }

  async getRecentActivity(limit = 10): Promise<any[]> {
    const cacheKey = `dashboard:activity:${limit}`;
    const cached = await getCache<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const activity = await this.dashboardRepo.getRecentActivity(limit);
    // Cache for 15 seconds
    await setCache(cacheKey, activity, 15);
    return activity;
  }
}
