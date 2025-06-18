
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CrossDeviceSetup } from '@/services/CrossDeviceSetup';

interface FireTVAppSelectionProps {
  userData: any;
  onAppSelect: (deviceType: string, appType: string) => void;
  onBack: () => void;
}

export const FireTVAppSelection: React.FC<FireTVAppSelectionProps> = ({ 
  userData, 
  onAppSelect, 
  onBack 
}) => {
  const appOptions = CrossDeviceSetup.getFireTVAppOptions();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Button onClick={onBack} variant="outline" size="sm" className="mb-4">
          ← Back to Device Selection
        </Button>
        <h2 className="text-2xl font-bold text-white mb-2">
          🔥 Choose Your Fire TV Experience
        </h2>
        <p className="text-gray-400">
          Select the SteadyStream TV app that best fits your needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TiviMate-Based App */}
        <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 border-green-500 bg-dark-200 border-gray-800">
          <CardHeader className="text-center">
            <div className="text-4xl mb-3">⚡</div>
            <CardTitle className="flex items-center justify-center space-x-2 text-white">
              <span>{appOptions.tivimate_branded.shortName}</span>
              <Badge className="bg-green-500">Recommended</Badge>
            </CardTitle>
            <CardDescription className="text-sm text-gray-400">
              {appOptions.tivimate_branded.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2 text-white">Key Features:</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                {appOptions.tivimate_branded.features.slice(0, 4).map((feature, index) => (
                  <li key={index}>• {feature}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              {appOptions.tivimate_branded.benefits.map((benefit, index) => (
                <div key={index} className="text-xs text-green-300 bg-green-900/20 p-2 rounded">
                  {benefit}
                </div>
              ))}
            </div>

            <Button 
              onClick={() => onAppSelect('firestick', 'tivimate_branded')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Choose TiviMate Version
            </Button>
          </CardContent>
        </Card>

        {/* AI-Enhanced Custom App */}
        <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 border-purple-500 bg-dark-200 border-gray-800">
          <CardHeader className="text-center">
            <div className="text-4xl mb-3">🤖</div>
            <CardTitle className="flex items-center justify-center space-x-2 text-white">
              <span>{appOptions.custom_ai.shortName}</span>
              <Badge className="bg-purple-500">AI Powered</Badge>
            </CardTitle>
            <CardDescription className="text-sm text-gray-400">
              {appOptions.custom_ai.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2 text-white">AI Features:</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                {appOptions.custom_ai.features.slice(0, 4).map((feature, index) => (
                  <li key={index}>• {feature}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              {appOptions.custom_ai.benefits.map((benefit, index) => (
                <div key={index} className="text-xs text-purple-300 bg-purple-900/20 p-2 rounded">
                  {benefit}
                </div>
              ))}
            </div>

            <Button 
              onClick={() => onAppSelect('firestick', 'custom_ai')}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Choose AI Enhanced
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Comparison */}
      <Card className="bg-dark-200 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">📊 Quick Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 text-white">Feature</th>
                  <th className="text-center p-2 text-white">TiviMate</th>
                  <th className="text-center p-2 text-white">AI Enhanced</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700">
                  <td className="p-2 text-gray-300">Setup Time</td>
                  <td className="text-center p-2 text-gray-300">⚡ 2-3 minutes</td>
                  <td className="text-center p-2 text-gray-300">🕒 5-7 minutes</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-2 text-gray-300">Reliability</td>
                  <td className="text-center p-2 text-gray-300">🏆 Proven (99.9%)</td>
                  <td className="text-center p-2 text-gray-300">✅ Excellent (99%)</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-2 text-gray-300">AI Features</td>
                  <td className="text-center p-2 text-gray-300">❌ Not available</td>
                  <td className="text-center p-2 text-gray-300">🤖 Advanced AI</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-2 text-gray-300">Recording</td>
                  <td className="text-center p-2 text-gray-300">✅ Full support</td>
                  <td className="text-center p-2 text-gray-300">🚧 Coming soon</td>
                </tr>
                <tr>
                  <td className="p-2 text-gray-300">Best For</td>
                  <td className="text-center p-2 text-gray-300">🎯 Reliability</td>
                  <td className="text-center p-2 text-gray-300">🚀 Innovation</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Alert className="bg-dark-300 border-gray-700">
        <AlertDescription className="text-gray-300">
          <strong className="text-white">💡 Not sure which to choose?</strong>
          <br />
          • Choose <strong className="text-green-400">TiviMate Version</strong> for fastest, most reliable setup
          <br />
          • Choose <strong className="text-purple-400">AI Enhanced</strong> for cutting-edge features and smart recommendations
          <br />
          • You can always switch between apps later!
        </AlertDescription>
      </Alert>
    </div>
  );
};
