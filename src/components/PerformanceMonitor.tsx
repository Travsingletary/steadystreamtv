
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Clock, AlertTriangle } from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    connectionQuality: 'good'
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or for admin users
    const isDev = window.location.hostname === 'localhost';
    const isAdmin = localStorage.getItem('admin_mode') === 'true';
    setIsVisible(isDev || isAdmin);

    if (!isVisible) return;

    const measurePerformance = () => {
      // Page load time
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;

      // Memory usage (if available)
      const memoryInfo = (performance as any).memory;
      const memoryUsage = memoryInfo ? (memoryInfo.usedJSHeapSize / 1024 / 1024) : 0;

      // Simulate API response time measurement
      const apiStart = performance.now();
      fetch('/api/health-check')
        .then(() => {
          const apiResponseTime = performance.now() - apiStart;
          
          setMetrics({
            loadTime: Math.round(loadTime),
            apiResponseTime: Math.round(apiResponseTime),
            memoryUsage: Math.round(memoryUsage),
            connectionQuality: apiResponseTime < 200 ? 'excellent' : 
                             apiResponseTime < 500 ? 'good' : 
                             apiResponseTime < 1000 ? 'fair' : 'poor'
          });
        })
        .catch(() => {
          setMetrics(prev => ({
            ...prev,
            connectionQuality: 'poor'
          }));
        });
    };

    measurePerformance();
    const interval = setInterval(measurePerformance, 30000); // Update every 30s

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-green-600';
      case 'good': return 'bg-blue-600';
      case 'fair': return 'bg-yellow-600';
      case 'poor': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <Card className="bg-dark-200 border-gray-800 w-64 text-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-gold" />
            Performance Monitor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Load Time
            </span>
            <span>{metrics.loadTime}ms</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              API Response
            </span>
            <span>{metrics.apiResponseTime}ms</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Memory
            </span>
            <span>{metrics.memoryUsage}MB</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span>Connection</span>
            <Badge className={`${getQualityColor(metrics.connectionQuality)} text-white`}>
              {metrics.connectionQuality}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
