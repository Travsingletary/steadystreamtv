import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Calendar, 
  Users, 
  Globe, 
  Shield, 
  Smartphone, 
  Tv, 
  Monitor,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface Subscription {
  id: string;
  subscription_type: 'm3u' | 'mag' | 'enigma';
  status: string;
  package_name: string;
  template_name?: string;
  iptv_username?: string;
  iptv_password?: string;
  mac_address?: string;
  max_connections: number;
  forced_country: string;
  adult_content: boolean;
  enable_vpn: boolean;
  dns_link?: string;
  dns_link_samsung_lg?: string;
  portal_link?: string;
  expiring_at?: string;
  start_date?: string;
  end_date?: string;
  megaott_subscription_id?: number;
  note?: string;
  whatsapp_telegram?: string;
}

interface Package {
  id: number;
  megaott_package_id: number;
  name: string;
  description: string;
  duration_days: number;
  price: number;
  max_connections: number;
}

interface EnhancedSubscriptionManagerProps {
  subscription: Subscription | null;
  onSubscriptionUpdate: () => void;
}

const EnhancedSubscriptionManager = ({ subscription, onSubscriptionUpdate }: EnhancedSubscriptionManagerProps) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'm3u': return <Smartphone className="h-4 w-4" />;
      case 'mag': return <Tv className="h-4 w-4" />;
      case 'enigma': return <Monitor className="h-4 w-4" />;
      default: return <Smartphone className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-900/30 text-green-500 border-green-500/50';
      case 'inactive': return 'bg-red-900/30 text-red-500 border-red-500/50';
      case 'pending': return 'bg-yellow-900/30 text-yellow-500 border-yellow-500/50';
      default: return 'bg-gray-900/30 text-gray-500 border-gray-500/50';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (expiringAt?: string) => {
    if (!expiringAt) return null;
    const now = new Date();
    const expiry = new Date(expiringAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleSubscriptionAction = async (action: 'activate' | 'deactivate' | 'extend') => {
    if (!subscription) return;

    setActionLoading(action);
    try {
      let payload: any = {
        subscriptionId: subscription.id
      };

      if (action === 'extend') {
        if (!selectedPackage) {
          toast({
            title: "Error",
            description: "Please select a package to extend your subscription",
            variant: "destructive"
          });
          return;
        }
        payload.packageId = selectedPackage;
        payload.paid = true;
      }

      const { data, error } = await supabase.functions.invoke('megaott-subscription', {
        body: {
          ...payload,
          action: action
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to perform action');
      }

      toast({
        title: "Success",
        description: data.message || `Subscription ${action}d successfully`,
        variant: "default"
      });

      onSubscriptionUpdate();
    } catch (error: any) {
      console.error(`Error ${action}ing subscription:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} subscription`,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (!subscription) {
    return (
      <Card className="bg-dark-200 border-gray-800">
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>You don't have an active subscription yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const daysRemaining = getDaysRemaining(subscription.expiring_at);
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7;
  const isExpired = daysRemaining !== null && daysRemaining < 0;

  return (
    <div className="space-y-6">
      {/* Subscription Status Alert */}
      {isExpired && (
        <Alert className="bg-red-900/30 border-red-500 text-red-100">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Subscription Expired</AlertTitle>
          <AlertDescription>
            Your subscription expired {Math.abs(daysRemaining!)} days ago. Please renew to continue streaming.
          </AlertDescription>
        </Alert>
      )}

      {isExpiringSoon && !isExpired && (
        <Alert className="bg-yellow-900/30 border-yellow-500 text-yellow-100">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Subscription Expiring Soon</AlertTitle>
          <AlertDescription>
            Your subscription expires in {daysRemaining} days. Consider extending it to avoid interruption.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Subscription Card */}
      <Card className="bg-dark-200 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getDeviceIcon(subscription.subscription_type)}
              {subscription.subscription_type.toUpperCase()} Subscription
            </CardTitle>
            <Badge className={`${getStatusColor(subscription.status)} border`}>
              <div className="flex items-center gap-1">
                {getStatusIcon(subscription.status)}
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </div>
            </Badge>
          </div>
          <CardDescription>
            {subscription.package_name} 
            {subscription.template_name && ` - ${subscription.template_name}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subscription Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Expiration */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gold" />
              <div>
                <p className="text-sm text-gray-400">Expires</p>
                <p className="font-medium">{formatDate(subscription.expiring_at)}</p>
                {daysRemaining !== null && (
                  <p className={`text-xs ${isExpiringSoon ? 'text-yellow-500' : 'text-gray-500'}`}>
                    {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Expired'}
                  </p>
                )}
              </div>
            </div>

            {/* Max Connections */}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gold" />
              <div>
                <p className="text-sm text-gray-400">Max Connections</p>
                <p className="font-medium">{subscription.max_connections}</p>
              </div>
            </div>

            {/* Content Region */}
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gold" />
              <div>
                <p className="text-sm text-gray-400">Content Region</p>
                <p className="font-medium">
                  {subscription.forced_country === 'ALL' ? 'All Countries' : subscription.forced_country}
                </p>
              </div>
            </div>
          </div>

          <Separator className="border-gray-700" />

          {/* Features */}
          <div>
            <h4 className="font-medium mb-3">Enabled Features</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-dark-300">
                <Shield className="h-3 w-3 mr-1" />
                {subscription.adult_content ? 'Adult Content' : 'Family Safe'}
              </Badge>
              <Badge variant="secondary" className="bg-dark-300">
                <Shield className="h-3 w-3 mr-1" />
                {subscription.enable_vpn ? 'VPN Enabled' : 'VPN Disabled'}
              </Badge>
            </div>
          </div>

          {/* Credentials Section */}
          {subscription.subscription_type === 'm3u' ? (
            <div>
              <h4 className="font-medium mb-3">IPTV Credentials</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-dark-300 rounded-lg">
                <div>
                  <p className="text-sm text-gray-400">Username</p>
                  <p className="font-mono font-medium">{subscription.iptv_username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Password</p>
                  <p className="font-mono font-medium">{subscription.iptv_password}</p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h4 className="font-medium mb-3">Device Information</h4>
              <div className="p-4 bg-dark-300 rounded-lg">
                <div>
                  <p className="text-sm text-gray-400">MAC Address</p>
                  <p className="font-mono font-medium">{subscription.mac_address}</p>
                </div>
              </div>
            </div>
          )}

          {/* URLs Section */}
          <div>
            <h4 className="font-medium mb-3">Streaming URLs</h4>
            <div className="space-y-2">
              {subscription.dns_link && (
                <div className="p-3 bg-dark-300 rounded">
                  <p className="text-sm text-gray-400 mb-1">DNS Link</p>
                  <p className="font-mono text-sm break-all">{subscription.dns_link}</p>
                </div>
              )}
              {subscription.dns_link_samsung_lg && (
                <div className="p-3 bg-dark-300 rounded">
                  <p className="text-sm text-gray-400 mb-1">Samsung/LG Smart TV Link</p>
                  <p className="font-mono text-sm break-all">{subscription.dns_link_samsung_lg}</p>
                </div>
              )}
              {subscription.portal_link && (
                <div className="p-3 bg-dark-300 rounded">
                  <p className="text-sm text-gray-400 mb-1">Portal Link</p>
                  <p className="font-mono text-sm break-all">{subscription.portal_link}</p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          {(subscription.note || subscription.whatsapp_telegram) && (
            <div>
              <h4 className="font-medium mb-3">Additional Information</h4>
              <div className="space-y-2">
                {subscription.note && (
                  <div>
                    <p className="text-sm text-gray-400">Note</p>
                    <p className="text-sm">{subscription.note}</p>
                  </div>
                )}
                {subscription.whatsapp_telegram && (
                  <div>
                    <p className="text-sm text-gray-400">Support Contact</p>
                    <p className="text-sm">{subscription.whatsapp_telegram}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4">
            {subscription.status === 'inactive' && (
              <Button
                onClick={() => handleSubscriptionAction('activate')}
                disabled={actionLoading === 'activate'}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                {actionLoading === 'activate' ? 'Activating...' : 'Activate'}
              </Button>
            )}

            {subscription.status === 'active' && (
              <Button
                variant="destructive"
                onClick={() => handleSubscriptionAction('deactivate')}
                disabled={actionLoading === 'deactivate'}
              >
                <Pause className="h-4 w-4 mr-2" />
                {actionLoading === 'deactivate' ? 'Deactivating...' : 'Deactivate'}
              </Button>
            )}

            {/* Extend Subscription Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-gold text-gold hover:bg-gold hover:text-black"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Extend Subscription
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-dark-200 border-gray-800">
                <DialogHeader>
                  <DialogTitle>Extend Subscription</DialogTitle>
                  <DialogDescription>
                    Choose a package to extend your current subscription
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Select onValueChange={(value) => setSelectedPackage(Number(value))}>
                    <SelectTrigger className="bg-dark-300 border-gray-700">
                      <SelectValue placeholder="Select extension package" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.megaott_package_id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{pkg.name}</span>
                            <span className="text-gold ml-4">${pkg.price}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleSubscriptionAction('extend')}
                    disabled={!selectedPackage || actionLoading === 'extend'}
                    className="w-full bg-gold hover:bg-gold-dark text-black"
                  >
                    {actionLoading === 'extend' ? 'Extending...' : 'Extend Subscription'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedSubscriptionManager;