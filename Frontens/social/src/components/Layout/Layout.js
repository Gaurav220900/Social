import { Outlet } from "react-router-dom";
import Navbar from "../Nav/Nav";
import Footer from "../Footer/Footer";
export default function Layout() {
  return (
    <div className="appWrapper">
      <Navbar />

      <main style={{ minHeight: "80vh", padding: "20px" }}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
