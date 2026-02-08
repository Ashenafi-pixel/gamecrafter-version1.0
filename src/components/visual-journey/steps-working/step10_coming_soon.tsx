import React from 'react';
import {Sparkles, Gamepad2 } from 'lucide-react';

const Step10ComingSoon: React.FC = () => {
  return (
    <div className=" h-full bg-gradient-to-br from-gray-700 via-gray-500 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Animated Icon */}
        <div className="mb-8 relative">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse">
            <Gamepad2 className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-bounce" />
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Coming Soon
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
          We're crafting something amazing for you! 🎮
        </p>

        {/* Description */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
          <p className="text-gray-200 text-lg uw:text-2xl mb-4">
            This exciting feature is currently under development and will be available soon.
          </p>
         
        </div>

        {/* Progress Indicator */}
       

        {/* Call to Action */}
       

        {/* Footer */}
        <div className="mt-12 text-gray-400 text-sm uw:text-3xl">
          <p>Thank you for your patience as we build something incredible! ✨</p>
        </div>
      </div>
    </div>
  );
};

export default Step10ComingSoon;