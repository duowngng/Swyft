import { Driving, SmallCard, SmartCar, Wallet } from "@/utils/icons";
import Images from "../utils/images";
import color from "@/themes/app.colors";
import React from "react";

export const slides = [
  {
    id: 0,
    image: Images.destination,
    text: "Choose Your Destination",
    description: "First choose your destination where you want to go!",
  },
  {
    id: 1,
    image: Images.trip,
    text: "Wait for your driver",
    description: "Just wait for a while now until your driver is picking you!",
  },
  {
    id: 2,
    image: Images.bookRide,
    text: "Enjoy Your Trip",
    description:
        "Now enjoy your trip, pay your driver after reaching the destination!",
  },
];

export const rideData = [
  { id: "1", totalEarning: "2200", title: "Total Earning" },
  { id: "2", totalRides: "12", title: "Complete Ride" },
  { id: "3", pendingRides: "1", title: "Pending Ride" },
  { id: "4", cancelRides: "4", title: "Cancel Ride" },
];

export const rideIcons = [
  <Wallet colors={color.primary} />,
  <SmartCar />,
  <SmallCard color={color.primary} />,
  <Driving color={color.primary} />,
];

export const recentRidesData: recentRidesTypes[] = [
  {
    id: "1",
    user: "Nam",
    rating: "5",
    earning: "22000",
    pickup: "Đường Minh Khai, Phường Vĩnh Tuy, Quận Hai Bà Trưng, Hanoi, Vietnam",
    dropoff: "Phường Lý Thái Tổ, Quận Hoàn Kiếm, Hanoi, Vietnam",
    time: "14 Oct 01:34 pm",
    distance: "8km",
  },
];