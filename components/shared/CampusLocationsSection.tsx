'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { campusLocations, locationImages } from '@/lib/campus-data';

const locations = [
  {
    name: "Main Gate",
    description:
      "The primary entrance to the campus, featuring the college emblem and security checkpoint.",
    coordinates: "12.863788, 77.434897",
    image: "loc_images/class1.jpg",
  },
  {
    name: "Cross Road",
    description: "A central intersection connecting major campus blocks.",
    coordinates: "12.863200, 77.435100",
    image: "loc_images/class2.jpg",
  },
  {
    name: "Block 1",
    description: "Academic block housing classrooms and faculty offices.",
    coordinates: "12.863500, 77.434500",
    image: "loc_images/class3.jpg",
  },
  {
    name: "Students Square",
    description: "Open area for student gatherings and events.",
    coordinates: "12.863900, 77.434700",
    image: "loc_images/class4.jpg",
  },
  {
    name: "Open Auditorium",
    description: "Outdoor venue for performances and ceremonies.",
    coordinates: "12.862510, 77.438496",
    image: "loc_images/class5.jpg",
  },
  {
    name: "Block 4",
    description: "Academic block with labs and seminar halls.",
    coordinates: "12.864200, 77.434900",
    image: "loc_images/class6.jpg",
  },
  {
    name: "Xpress Cafe",
    description: "Popular campus cafe for snacks and beverages.",
    coordinates: "12.864300, 77.435000",
    image: "loc_images/class7.jpg",
  },
  {
    name: "Block 6",
    description: "Academic block for specialized courses.",
    coordinates: "12.864400, 77.435100",
    image: "loc_images/class8.jpg",
  },
  {
    name: "Amphi Theater",
    description: "A semi-circular outdoor theater used for cultural events and ceremonies.",
    coordinates: "12.861424, 77.438057",
    image: "loc_images/class9.jpg",
  },
  {
    name: "PU Block",
    description: "Block for pre-university courses and activities.",
    coordinates: "12.864500, 77.435200",
    image: "loc_images/class10.jpg",
  },
  {
    name: "Architecture Block",
    description: "Block dedicated to architecture studies and studios.",
    coordinates: "12.864600, 77.435300",
    image: "loc_images/class11.jpg",
  },
];

export default function CampusLocationsSection() {
  const [selected, setSelected] = useState(0);
  return (
    <section className="w-full py-10 px-4 bg-white dark:bg-black text-black dark:text-white flex flex-col items-center">
      <h2 className="text-4xl font-bold mb-2 text-center text-black dark:text-white">Campus Locations</h2>
      <p className="mb-8 text-center text-lg max-w-2xl text-black dark:text-white">
        Explore the 11 key locations around campus that our AI model can recognize. These are<br />
        the places you can navigate to and from using our navigation system.
      </p>
      {/* Tabs in two parallel rows, centered and spaced evenly */}
      <div className="flex flex-col gap-4 w-full max-w-4xl mb-8">
        <div className="flex flex-row gap-2 justify-center">
          {locations.slice(0, 6).map((loc, idx) => (
            <button
              key={loc.name}
              className={`px-6 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none text-base ${selected === idx
                ? "bg-gray-100 text-black dark:bg-white dark:text-black shadow"
                : "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                }`}
              onClick={() => setSelected(idx)}
            >
              {loc.name}
            </button>
          ))}
        </div>
        <div className="flex flex-row gap-2 justify-center">
          {locations.slice(6).map((loc, idx) => (
            <button
              key={loc.name}
              className={`px-6 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none text-base ${selected === idx + 6
                ? "bg-gray-100 text-black dark:bg-white dark:text-black shadow"
                : "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                }`}
              onClick={() => setSelected(idx + 6)}
            >
              {loc.name}
            </button>
          ))}
        </div>
      </div>
      {/* Content card: image and description side by side, max width, rounded corners, centered vertically */}
      <div className="flex flex-row items-center bg-gray-100 dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden w-full max-w-4xl gap-x-8">
        {/* Left - Image */}
        <img
          src={locations[selected].image}
          alt={locations[selected].name}
          className="w-1/2 h-80 object-cover rounded-l-lg"
        />
        {/* Right - Centered Text */}
        <div className="p-8 flex flex-col justify-center items-center w-1/3 min-w-[250px] gap-2 text-center">
          <h3 className="text-2xl font-bold mb-2 text-black dark:text-white">
            {locations[selected].name}
          </h3>
          <p className="mb-2 text-lg text-black dark:text-zinc-300">
            {locations[selected].description}
          </p>
          <span className="font-semibold text-base text-black dark:text-white">
            Coordinates:{" "}
            <span className="text-black dark:text-zinc-300">
              {locations[selected].coordinates}
            </span>
          </span>
        </div>
      </div>

    </section>
  );
  // ...existing code...
  const [selectedLocation, setSelectedLocation] = useState(campusLocations[0].name);

  return (
    <section id="locations" className="py-16 container">
      <h2 className="text-3xl font-extrabold tracking-tight text-center mb-6 text-gray-900">
        Campus Locations
      </h2>

      {/* Tabs Navigation */}
      <Tabs defaultValue={campusLocations[0].name} className="w-full max-w-4xl mx-auto">
        {/* First row of tabs */}
        <TabsList className="flex flex-wrap justify-center gap-2 mb-4 bg-muted rounded-lg p-2">
          {campusLocations.slice(0, 6).map((location) => (
            <TabsTrigger
              key={location.name}
              value={location.name}
              onClick={() => setSelectedLocation(location.name)}
              className="py-2 px-4 text-sm font-medium rounded-md 
                 data-[state=active]:bg-white 
                 data-[state=active]:shadow-sm 
                 data-[state=active]:font-semibold"
            >
              {location.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Second row of tabs */}
        <TabsList className="flex flex-wrap justify-center gap-2 mb-8 bg-muted rounded-lg p-2">
          {campusLocations.slice(6).map((location) => (
            <TabsTrigger
              key={location.name}
              value={location.name}
              onClick={() => setSelectedLocation(location.name)}
              className="py-2 px-4 text-sm font-medium rounded-md 
                 data-[state=active]:bg-white 
                 data-[state=active]:shadow-sm 
                 data-[state=active]:font-semibold"
            >
              {location.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Location Cards */}
        {campusLocations.map((location) => (
          <TabsContent key={location.name} value={location.name}>
            <Card className="shadow-md border border-gray-200 max-w-3xl mx-auto">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-start">
                  {/* Smaller Image on the left */}
                  <div className="w-full md:w-1/4 flex-shrink-0">
                    <img
                      src={locationImages[location.name as keyof typeof locationImages]}
                      alt={location.name}
                      className="w-full h-auto object-cover rounded-t-md md:rounded-l-md md:rounded-t-none"
                      style={{ aspectRatio: "4/3", maxHeight: "200px" }}
                    />
                  </div>

                  {/* Text on the right */}
                  <div className="md:w-3/4 w-full p-4 md:p-6 flex flex-col justify-center">
                    <h3 className="text-lg md:text-xl font-bold mb-2 text-gray-900">
                      {location.name}
                    </h3>
                    <p className="text-gray-700 mb-3 text-sm leading-relaxed">
                      {getLocationDescription(location.name)}
                    </p>
                    <p className="text-xs font-semibold text-gray-900">
                      Coordinates:{" "}
                      <span className="font-normal text-gray-800">
                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        ))}


      </Tabs>
    </section>
  );
}

// Helper function to get location descriptions
function getLocationDescription(locationName: string): string {
  const descriptions: Record<string, string> = {
    "Main Gate": "The primary entrance to the campus, featuring the college emblem and security checkpoint.",
    "Cross Road": "A central intersection connecting multiple pathways to different blocks and facilities.",
    "Block 1": "Houses administrative offices and several departments with modern classrooms.",
    "Students Square": "A popular gathering spot for students with seating areas and open space.",
    "Open Auditorium": "An outdoor venue for college events, performances and gatherings.",
    "Block 4": "Contains specialized labs and research facilities for engineering students.",
    "Xpress Cafe": "A favorite spot for students to grab coffee and snacks between classes.",
    "Block 6": "The newest academic building with state-of-the-art lecture halls.",
    "Amphi Theater": "A semi-circular outdoor theater used for cultural events and ceremonies.",
    "PU Block": "Houses the post-graduate departments and advanced research facilities.",
    "Architecture Block": "Dedicated to architecture students with design studios and model-making workshops."
  };

  return descriptions[locationName] || "A key location on campus with modern facilities.";
}
