
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Calendar, Mail, User, Smartphone, Key, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OnboardingCompleteProps {
  userData: {
    name: string;
    email: string;
    preferredDevice: string;
    genres: string[];
    subscription: any;
    xtreamCredentials?: {
      username: string;
      password: string;
    };
  };
}

export const OnboardingComplete = ({ userData }: OnboardingCompleteProps) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const { toast } = useToast();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Redirect to player/dashboard automatically
      navigate("/player");
    }
  }, [countdown, navigate]);

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  };

  const getDeviceName = () => {
    switch (userData.preferredDevice) {
      case "smartphone": return "Smartphone";
      case "smart-tv": return "Smart TV";
      case "firestick": return "Fire TV Stick";
      case "tablet": return "Tablet";
      case "web": return "Computer (Web)";
      default: return "N/A";
    }
  };

  const handleGoToPlayer = () => {
    navigate("/player");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} has been copied to your clipboard.`
      });
    });
  };

  const getDeviceInstructions = () => {
    // Return device-specific instructions
    switch (userData.preferredDevice) {
      case "firestick":
        return (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="font-medium mb-3">Fire TV Stick Setup Instructions</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>On your Fire TV, search for "Downloader" app and install it</li>
              <li>Open Downloader and enter this URL: <span className="font-medium text-gold">steadystream.tv/firestick</span></li>
              <li>Install the SteadyStream app when prompted</li>
              <li>Open the app and sign in with your email and password</li>
              <li>Your device will be automatically activated</li>
            </ol>
            <div className="mt-4 flex gap-3">
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs border-gray-700"
                onClick={() => copyToClipboard("steadystream.tv/firestick", "Download URL")}
              >
                <QrCode className="h-3 w-3 mr-1" /> Copy URL
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs border-gray-700"
                onClick={() => copyToClipboard(`${userData.email}`, "Email")}
              >
                <Mail className="h-3 w-3 mr-1" /> Copy Email
              </Button>
            </div>
          </div>
        );
      case "smart-tv":
        return (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="font-medium mb-3">Smart TV Setup Instructions</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>On your Smart TV, open the app store</li>
              <li>Search for "SteadyStream TV" and install it</li>
              <li>Open the app and select "Sign In"</li>
              <li>Enter your email address and password</li>
              <li>Your account will be automatically linked</li>
            </ol>
          </div>
        );
      case "smartphone":
        return (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="font-medium mb-3">Smartphone Setup Instructions</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>Open the App Store (iOS) or Play Store (Android)</li>
              <li>Search for "SteadyStream TV" and install the app</li>
              <li>Open the app and sign in with your account email and password</li>
              <li>Enable notifications for updates about new content</li>
            </ol>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-dark-200 rounded-xl border border-gray-800 p-8 animate-fade-in">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center bg-green-500/20 rounded-full p-4 mb-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold mb-2">You're All Set!</h1>
        <p className="text-gray-400">
          Your SteadyStream TV experience is ready. Redirecting to your player in {countdown}...
        </p>
      </div>

      <div className="bg-dark-300 rounded-lg border border-gray-700 p-6 mb-8">
        <h3 className="font-medium text-gold mb-4">Your Setup Summary</h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-400">Account Name</p>
              <p className="font-medium">{userData.name}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="font-medium">{userData.email}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Smartphone className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-400">Primary Device</p>
              <p className="font-medium">{getDeviceName()}</p>
            </div>
          </div>
          
          {userData.subscription && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Trial End Date</p>
                <p className="font-medium">{formatDate(userData.subscription.trialEndDate)}</p>
              </div>
            </div>
          )}

          {userData.xtreamCredentials && (
            <div className="flex items-start gap-3">
              <Key className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Streaming Credentials</p>
                <p className="font-medium">Username: {userData.xtreamCredentials.username}</p>
                <p className="font-medium">Password: {userData.xtreamCredentials.password}</p>
                <div className="flex gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs border-gray-700"
                    onClick={() => copyToClipboard(userData.xtreamCredentials!.username, "Username")}
                  >
                    Copy Username
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs border-gray-700"
                    onClick={() => copyToClipboard(userData.xtreamCredentials!.password, "Password")}
                  >
                    Copy Password
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Save these credentials if you plan to use external players
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <h4 className="font-medium mb-3">Your Personalized Playlists</h4>
          <div className="flex flex-wrap gap-2">
            {userData.genres.slice(0, 6).map((genre, i) => (
              <div key={i} className="px-3 py-1 bg-dark-400 rounded-full text-xs font-medium">
                {genre}
              </div>
            ))}
            {userData.genres.length > 6 && (
              <div className="px-3 py-1 bg-dark-400 rounded-full text-xs font-medium">
                +{userData.genres.length - 6} more
              </div>
            )}
          </div>
        </div>

        {getDeviceInstructions()}
      </div>

      <div className="space-y-4">
        <Button 
          className="w-full bg-gold hover:bg-gold-dark text-black font-semibold"
          onClick={handleGoToPlayer}
        >
          Start Watching Now
        </Button>
        
        <p className="text-center text-sm text-gray-400">
          We've sent a confirmation email to {userData.email} with your account details.
        </p>
      </div>
    </div>
  );
};
