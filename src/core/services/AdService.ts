
import { AdMob, AdOptions, AdLoadInfo, RewardAdOptions, AdMobRewardItem } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// TEST IDs (Google Standard)
const ANDROID_TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const ANDROID_TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';

// TODO: Replace with Real IDs for Production
const PRODUCTION_ID = '';

export class AdService {
    private isInitialized = false;
    private isPrepared = false;
    private isNative = Capacitor.isNativePlatform();

    constructor() {
        this.initialize();
    }

    public async initialize(): Promise<void> {
        if (!this.isNative) {
            console.log('AdService: Web environment, mocking setup.');
            this.isInitialized = true;
            return;
        }

        try {
            await AdMob.initialize({
                initializeForTesting: true, // ALWAYS true for development!
            });
            this.isInitialized = true;
            console.log('AdService: Initialized');

            // Preload the first ad
            this.prepareRewardVideo();

        } catch (e) {
            console.error('AdService: Failed to initialize', e);
        }
    }

    public async prepareRewardVideo(): Promise<void> {
        if (!this.isNative) return;

        try {
            const options: RewardAdOptions = {
                adId: ANDROID_TEST_REWARDED_ID,
                // isTesting: true // handled by initializeForTesting
            };
            await AdMob.prepareRewardVideoAd(options);
            this.isPrepared = true;
            console.log('AdService: Reward Video Prepared');
        } catch (e) {
            console.error('AdService: Failed to prepare reward video', e);
            this.isPrepared = false;
        }
    }

    public async showRewardVideo(): Promise<{ rewarded: boolean; item?: AdMobRewardItem }> {
        if (!this.isNative) {
            // Web Mock
            return new Promise((resolve) => {
                const confirm = window.confirm('[DEV MOCK] Guarda Video Pubblicitario per ricompensa?');
                if (confirm) {
                    console.log('AdService [Mock]: Video watched.');
                    resolve({ rewarded: true });
                } else {
                    console.log('AdService [Mock]: Video cancelled.');
                    resolve({ rewarded: false });
                }
            });
        }

        if (!this.isPrepared) {
            console.warn('AdService: Ad not ready, trying to prepare...');
            await this.prepareRewardVideo();
            // If still not ready, fail gracefully
            if (!this.isPrepared) {
                return { rewarded: false };
            }
        }

        try {
            const result = await AdMob.showRewardVideoAd();
            // After showing, we must prepare the next one
            this.isPrepared = false;
            this.prepareRewardVideo();

            return {
                rewarded: true,
                item: result
            };
        } catch (e) {
            console.error('AdService: Error showing ad', e);
            return { rewarded: false };
        }
    }

    public isReady(): boolean {
        return this.isNative ? this.isPrepared : true;
    }
}

// Singleton Code
let adServiceInstance: AdService | null = null;
export function getAdService(): AdService {
    if (!adServiceInstance) {
        adServiceInstance = new AdService();
    }
    return adServiceInstance;
}
