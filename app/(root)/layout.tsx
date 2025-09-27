import Footer from "@/components/shared/Footer";
import Header from "@/components/shared/Header";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Eventtts - College Event Manager",
	description: "Eventtts is a platform for event management.",
	icons: {
		icon: "/images/favicon.ico",
	},
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex flex-col min-h-screen">
			<Header />
			<main className="flex-1 pt-16">{children}</main>
			<Footer />
		</div>
	);
}
