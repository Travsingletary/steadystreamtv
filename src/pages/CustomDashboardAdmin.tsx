
import { CustomDashboardAdmin } from "@/components/CustomDashboardAdmin";
import { AdminRoute } from "@/components/admin/AdminRoute";
import Navbar from "@/components/Navbar";

const CustomDashboardAdminPage = () => {
  return (
    <AdminRoute>
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="pt-16">
          <CustomDashboardAdmin />
        </div>
      </div>
    </AdminRoute>
  );
};

export default CustomDashboardAdminPage;
