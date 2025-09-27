import { MdEventNote } from "react-icons/md";
import { MdSportsGymnastics } from "react-icons/md";
import { FaMasksTheater } from "react-icons/fa6";
import { GrWorkshop } from "react-icons/gr";
import { RiCodeSSlashFill } from "react-icons/ri";
import { FaChalkboard } from "react-icons/fa";
import { MdAttachMoney } from "react-icons/md";
import { GiMedicalPackAlt } from "react-icons/gi";
import { CgToolbox } from "react-icons/cg";
import { FaRegQuestionCircle } from "react-icons/fa";
import { FaChalkboardTeacher } from "react-icons/fa";

interface Category {
	icon: JSX.Element;
	title: string;
	path: string;
}

export const categories: Category[] = [
	{
		icon: <FaChalkboardTeacher />,
		title: "Seminars",
		path: "?category=seminars",
	},
	{
		icon: <GrWorkshop />,
		title: "Workshops",
		path: "?category=workshops",
	},
	{
		icon: <RiCodeSSlashFill />,
		title: "Hackathons",
		path: "?category=hackathons",
	},
	{
		icon: <FaRegQuestionCircle />,
		title: "Quizzes",
		path: "?category=quizzes",
	},
	{
		icon: <FaChalkboard />,
		title: "Exhibitions",
		path: "?category=exhibitions",
	},
	{
		icon: <FaMasksTheater />,
		title: "Theatre",
		path: "?category=theatre",
	},
	{
		icon: <MdSportsGymnastics />,
		title: "Sports",
		path: "?category=sports",
	},
	{
		icon: <MdAttachMoney />,
		title: "Marketing ",
		path: "?category=marketing",
	},
	{
		icon: <GiMedicalPackAlt />,
		title: "Social",
		path: "?category=social",
	},
	{
		icon: <CgToolbox />,
		title: "Training ",
		path: "?category=training",
	},
	{
		icon: <MdEventNote />,
		title: "Others",
		path: "?category=others",
	},
];
