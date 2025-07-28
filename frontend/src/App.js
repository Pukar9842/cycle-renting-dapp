import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Web3Provider, useWeb3 } from "./context/Web3Context";
import { useToast } from "@chakra-ui/react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import BrowseCycles from "./pages/BrowseCycles";
import MyRentals from "./pages/MyRentals";
import MyCycles from "./pages/MyCycles";
import ListCycle from "./pages/ListCycle";
import CycleDetail from "./pages/CycleDetail";
import Admin from "./pages/Admin";

function AppContent() {
  const { contract, account, isConnected } = useWeb3();
  const [rentals, setRentals] = useState([]);
  const toast = useToast();

  // Check for expired rentals globally
  useEffect(() => {
    const checkGlobalExpiredRentals = async () => {
      if (!contract || !isConnected || !account) return;

      try {
        const rentalIds = await contract.getUserRentals(account);
        const currentRentals = [];

        for (const rentalId of rentalIds) {
          const rental = await contract.getRental(rentalId);
          if (rental.isActive && !rental.isReturned) {
            currentRentals.push({
              id: rental.id.toString(),
              endTime: new Date(Number(rental.endTime) * 1000),
            });
          }
        }

        setRentals(currentRentals);
      } catch (error) {
        console.error("Error checking global rentals:", error);
      }
    };

    checkGlobalExpiredRentals();
    const interval = setInterval(checkGlobalExpiredRentals, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [contract, isConnected, account]);

  // Monitor for expired rentals and show global notifications
  useEffect(() => {
    const now = new Date();
    rentals.forEach((rental) => {
      if (now > rental.endTime) {
        // Show notification for expired rental
        toast({
          title: "⏰ Rental Time Expired!",
          description:
            "One of your rentals has expired. Please return the cycle immediately.",
          status: "warning",
          duration: 15000,
          isClosable: true,
          position: "top-right",
        });
      }
    });
  }, [rentals, toast]);

  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<BrowseCycles />} />
        <Route path="/my-rentals" element={<MyRentals />} />
        <Route path="/my-cycles" element={<MyCycles />} />
        <Route path="/list-cycle" element={<ListCycle />} />
        <Route path="/cycle/:id" element={<CycleDetail />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}

export default App;
