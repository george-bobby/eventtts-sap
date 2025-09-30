import { HomeIcon, PersonIcon } from "@radix-ui/react-icons";
import { FaRegHeart } from "react-icons/fa";
import { TfiTicket } from "react-icons/tfi";
import { IoLocationOutline } from "react-icons/io5";
import { CiCompass1 } from "react-icons/ci";


interface SidebarLink {
  image: JSX.Element;
  label: string;
  path: string;
}

export const sidebarLinks: SidebarLink[] = [
  {
    image: <HomeIcon />,
    label: "Home",
    path: "/",
  },
  {
    image: <CiCompass1 />,
    label: "Explore Events",
    path: "/explore",
  },
  {
    image: <IoLocationOutline />,
    label: "Track",
    path: "/track",
  },
  {
    image: <TfiTicket />,
    label: "Create Event",
    path: "/create",
  },
  {
    image: <FaRegHeart />,
    label: "Wishlist",
    path: "/wishlist",
  },
  {
    image: <PersonIcon />,
    label: "Dashboard",
    path: "/dashboard",
  },
];
