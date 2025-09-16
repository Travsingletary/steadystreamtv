import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AppManagementService, AppConfiguration } from '../../services/app-management.service';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule
  ],
  template: `
    <div class="app-config-container">
      <div class="config-card">
        <div class="config-header">
          <mat-icon class="app-icon">smartphone</mat-icon>
          <h1>SteadyStream TV App Configuration</h1>
          <p>Setup your IPTV app with these credentials</p>
        </div>

        <div class="config-content" *ngIf="config">
          <div class="credentials-section">
            <h3>📺 IPTV Credentials</h3>
            <div class="credential-grid">
              <div class="credential-item">
                <label>M3U URL:</label>
                <div class="credential-value">
                  <span>{{ config.m3uUrl }}</span>
                  <button mat-icon-button (click)="copyToClipboard(config.m3uUrl, 'M3U URL')">
                    <mat-icon>content_copy</mat-icon>
                  </button>
                </div>
              </div>

              <div class="credential-item">
                <label>Xtream URL:</label>
                <div class="credential-value">
                  <span>{{ config.xtreamUrl }}</span>
                  <button mat-icon-button (click)="copyToClipboard(config.xtreamUrl, 'Xtream URL')">
                    <mat-icon>content_copy</mat-icon>
                  </button>
                </div>
              </div>

              <div class="credential-item">
                <label>Username:</label>
                <div class="credential-value">
                  <span>{{ config.username }}</span>
                  <button mat-icon-button (click)="copyToClipboard(config.username, 'Username')">
                    <mat-icon>content_copy</mat-icon>
                  </button>
                </div>
              </div>

              <div class="credential-item">
                <label>Password:</label>
                <div class="credential-value">
                  <span>{{ config.password }}</span>
                  <button mat-icon-button (click)="copyToClipboard(config.password, 'Password')">
                    <mat-icon>content_copy</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="setup-instructions">
            <h3>🚀 Setup Instructions</h3>
            <ol class="instruction-list">
              <li>Open the SteadyStream TV app on your Android device</li>
              <li>Go to Settings or Add Provider</li>
              <li>Choose "M3U URL" or "Xtream Codes" option</li>
              <li>Copy and paste the credentials above</li>
              <li>Save and enjoy streaming!</li>
            </ol>
          </div>

          <div class="app-download-reminder" *ngIf="!isAndroidDevice()">
            <h3>📱 Don't have the app yet?</h3>
            <p>Download the SteadyStream TV app from your subscription dashboard</p>
            <button mat-raised-button color="primary" routerLink="/subscription">
              <mat-icon>dashboard</mat-icon>
              Go to Dashboard
            </button>
          </div>

          <div class="quick-actions">
            <button mat-raised-button color="primary" (click)="openAppWithConfig()" *ngIf="isAndroidDevice()">
              <mat-icon>open_in_new</mat-icon>
              Open in App
            </button>
            <button mat-stroked-button (click)="downloadConfig()">
              <mat-icon>download</mat-icon>
              Download Config
            </button>
            <button mat-button (click)="copyAllCredentials()">
              <mat-icon>content_copy</mat-icon>
              Copy All
            </button>
          </div>
        </div>

        <div class="config-error" *ngIf="!config && !isLoading">
          <mat-icon>error</mat-icon>
          <h3>Configuration Not Found</h3>
          <p>This configuration link may have expired or is invalid.</p>
          <button mat-raised-button color="primary" routerLink="/subscription">
            <mat-icon>dashboard</mat-icon>
            Go to Dashboard
          </button>
        </div>

        <div class="loading" *ngIf="isLoading">
          <mat-icon>sync</mat-icon>
          <p>Loading configuration...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-config-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .config-card {
      background: white;
      border-radius: 16px;
      padding: 3rem;
      max-width: 800px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    }

    .config-header {
      text-align: center;
      margin-bottom: 3rem;

      .app-icon {
        font-size: 4rem;
        height: 4rem;
        width: 4rem;
        color: #4caf50;
        margin-bottom: 1rem;
      }

      h1 {
        font-size: 2.5rem;
        color: #333;
        margin-bottom: 1rem;
      }

      p {
        font-size: 1.2rem;
        color: #666;
      }
    }

    .credentials-section {
      margin-bottom: 3rem;

      h3 {
        font-size: 1.5rem;
        color: #333;
        margin-bottom: 2rem;
      }

      .credential-grid {
        display: grid;
        gap: 1.5rem;

        .credential-item {
          label {
            display: block;
            font-weight: 600;
            color: #555;
            margin-bottom: 0.5rem;
          }

          .credential-value {
            display: flex;
            align-items: center;
            background: #f8f9fa;
            border-radius: 8px;
            padding: 1rem;
            gap: 1rem;

            span {
              flex: 1;
              font-family: monospace;
              font-size: 0.9rem;
              word-break: break-all;
            }

            button {
              flex-shrink: 0;
            }
          }
        }
      }
    }

    .setup-instructions {
      margin-bottom: 3rem;

      h3 {
        font-size: 1.5rem;
        color: #333;
        margin-bottom: 1.5rem;
      }

      .instruction-list {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 2rem;

        li {
          margin-bottom: 1rem;
          font-size: 1.1rem;
          line-height: 1.6;
          color: #555;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }

    .app-download-reminder {
      background: #e3f2fd;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      margin-bottom: 2rem;

      h3 {
        color: #1976d2;
        margin-bottom: 1rem;
      }

      p {
        color: #555;
        margin-bottom: 1.5rem;
      }
    }

    .quick-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;

      button {
        mat-icon {
          margin-right: 0.5rem;
        }
      }
    }

    .config-error, .loading {
      text-align: center;
      padding: 3rem;

      mat-icon {
        font-size: 4rem;
        height: 4rem;
        width: 4rem;
        margin-bottom: 1rem;
      }

      h3 {
        color: #f44336;
        margin-bottom: 1rem;
      }

      p {
        color: #666;
        margin-bottom: 2rem;
      }
    }

    .loading mat-icon {
      color: #2196f3;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .config-card {
        padding: 2rem;
        margin: 1rem;
      }

      .config-header h1 {
        font-size: 2rem;
      }

      .quick-actions {
        flex-direction: column;
        align-items: center;

        button {
          width: 100%;
          max-width: 300px;
        }
      }
    }
  `]
})
export class AppConfigComponent implements OnInit {
  config: AppConfiguration | null = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private appManagementService: AppManagementService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const configId = params['id'];
      this.loadConfiguration(configId);
    });
  }

  private loadConfiguration(_configId: string): void {
    try {
      // In a real implementation, you'd decode and fetch the configuration
      // For now, we'll simulate loading from URL parameters
      this.route.queryParams.subscribe(params => {
        if (params['m3u_url'] || params['username']) {
          this.config = this.appManagementService.generateAppConfiguration({
            m3u_url: params['m3u_url'] || '',
            xtream_url: params['xtream_url'] || '',
            username: params['username'] || '',
            password: params['password'] || '',
            epg_url: params['epg_url'] || ''
          });
        }
        this.isLoading = false;
      });
    } catch (error) {
      console.error('Failed to load configuration:', error);
      this.isLoading = false;
    }
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

  copyAllCredentials(): void {
    if (!this.config) return;

    const allCredentials = `SteadyStream TV Configuration:
M3U URL: ${this.config.m3uUrl}
Xtream URL: ${this.config.xtreamUrl}
Username: ${this.config.username}
Password: ${this.config.password}
${this.config.epgUrl ? `EPG URL: ${this.config.epgUrl}` : ''}`;

    this.copyToClipboard(allCredentials, 'All credentials');
  }

  downloadConfig(): void {
    if (!this.config) return;

    const configData = {
      name: 'SteadyStream TV',
      type: 'xtream',
      url: this.config.xtreamUrl,
      username: this.config.username,
      password: this.config.password,
      epgUrl: this.config.epgUrl
    };

    const blob = new Blob([JSON.stringify(configData, null, 2)], {
      type: 'application/json'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'steadystream-config.json';
    link.click();

    window.URL.revokeObjectURL(url);
    this.snackBar.open('Configuration downloaded!', 'Close', { duration: 2000 });
  }

  openAppWithConfig(): void {
    if (!this.config) return;

    const deepLink = `steadystream://config?m3u_url=${encodeURIComponent(this.config.m3uUrl)}&username=${encodeURIComponent(this.config.username)}&password=${encodeURIComponent(this.config.password)}`;

    window.location.href = deepLink;

    // Fallback: show instructions if app doesn't open
    setTimeout(() => {
      this.snackBar.open('If the app didn\'t open, copy the credentials manually', 'Close', {
        duration: 5000
      });
    }, 2000);
  }

  isAndroidDevice(): boolean {
    return /Android/i.test(navigator.userAgent);
  }
}