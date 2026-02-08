import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { 
  ChevronRight, 
  Play,
  CheckCircle,
  ArrowRight,
  Shield,
  Globe,
  Clock,
  Award,
  Users,
  Zap,
  Building,
  ExternalLink,
  Star
} from 'lucide-react';

const GameCrafterMarketing: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  
  const heroInView = useInView(heroRef, { once: true });
  const featuresInView = useInView(featuresRef, { once: true });

  // Parallax mouse tracking
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Subtle parallax effect
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -50]);

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Convert mouse position to -1 to 1 range
      const x = (clientX / innerWidth) * 2 - 1;
      const y = (clientY / innerHeight) * 2 - 1;
      
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Professional animated counter
  const [stats, setStats] = useState({
    games: 0,
    developers: 0,
    enterprises: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        games: prev.games < 25000 ? prev.games + 500 : 25000,
        developers: prev.developers < 2500 ? prev.developers + 50 : 2500,
        enterprises: prev.enterprises < 150 ? prev.enterprises + 3 : 150
      }));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Clean Navigation */}
      <nav className="relative z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative">
                <img 
                  src="/assets/brand/logo-small.svg" 
                  alt="GameCrafter Logo" 
                  className="w-10 h-10"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg items-center justify-center text-white font-bold text-xl hidden">
                  G
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">GameCrafter</span>
                <div className="text-xs text-red-600 font-semibold tracking-wider uppercase">Enterprise</div>
              </div>
            </motion.div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#platform" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">Platform</a>
              <a href="#solutions" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">Solutions</a>
              <a href="#pricing" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">Pricing</a>
              <a href="#contact" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">Contact</a>
            </div>

            <div className="flex items-center space-x-4">
              <button className="px-6 py-2 text-gray-700 hover:text-gray-900 transition-colors font-medium">
                Sign In
              </button>
              <button className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold shadow-md hover:shadow-lg">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative py-20 px-6 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
        {/* Parallax Background Characters */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Legendary Knight - Left Side (properly positioned, facing right) */}
          <motion.div
            className="absolute left-[-20px] top-1/2 transform -translate-y-1/2 z-0"
            style={{
              x: mousePosition.x * 15,
              y: mousePosition.y * 10,
            }}
            animate={{
              y: mousePosition.y * 10 + [-6, 6, -6],
            }}
            transition={{
              y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <img 
              src="/assets/marketing/characters/legendary-knight.png" 
              alt="Legendary Knight"
              className="w-60 h-auto opacity-85 scale-x-[-1]"
            />
          </motion.div>

          {/* Mystical Wizard - Right Side (properly sized and positioned) */}
          <motion.div
            className="absolute right-[-20px] top-1/2 transform -translate-y-1/2 z-0"
            style={{
              x: mousePosition.x * -15,
              y: mousePosition.y * -10,
            }}
            animate={{
              y: mousePosition.y * -10 + [5, -5, 5],
            }}
            transition={{
              y: { duration: 7, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <img 
              src="/assets/marketing/characters/legendary-wizard.png" 
              alt="Legendary Wizard"
              className="w-56 h-auto opacity-85"
            />
          </motion.div>

          {/* Floating Magical Elements - Non-overlapping positions */}
          <motion.div
            className="absolute left-1/4 top-1/6 z-10"
            style={{
              x: mousePosition.x * 10,
              y: mousePosition.y * 6,
            }}
            animate={{
              rotate: [0, 360],
              y: mousePosition.y * 6 + [-4, 4, -4],
            }}
            transition={{
              rotate: { duration: 30, repeat: Infinity, ease: "linear" },
              y: { duration: 10, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <img 
              src="/assets/marketing/characters/magical-tome.png" 
              alt="Magical Tome"
              className="w-24 h-auto opacity-75"
            />
          </motion.div>

          <motion.div
            className="absolute right-1/4 top-5/6 z-10"
            style={{
              x: mousePosition.x * -12,
              y: mousePosition.y * 8,
            }}
            animate={{
              scale: [1, 1.1, 1],
              y: mousePosition.y * 8 + [3, -3, 3],
            }}
            transition={{
              scale: { duration: 6, repeat: Infinity, ease: "easeInOut" },
              y: { duration: 9, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <img 
              src="/assets/marketing/characters/crystal-orb.png" 
              alt="Crystal Orb"
              className="w-28 h-auto opacity-80"
            />
          </motion.div>

          {/* Flying Creatures - Clear sky positions */}
          <motion.div
            className="absolute left-1/2 top-1/5 z-15"
            style={{
              x: mousePosition.x * 16,
              y: mousePosition.y * -6,
            }}
            animate={{
              x: mousePosition.x * 16 + [0, 12, 0, -12, 0],
              y: mousePosition.y * -6 + [0, -6, 0, 6, 0],
            }}
            transition={{
              x: { duration: 18, repeat: Infinity, ease: "easeInOut" },
              y: { duration: 12, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <img 
              src="/assets/marketing/characters/mystical-dragon.png" 
              alt="Mystical Dragon"
              className="w-36 h-auto opacity-70"
            />
          </motion.div>

          <motion.div
            className="absolute right-1/3 top-4/5 z-15"
            style={{
              x: mousePosition.x * 12,
              y: mousePosition.y * 5,
            }}
            animate={{
              x: mousePosition.x * 12 + [0, -10, 0, 10, 0],
              y: mousePosition.y * 5 + [0, 3, 0, -3, 0],
            }}
            transition={{
              x: { duration: 14, repeat: Infinity, ease: "easeInOut" },
              y: { duration: 9, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <img 
              src="/assets/marketing/characters/phoenix-bird.png" 
              alt="Phoenix Bird"
              className="w-32 h-auto opacity-65"
            />
          </motion.div>
        </div>

        <motion.div 
          className="max-w-6xl mx-auto text-center relative z-20"
          style={{ y: heroY }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center px-6 py-3 bg-red-50 border border-red-200 rounded-full mb-8">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse"></div>
              <span className="text-red-700 font-semibold text-sm tracking-wide">ENTERPRISE PLATFORM</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Build Games at
              <br />
              <span className="text-red-600">Enterprise Scale</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Professional game development platform trusted by the world's leading studios. 
              Accelerate creation with advanced AI and ship extraordinary experiences.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
              <motion.button 
                className="px-12 py-4 bg-red-600 text-white rounded-lg font-semibold text-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Free Trial
              </motion.button>
              
              <button className="px-12 py-4 bg-white text-gray-900 rounded-lg font-semibold text-lg border-2 border-gray-300 hover:border-gray-400 transition-all flex items-center">
                <Play className="w-5 h-5 mr-3" />
                Watch Demo
              </button>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            {[
              { value: stats.games, label: "Games Delivered", icon: "🎮" },
              { value: stats.developers, label: "Developers", icon: "👥" },
              { value: stats.enterprises, label: "Enterprise Clients", icon: "🏢" }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                className="text-center p-6 bg-white rounded-xl shadow-md border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.7 + index * 0.1 }}
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {stat.value.toLocaleString()}+
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} id="platform" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Professional Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Enterprise-grade tools designed for professional game development teams
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8" />,
                title: "AI-Powered Creation",
                description: "Advanced neural networks generate production-quality game assets with enterprise-grade reliability"
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Enterprise Security",
                description: "SOC 2 Type II compliance with military-grade encryption for intellectual property protection"
              },
              {
                icon: <Globe className="w-8 h-8" />,
                title: "Global Deployment",
                description: "Seamless multi-platform distribution with automated regulatory compliance"
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Team Collaboration",
                description: "Advanced workflow management and enterprise-grade project coordination tools"
              },
              {
                icon: <Clock className="w-8 h-8" />,
                title: "Rapid Development",
                description: "Accelerate your development cycle from months to weeks with our platform"
              },
              {
                icon: <Award className="w-8 h-8" />,
                title: "Premium Support",
                description: "24/7 dedicated support with guaranteed response times and expert consultation"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="p-8 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="text-red-600 mb-6 group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-600">
              Gaming studios choose GameCrafter for mission-critical projects
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                quote: "GameCrafter reduced our development cycle from 6 months to 3 weeks. The quality and reliability are exceptional for enterprise deployment.",
                author: "Sarah Chen",
                role: "CTO",
                company: "Stellar Games",
                rating: 5
              },
              {
                quote: "The platform's compliance features and security standards made our global expansion seamless. ROI was achieved within the first quarter.",
                author: "Marcus Rodriguez", 
                role: "Head of Development",
                company: "Global Gaming Corp",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div
                key={index}
                className="p-8 bg-white rounded-xl border border-gray-200 shadow-md"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-red-500 fill-current" />
                  ))}
                </div>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed italic">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-700 font-bold mr-4">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.author}</div>
                    <div className="text-gray-600">{testimonial.role}, {testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Enterprise Pricing
            </h2>
            <p className="text-xl text-gray-600">Scalable solutions for professional development teams</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Professional",
                price: "$15,000",
                period: "/month",
                description: "For ambitious development teams",
                features: ["5 game projects", "Core AI capabilities", "Standard support", "Basic compliance tools"],
                cta: "Start Trial"
              },
              {
                name: "Enterprise",
                price: "$35,000",
                period: "/month",
                description: "For established gaming studios",
                features: ["15 game projects", "Advanced AI features", "Priority support", "Full compliance suite", "Custom integrations"],
                popular: true,
                cta: "Contact Sales"
              },
              {
                name: "Enterprise Plus",
                price: "Custom",
                description: "For large-scale operations",
                features: ["Unlimited projects", "White-label solution", "Dedicated support", "Custom development", "SLA guarantees"],
                cta: "Contact Sales"
              }
            ].map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-xl border-2 transition-all duration-300 ${
                  plan.popular ? 'border-red-500 bg-red-50 scale-105' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-red-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{plan.name}</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {plan.price}
                    {plan.period && <span className="text-lg text-gray-600 font-normal">{plan.period}</span>}
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-700">
                      <CheckCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  plan.popular
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Development?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Join the world's most innovative studios already transforming their development process with GameCrafter
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button className="px-12 py-4 bg-red-600 text-white rounded-lg font-semibold text-lg hover:bg-red-700 transition-all flex items-center">
              Schedule Demo
              <ArrowRight className="w-5 h-5 ml-3" />
            </button>
            <button className="px-12 py-4 bg-white text-gray-900 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">
                  G
                </div>
                <span className="text-xl font-bold text-gray-900">GameCrafter</span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Enterprise game development platform engineered for the world's most ambitious studios.
              </p>
            </div>
            
            <div>
              <h4 className="text-gray-900 font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-gray-900 font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-gray-900 font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-600">
            <p>&copy; 2024 GameCrafter. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GameCrafterMarketing;