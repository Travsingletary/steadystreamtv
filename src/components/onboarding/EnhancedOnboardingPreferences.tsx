import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Tv, Smartphone, Monitor, Globe, Shield, Users, MessageCircle } from "lucide-react";

interface OnboardingPreferencesProps {
  userData: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
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

interface Template {
  id: number;
  megaott_template_id: number;
  name: string;
  description: string;
}

const EnhancedOnboardingPreferences = ({ userData, onUpdate, onNext, onBack }: OnboardingPreferencesProps) => {
  const [subscriptionType, setSubscriptionType] = useState<'m3u' | 'mag' | 'enigma'>('m3u');
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [maxConnections, setMaxConnections] = useState(2);
  const [forcedCountry, setForcedCountry] = useState('ALL');
  const [adultContent, setAdultContent] = useState(false);
  const [enableVpn, setEnableVpn] = useState(false);
  const [macAddress, setMacAddress] = useState('');
  const [note, setNote] = useState('');
  const [whatsappTelegram, setWhatsappTelegram] = useState('');
  
  const [packages, setPackages] = useState<Package[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackagesAndTemplates();
  }, []);

  const fetchPackagesAndTemplates = async () => {
    try {
      const [packagesResponse, templatesResponse] = await Promise.all([
        supabase.from('packages').select('*').eq('is_active', true),
        supabase.from('templates').select('*').eq('is_active', true)
      ]);

      if (packagesResponse.data) setPackages(packagesResponse.data);
      if (templatesResponse.data) setTemplates(templatesResponse.data);
    } catch (error) {
      console.error('Error fetching packages/templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const deviceTypes = [
    {
      id: 'm3u',
      name: 'M3U/M3U8',
      description: 'Compatible with most IPTV players, apps, and devices',
      icon: <Smartphone className="h-6 w-6" />,
      features: ['Universal compatibility', 'Easy setup', 'Works on all devices']
    },
    {
      id: 'mag',
      name: 'MAG Box',
      description: 'Dedicated IPTV set-top boxes',
      icon: <Tv className="h-6 w-6" />,
      features: ['Premium experience', 'Dedicated hardware', 'Portal interface']
    },
    {
      id: 'enigma',
      name: 'Enigma',
      description: 'Linux-based receivers and satellite boxes',
      icon: <Monitor className="h-6 w-6" />,
      features: ['Advanced features', 'Satellite integration', 'Professional grade']
    }
  ];

  const countries = [
    { value: 'ALL', label: 'All Countries' },
    { value: 'US', label: 'United States' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'CA', label: 'Canada' },
    { value: 'AU', label: 'Australia' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'ES', label: 'Spain' },
    { value: 'IT', label: 'Italy' },
    { value: 'NL', label: 'Netherlands' }
  ];

  const handleNext = () => {
    const selectedPackageData = packages.find(p => p.megaott_package_id === selectedPackage);
    const selectedTemplateData = templates.find(t => t.megaott_template_id === selectedTemplate);

    const preferences = {
      subscriptionType,
      packageId: selectedPackage,
      packageName: selectedPackageData?.name,
      templateId: selectedTemplate,
      templateName: selectedTemplateData?.name,
      maxConnections,
      forcedCountry,
      adultContent,
      enableVpn,
      macAddress: subscriptionType !== 'm3u' ? macAddress : undefined,
      note,
      whatsappTelegram
    };

    onUpdate({
      ...userData,
      preferences
    });
    onNext();
  };

  const isValidMacAddress = (mac: string) => {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
  };

  const canProceed = () => {
    if (!selectedPackage) return false;
    if (subscriptionType !== 'm3u' && (!macAddress || !isValidMacAddress(macAddress))) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-gold border-r-transparent border-b-transparent border-l-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gold mb-4">Customize Your Experience</h1>
          <p className="text-xl text-gray-300">
            Configure your streaming preferences and device settings
          </p>
        </div>

        <div className="space-y-8">
          {/* Device Type Selection */}
          <Card className="bg-dark-200 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tv className="text-gold" />
                Device Type
              </CardTitle>
              <CardDescription>Choose your preferred streaming method</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={subscriptionType} 
                onValueChange={(value: 'm3u' | 'mag' | 'enigma') => setSubscriptionType(value)}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {deviceTypes.map((device) => (
                  <div key={device.id} className="relative">
                    <RadioGroupItem
                      value={device.id}
                      id={device.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={device.id}
                      className="flex flex-col p-4 rounded-lg border-2 border-gray-700 cursor-pointer hover:border-gold peer-checked:border-gold peer-checked:bg-gold/10 transition-all"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {device.icon}
                        <span className="font-semibold">{device.name}</span>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{device.description}</p>
                      <ul className="text-xs text-gray-500 space-y-1">
                        {device.features.map((feature, index) => (
                          <li key={index}>• {feature}</li>
                        ))}
                      </ul>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* MAC Address for MAG/Enigma */}
          {subscriptionType !== 'm3u' && (
            <Card className="bg-dark-200 border-gray-800">
              <CardHeader>
                <CardTitle>Device MAC Address</CardTitle>
                <CardDescription>
                  Enter the MAC address of your {subscriptionType.toUpperCase()} device
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    placeholder="00:1A:79:XX:XX:XX"
                    value={macAddress}
                    onChange={(e) => setMacAddress(e.target.value)}
                    className="bg-dark-300 border-gray-700"
                  />
                  {macAddress && !isValidMacAddress(macAddress) && (
                    <p className="text-red-500 text-sm">
                      Please enter a valid MAC address (format: XX:XX:XX:XX:XX:XX)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Package Selection */}
          <Card className="bg-dark-200 border-gray-800">
            <CardHeader>
              <CardTitle>Subscription Package</CardTitle>
              <CardDescription>Choose your subscription duration and features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="relative">
                    <input
                      type="radio"
                      id={`package-${pkg.id}`}
                      name="package"
                      value={pkg.megaott_package_id}
                      checked={selectedPackage === pkg.megaott_package_id}
                      onChange={() => setSelectedPackage(pkg.megaott_package_id)}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`package-${pkg.id}`}
                      className="flex flex-col p-4 rounded-lg border-2 border-gray-700 cursor-pointer hover:border-gold peer-checked:border-gold peer-checked:bg-gold/10 transition-all"
                    >
                      <span className="font-semibold text-lg">{pkg.name}</span>
                      <span className="text-2xl font-bold text-gold">${pkg.price}</span>
                      <span className="text-sm text-gray-400">{pkg.duration_days} days</span>
                      <span className="text-sm text-gray-400">
                        {pkg.max_connections} connections
                      </span>
                      {pkg.description && (
                        <p className="text-xs text-gray-500 mt-2">{pkg.description}</p>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Template Selection */}
          {templates.length > 0 && (
            <Card className="bg-dark-200 border-gray-800">
              <CardHeader>
                <CardTitle>Channel Template</CardTitle>
                <CardDescription>Select your preferred channel lineup</CardDescription>
              </CardHeader>
              <CardContent>
                <Select onValueChange={(value) => setSelectedTemplate(Number(value))}>
                  <SelectTrigger className="bg-dark-300 border-gray-700">
                    <SelectValue placeholder="Choose a channel template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.megaott_template_id.toString()}>
                        <div>
                          <div className="font-semibold">{template.name}</div>
                          {template.description && (
                            <div className="text-sm text-gray-400">{template.description}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Advanced Settings */}
          <Card className="bg-dark-200 border-gray-800">
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Customize your streaming experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Max Connections */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gold" />
                  <Label>Maximum Connections</Label>
                </div>
                <Select onValueChange={(value) => setMaxConnections(Number(value))} defaultValue="2">
                  <SelectTrigger className="w-32 bg-dark-300 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator className="border-gray-700" />

              {/* Country Selection */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gold" />
                  <Label>Content Region</Label>
                </div>
                <Select onValueChange={setForcedCountry} defaultValue="ALL">
                  <SelectTrigger className="w-48 bg-dark-300 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator className="border-gray-700" />

              {/* Adult Content */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gold" />
                  <Label>Adult Content</Label>
                </div>
                <Switch
                  checked={adultContent}
                  onCheckedChange={setAdultContent}
                />
              </div>

              <Separator className="border-gray-700" />

              {/* VPN Support */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gold" />
                  <Label>VPN Support</Label>
                </div>
                <Switch
                  checked={enableVpn}
                  onCheckedChange={setEnableVpn}
                />
              </div>

              <Separator className="border-gray-700" />

              {/* WhatsApp/Telegram */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-gold" />
                  <Label>WhatsApp/Telegram (Optional)</Label>
                </div>
                <Input
                  placeholder="Your WhatsApp or Telegram number"
                  value={whatsappTelegram}
                  onChange={(e) => setWhatsappTelegram(e.target.value)}
                  className="bg-dark-300 border-gray-700"
                />
                <p className="text-xs text-gray-500">
                  This number will be shown in the app when your subscription expires
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Additional Notes (Optional)</Label>
                <Textarea
                  placeholder="Any special requirements or notes..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="bg-dark-300 border-gray-700"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-12">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="border-gray-700 text-white hover:bg-gray-800"
          >
            Back
          </Button>
          <Button 
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-gold hover:bg-gold-dark text-black font-semibold"
          >
            Continue to Payment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedOnboardingPreferences;