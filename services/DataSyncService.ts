import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SyncStatus {
  lastSync: string;
  pendingUploads: number;
  syncInProgress: boolean;
  errors: string[];
}

class DataSyncService {
  private syncInProgress = false;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Start automatic sync every 5 minutes
   */
  startAutoSync() {
    this.syncInterval = setInterval(() => {
      this.syncData();
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync data between local storage and Supabase
   */
  async syncData(): Promise<SyncStatus> {
    if (this.syncInProgress) {
      return this.getSyncStatus();
    }

    this.syncInProgress = true;
    const errors: string[] = [];

    try {
      // Sync organizations
      await this.syncOrganizations();

      // Sync messages
      await this.syncMessages();

      // Update last sync time
      await AsyncStorage.setItem('lastSync', new Date().toISOString());
    } catch (error) {
      console.error('Sync error:', error);
      errors.push(error.message);
    } finally {
      this.syncInProgress = false;
    }

    return {
      lastSync: (await AsyncStorage.getItem('lastSync')) || 'Never',
      pendingUploads: 0,
      syncInProgress: false,
      errors,
    };
  }

  /**
   * Sync organizations from Supabase to local storage
   */
  private async syncOrganizations() {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('verification_status', 'verified');

      if (error) throw error;

      await AsyncStorage.setItem(
        'cached_organizations',
        JSON.stringify(data || [])
      );
    } catch (error) {
      console.error('Organization sync error:', error);
      throw error;
    }
  }

  /**
   * Sync messages from Supabase to local storage
   */
  private async syncMessages() {
    try {
      const { data, error } = await supabase
        .from('verified_messages')
        .select(
          `
          *,
          organization:organizations(name, verification_status, logo_url)
        `
        )
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      await AsyncStorage.setItem('cached_messages', JSON.stringify(data || []));
    } catch (error) {
      console.error('Messages sync error:', error);
      throw error;
    }
  }

  /**
   * Get cached data when offline
   */
  async getCachedData(type: 'organizations' | 'messages') {
    try {
      const cached = await AsyncStorage.getItem(`cached_${type}`);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error(`Error getting cached ${type}:`, error);
      return [];
    }
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const lastSync = (await AsyncStorage.getItem('lastSync')) || 'Never';

    return {
      lastSync,
      pendingUploads: 0,
      syncInProgress: this.syncInProgress,
      errors: [],
    };
  }

  /**
   * Force sync now
   */
  async forcSync(): Promise<SyncStatus> {
    return await this.syncData();
  }

  /**
   * Clear all cached data
   */
  async clearCache() {
    try {
      await AsyncStorage.multiRemove([
        'cached_organizations',
        'cached_messages',
        'lastSync',
      ]);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

export const dataSyncService = new DataSyncService();
export default DataSyncService;
