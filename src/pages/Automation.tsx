
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { Calendar, Clock, Tv, Plus, Save, Trash2 } from "lucide-react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Automation = () => {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState([
    { id: 1, title: "Sports Game", channel: "SteadyStream Sports", date: "2025-05-10", time: "19:00", duration: 120 },
    { id: 2, title: "Movie Night", channel: "SteadyStream Movies", date: "2025-05-15", time: "21:00", duration: 90 },
  ]);
  const [newSchedule, setNewSchedule] = useState({
    title: "",
    channel: "",
    date: "",
    time: "",
    duration: 60,
  });

  const handleAddSchedule = () => {
    if (!newSchedule.title || !newSchedule.channel || !newSchedule.date || !newSchedule.time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const schedule = {
      id: Date.now(),
      ...newSchedule,
    };

    setSchedules([...schedules, schedule]);
    setNewSchedule({
      title: "",
      channel: "",
      date: "",
      time: "",
      duration: 60,
    });

    toast({
      title: "Schedule Added",
      description: `"${schedule.title}" has been scheduled for recording`,
    });
  };

  const handleDeleteSchedule = (id) => {
    setSchedules(schedules.filter((schedule) => schedule.id !== id));
    toast({
      title: "Schedule Deleted",
      description: "The recording schedule has been deleted",
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-gradient-gold">Automation Center</h1>
            <img
              src="/public/lovable-uploads/1ef1cff2-803f-48c1-8c26-54512fd8f1b6.png"
              alt="SteadyStream Logo"
              className="h-12 md:h-16"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Sidebar */}
            <div className="bg-dark-200 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gold">Controls</h2>
                <img
                  src="/public/lovable-uploads/1ef1cff2-803f-48c1-8c26-54512fd8f1b6.png"
                  alt="SteadyStream Logo"
                  className="h-8"
                />
              </div>
              
              <nav className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <Clock className="mr-2 h-4 w-4" />
                  Recording Schedules
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Calendar View
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Tv className="mr-2 h-4 w-4" />
                  Automated Playlists
                </Button>
              </nav>
              
              <div className="mt-6 p-4 bg-dark-300 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gold">Quick Stats</h3>
                  <img
                    src="/public/lovable-uploads/1ef1cff2-803f-48c1-8c26-54512fd8f1b6.png"
                    alt="SteadyStream Logo"
                    className="h-5"
                  />
                </div>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>Active Schedules: {schedules.length}</p>
                  <p>Storage Used: 28.5 GB</p>
                  <p>Storage Available: 171.5 GB</p>
                </div>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Create Schedule Form */}
              <Card className="bg-dark-200 border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-gold">Create Recording Schedule</CardTitle>
                    <img
                      src="/public/lovable-uploads/1ef1cff2-803f-48c1-8c26-54512fd8f1b6.png"
                      alt="SteadyStream Logo"
                      className="h-6"
                    />
                  </div>
                  <CardDescription>Set up automated recordings of your favorite shows</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">Title</label>
                      <Input 
                        placeholder="My Favorite Show" 
                        className="bg-dark-300 border-gray-700"
                        value={newSchedule.title}
                        onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">Channel</label>
                      <Select 
                        value={newSchedule.channel} 
                        onValueChange={(value) => setNewSchedule({...newSchedule, channel: value})}
                      >
                        <SelectTrigger className="bg-dark-300 border-gray-700">
                          <SelectValue placeholder="Select a channel" />
                        </SelectTrigger>
                        <SelectContent className="bg-dark-300 border-gray-700">
                          <SelectItem value="SteadyStream Sports">SteadyStream Sports</SelectItem>
                          <SelectItem value="SteadyStream Movies">SteadyStream Movies</SelectItem>
                          <SelectItem value="SteadyStream News">SteadyStream News</SelectItem>
                          <SelectItem value="SteadyStream Entertainment">SteadyStream Entertainment</SelectItem>
                          <SelectItem value="SteadyStream Kids">SteadyStream Kids</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">Date</label>
                      <Input 
                        type="date" 
                        className="bg-dark-300 border-gray-700"
                        value={newSchedule.date}
                        onChange={(e) => setNewSchedule({...newSchedule, date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">Time</label>
                      <Input 
                        type="time" 
                        className="bg-dark-300 border-gray-700"
                        value={newSchedule.time}
                        onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">Duration (minutes)</label>
                      <Input 
                        type="number" 
                        className="bg-dark-300 border-gray-700"
                        value={newSchedule.duration}
                        onChange={(e) => setNewSchedule({...newSchedule, duration: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="bg-gold hover:bg-gold-dark text-black" onClick={handleAddSchedule}>
                    <Plus className="h-4 w-4 mr-2" /> Add Schedule
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Scheduled Recordings */}
              <Card className="bg-dark-200 border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-gold">Scheduled Recordings</CardTitle>
                    <img
                      src="/public/lovable-uploads/1ef1cff2-803f-48c1-8c26-54512fd8f1b6.png"
                      alt="SteadyStream Logo"
                      className="h-6"
                    />
                  </div>
                  <CardDescription>Manage your automated recording schedules</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {schedules.length === 0 ? (
                      <p className="text-gray-400 text-center py-4">No recording schedules found</p>
                    ) : (
                      schedules.map((schedule) => (
                        <div key={schedule.id} className="flex items-center justify-between p-3 bg-dark-300 rounded-lg border border-gray-700">
                          <div className="flex items-center gap-3">
                            <div className="bg-gold/20 p-2 rounded-md">
                              <Tv className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                              <h3 className="font-medium">{schedule.title}</h3>
                              <p className="text-sm text-gray-400">
                                {schedule.channel} • {schedule.date} at {schedule.time} • {schedule.duration} mins
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteSchedule(schedule.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Feature highlights */}
          <div className="mt-12 bg-dark-200 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gold">Automation Features</h2>
              <img
                src="/public/lovable-uploads/1ef1cff2-803f-48c1-8c26-54512fd8f1b6.png"
                alt="SteadyStream Logo"
                className="h-10"
              />
            </div>
            <p className="text-gray-300 mb-4">
              SteadyStream's automation features let you record your favorite shows, create custom playlists,
              and set up scheduled viewing for your convenience.
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <FeatureCard 
                title="Smart Recording" 
                description="Automatically record shows based on keywords or genres"
              />
              <FeatureCard 
                title="Series Recording" 
                description="Set once and record all episodes of a series"
              />
              <FeatureCard 
                title="Cloud Storage" 
                description="Access your recordings from any device"
              />
            </div>
          </div>
        </div>
      </div>
      <FooterSection />
    </div>
  );
};

const FeatureCard = ({ title, description }) => (
  <div className="bg-dark-300 p-4 rounded-lg border border-gray-700">
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-semibold text-gold">{title}</h3>
      <img
        src="/public/lovable-uploads/1ef1cff2-803f-48c1-8c26-54512fd8f1b6.png"
        alt="SteadyStream Logo"
        className="h-5"
      />
    </div>
    <p className="text-gray-400 text-sm">{description}</p>
  </div>
);

export default Automation;
