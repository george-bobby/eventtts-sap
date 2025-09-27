'use client';

import { Play, Users, Calendar, Trophy } from 'lucide-react';
import { useState } from 'react';

export default function VideoSection() {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayVideo = () => {
    setIsPlaying(true);
  };

  return (
    <section className="py-24 bg-gradient-to-br from-gray-900 via-red-900 to-indigo-900">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            See Our Platform in Action
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Watch how students are transforming their campus experience and creating unforgettable memories through our events platform.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Video Container */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-16">
            {!isPlaying ? (
              // Video Thumbnail/Placeholder
              <div className="relative bg-gradient-to-br from-red-600 to-indigo-700 aspect-video flex items-center justify-center cursor-pointer group" onClick={handlePlayVideo}>
                <div className="absolute inset-0 bg-black/20"></div>

                {/* Play Button */}
                <div className="relative z-10 flex items-center justify-center">
                  <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300 border border-white/30">
                    <Play className="w-10 h-10 text-white ml-1" fill="currentColor" />
                  </div>
                </div>

                {/* Overlay Content */}
                <div className="absolute inset-0 flex items-end p-8">
                  <div className="text-white">
                    <h3 className="text-2xl md:text-3xl font-bold mb-2">Platform Demo & Success Stories</h3>
                    <p className="text-white/90 text-lg">Discover how students are using our platform to create amazing campus experiences</p>
                  </div>
                </div>

                {/* Simple Background */}
                <div className="absolute inset-0 bg-black/20"></div>
              </div>
            ) : (
              // YouTube Embed
              <div className="aspect-video">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/Z45KtMrT9Xc?autoplay=1&si=EFem_WvrbmmigtrR"
                  title="Events Platform Demo"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="rounded-3xl"
                ></iframe>
              </div>
            )}
          </div>

          {/* Video Stats/Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
              <Users className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">Community Building</h3>
              <p className="text-white/80">Connect with thousands of students and build lasting relationships through shared interests and events.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
              <Calendar className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">Event Discovery</h3>
              <p className="text-white/80">Find and attend events that match your passions, from academic workshops to social gatherings.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
              <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">Achievement System</h3>
              <p className="text-white/80">Earn badges and recognition for your campus involvement and help others discover great events.</p>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/20 max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-indigo-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  AS
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white text-lg md:text-xl leading-relaxed italic mb-4">
                    "This platform completely transformed how I experienced campus life. I went from knowing just a few people to being part of multiple communities, all through the events I discovered here."
                  </p>
                  <div className="text-white/80">
                    <div className="font-semibold">Alex Smith</div>
                    <div className="text-sm">Computer Science Student, University of Technology</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}