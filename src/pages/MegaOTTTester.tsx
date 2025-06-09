
import { MegaOTTAPITester } from "@/components/MegaOTTAPITester";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";

const MegaOTTTesterPage = () => {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-16">
        <MegaOTTAPITester />
      </div>
      <FooterSection />
    </div>
  );
};

export default MegaOTTTesterPage;
