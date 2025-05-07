
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const TestXtreamAccount = () => {
  const [userId, setUserId] = useState("");
  const [planType, setPlanType] = useState("solo");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle function invocation
  const handleTestFunction = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If not authenticated, try to sign in as a test user
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: 'test123',
        });
        
        if (authError) {
          throw new Error("Authentication required. Please sign in first or create a test account.");
        }
        toast.success("Successfully authenticated as test user");
      }

      // Call the edge function
      const { data, error: funcError } = await supabase.functions.invoke('create-xtream-account', {
        body: { 
          userId: userId || 'test-user-id',
          planType: planType,
          email: email || 'test@example.com',
          name: name || 'Test User'
        }
      });
      
      if (funcError) throw funcError;

      setResult(data);
      toast.success("Xtream account created successfully!");
    } catch (err: any) {
      console.error("Error testing function:", err);
      setError(err?.message || "Unknown error occurred");
      toast.error(`Error: ${err?.message || "Failed to create account"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-6 text-center">Test Xtream Account Creation Function</h1>
      
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Test Parameters</CardTitle>
          <CardDescription>
            Fill in the details to test the create-xtream-account function
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID (optional)</Label>
            <Input 
              id="userId" 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)} 
              placeholder="Leave blank to use test ID" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="planType">Plan Type</Label>
            <Select 
              value={planType} 
              onValueChange={setPlanType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select plan type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solo">Solo</SelectItem>
                <SelectItem value="duo">Duo</SelectItem>
                <SelectItem value="family">Family</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Leave blank to use test email" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Name (optional)</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Leave blank to use test name" 
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            className="w-full"
            onClick={handleTestFunction}
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Test Function"}
          </Button>
        </CardFooter>
      </Card>
      
      {error && (
        <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Error</h2>
          <pre className="bg-red-100 p-4 rounded text-sm overflow-auto">
            {error}
          </pre>
        </div>
      )}
      
      {result && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-md">
          <h2 className="text-lg font-semibold text-green-700 mb-2">Success Result</h2>
          <pre className="bg-green-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-12 bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Debugging Tips</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Make sure you're signed in - the function requires authentication</li>
          <li>Check the Supabase Edge Function logs for detailed error messages</li>
          <li>Verify that the MegaOTT API key and credentials are valid</li>
          <li>Ensure that the <code>user_profiles</code> table exists in your database</li>
        </ul>
      </div>
    </div>
  );
};

export default TestXtreamAccount;
