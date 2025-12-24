import React from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

const AppointmentBanner = () => {
  return (
    <nav className=" top-0 left-0 min-w-full bg-blue-600 p-3">
      <div className="flex items-center justify-around">
        <Link href={"/"}>
          <p className="p-2 hover:bg-blue-700 transition-all ease-in rounded-full cursor-pointer">
            <ChevronLeft className="text-white" />
          </p>
        </Link>
        <h1 className="text-white lg:block hidden font-semibold tracking-wider -translate-x-110">
          Appointment
        </h1>
      </div>
    </nav>
  );
};

export default AppointmentBanner;
