
import { AdminRoute } from "@/components/admin/AdminRoute";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import Navbar from "@/components/Navbar";

const SuperAdminDashboard = () => {
  return (
    <AdminRoute>
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="pt-16">
          <AdminDashboard />
        </div>
      </div>
    </AdminRoute>
  );
};

export default SuperAdminDashboard;
