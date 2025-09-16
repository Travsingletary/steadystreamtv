import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { PaymentService, UserSubscription } from '../../services/payment.service';
import { AppManagementService, AppDownloadResponse } from '../../services/app-management.service';
import { SupabaseService } from '../../services/supabase.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-subscription-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './subscription-dashboard.component.html',
  styleUrls: ['./subscription-dashboard.component.scss']
})
export class SubscriptionDashboardComponent implements OnInit, OnDestroy {
  userSubscription: UserSubscription | null = null;
  isLoading = true;
  daysRemaining = 0;
  appDownloadResponse: AppDownloadResponse | null = null;
  isDownloadingApp = false;

  private destroy$ = new Subject<void>();

  constructor(
    private paymentService: PaymentService,
    private appManagementService: AppManagementService,
    private supabaseService: SupabaseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.paymentService.userSubscription$
      .pipe(takeUntil(this.destroy$))
      .subscribe(subscription => {
        this.userSubscription = subscription;
        this.calculateDaysRemaining();
        this.isLoading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private calculateDaysRemaining(): void {
    if (this.userSubscription && this.userSubscription.isActive) {
      const now = new Date();
      const endDate = new Date(this.userSubscription.endDate);
      const timeDiff = endDate.getTime() - now.getTime();
      this.daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    } else {
      this.daysRemaining = 0;
    }
  }

  getSubscriptionStatus(): string {
    if (!this.userSubscription) return 'No Subscription';

    if (this.userSubscription.isActive && this.daysRemaining > 0) {
      return 'Active';
    } else if (this.daysRemaining <= 0) {
      return 'Expired';
    } else {
      return 'Inactive';
    }
  }

  getStatusClass(): string {
    const status = this.getSubscriptionStatus();
    switch (status) {
      case 'Active':
        return 'status-active';
      case 'Expired':
        return 'status-expired';
      case 'Inactive':
        return 'status-inactive';
      default:
        return 'status-none';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  cancelSubscription(): void {
    if (confirm('Are you sure you want to cancel your subscription? You will lose access when the current period ends.')) {
      this.paymentService.cancelSubscription();
    }
  }

  clearSubscriptionData(): void {
    if (confirm('This will remove all subscription data. Continue?')) {
      this.paymentService.clearSubscription();
    }
  }

  getRenewalWarning(): string | null {
    if (this.daysRemaining <= 7 && this.daysRemaining > 0) {
      return `Your subscription expires in ${this.daysRemaining} day${this.daysRemaining !== 1 ? 's' : ''}. Renew now to avoid service interruption.`;
    } else if (this.daysRemaining <= 0) {
      return 'Your subscription has expired. Renew now to restore access.';
    }
    return null;
  }

  getProgressPercentage(): number {
    if (!this.userSubscription) return 0;

    const startDate = new Date(this.userSubscription.startDate);
    const endDate = new Date(this.userSubscription.endDate);
    const now = new Date();

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();

    const percentage = (elapsed / totalDuration) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  }

  navigateToPayment(): void {
    // This would typically use Angular Router
    // this.router.navigate(['/payment']);
    console.log('Navigate to payment page');
  }

  async downloadApp(): Promise<void> {
    if (!this.userSubscription || !this.userSubscription.isActive) {
      this.snackBar.open('Active subscription required to download the app', 'Close', {
        duration: 5000
      });
      return;
    }

    this.isDownloadingApp = true;

    try {
      // Get current user
      const { user, error: userError } = await this.supabaseService.getCurrentUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Generate download response with IPTV credentials
      const iptvCredentials = {
        m3u_url: this.userSubscription.iptvCredentials?.m3u_url || '',
        xtream_url: this.userSubscription.iptvCredentials?.xtream_url || '',
        username: this.userSubscription.iptvCredentials?.username || '',
        password: this.userSubscription.iptvCredentials?.password || '',
        epg_url: this.userSubscription.iptvCredentials?.epg_url || ''
      };

      this.appDownloadResponse = this.appManagementService.generateDownloadResponse(
        user.id,
        iptvCredentials
      );

      // Track the download
      await this.supabaseService.recordAppDownload({
        user_id: user.id,
        app_id: 'steadystream-tivimate',
        download_url: this.appDownloadResponse.downloadUrl,
        platform: 'android',
        app_version: '1.0.0',
        device_info: this.getDeviceInfo()
      });

      this.snackBar.open('Download information generated successfully!', 'Close', {
        duration: 3000
      });

    } catch (error: any) {
      console.error('Failed to generate download:', error);
      this.snackBar.open('Failed to generate download. Please try again.', 'Close', {
        duration: 5000
      });
    } finally {
      this.isDownloadingApp = false;
    }
  }

  openAppDownloadDialog(): void {
    if (!this.appDownloadResponse) {
      this.downloadApp();
      return;
    }

    // Open dialog with download instructions
    this.showDownloadInstructions();
  }

  private showDownloadInstructions(): void {
    if (!this.appDownloadResponse) return;

    const instructions = this.appManagementService.getInstallationInstructions();

    // For now, show in a simple alert - in a real app you'd use a proper dialog
    const instructionText = instructions.join('\n');
    alert(`${instructionText}\n\nDownload URL: ${this.appDownloadResponse.downloadUrl}\nDownload Code: ${this.appDownloadResponse.downloadCode}`);
  }

  copyToClipboard(text: string, label: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open(`${label} copied to clipboard!`, 'Close', {
        duration: 2000
      });
    }).catch(() => {
      this.snackBar.open('Failed to copy to clipboard', 'Close', {
        duration: 3000
      });
    });
  }

  openDeepLink(): void {
    if (this.appDownloadResponse?.deepLink) {
      window.open(this.appDownloadResponse.deepLink, '_blank');
    }
  }

  private getDeviceInfo(): any {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timestamp: new Date().toISOString()
    };
  }

  getAppDownloadStatus(): string {
    if (!this.userSubscription?.isActive) {
      return 'Subscription required';
    }
    if (this.appDownloadResponse) {
      return 'Ready to download';
    }
    return 'Generate download';
  }

  canDownloadApp(): boolean {
    return this.userSubscription?.isActive === true;
  }
}