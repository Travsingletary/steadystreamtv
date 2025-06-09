
import { CustomDashboardAdmin } from "@/components/CustomDashboardAdmin";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";

const CustomDashboardAdminPage = () => {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-16">
        <CustomDashboardAdmin />
      </div>
      <FooterSection />
    </div>
  );
};

export default CustomDashboardAdminPage;
