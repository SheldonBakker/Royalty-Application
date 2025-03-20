import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useEffect, useState } from 'react';

export function Home() {
  const { darkMode } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Premium Hero Section with enhanced design */}
      <section className={`relative pt-28 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden ${darkMode ? 'bg-gradient-to-br from-gray-900 via-indigo-950 to-blue-950' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50'}`}>
        {/* Decorative elements - enhanced */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-24 -right-24 w-96 h-96 rounded-full ${darkMode ? 'bg-blue-800/10' : 'bg-blue-200/40'} blur-3xl animate-pulse-slow`}></div>
          <div className={`absolute top-1/2 -left-24 w-72 h-72 rounded-full ${darkMode ? 'bg-indigo-800/10' : 'bg-indigo-200/40'} blur-3xl animate-pulse-slower`}></div>
          <div className={`absolute -bottom-24 right-1/3 w-80 h-80 rounded-full ${darkMode ? 'bg-purple-800/10' : 'bg-purple-200/40'} blur-3xl animate-pulse-slow`}></div>
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:40px_40px] opacity-20"></div>
          
          {/* Premium floating elements */}
          <div className={`absolute top-20 right-[20%] w-16 h-16 rounded-full ${darkMode ? 'bg-blue-600/30' : 'bg-blue-400/20'} backdrop-blur-sm animate-float-slow hidden lg:block`}></div>
          <div className={`absolute top-40 left-[15%] w-8 h-8 rounded-md ${darkMode ? 'bg-purple-600/30' : 'bg-purple-400/20'} backdrop-blur-sm rotate-45 animate-float-slower hidden lg:block`}></div>
          <div className={`absolute bottom-32 right-[35%] w-12 h-12 rounded-lg ${darkMode ? 'bg-indigo-600/30' : 'bg-indigo-400/20'} backdrop-blur-sm animate-float hidden lg:block`}></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          {/* Premium badge */}
          <div className={`mx-auto w-fit mb-12 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'} transition-all duration-1000 delay-300`}>
            <div className={`px-6 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 ${darkMode ? 'bg-blue-950 text-blue-400 border border-blue-800/60' : 'bg-blue-100 text-blue-800 border border-blue-200/60'}`}>
              <span className={`w-2 h-2 rounded-full ${darkMode ? 'bg-blue-400' : 'bg-blue-600'} animate-pulse`}></span>
              Enterprise-Grade Loyalty Platform
            </div>
          </div>
          
          <div className={`text-center transition-all duration-1000 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <h1 className={`text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'} mb-6 leading-tight`}>
              <span className="inline-block relative">
                Loyalty
                <span className={`absolute -bottom-1 left-0 w-full h-1 ${darkMode ? 'bg-blue-700/50' : 'bg-blue-500/30'} rounded-full transform scale-x-0 ${isLoaded ? 'scale-x-100' : ''} transition-transform duration-1000 delay-700`}></span>
              </span>
              <span className={`inline-block ml-2 bg-clip-text text-transparent bg-gradient-to-r ${darkMode ? 'from-blue-400 via-indigo-400 to-purple-400' : 'from-blue-600 via-indigo-600 to-purple-600'}`}>Bean</span>
            </h1>
            
            <p className={`max-w-2xl mx-auto text-xl sm:text-2xl leading-relaxed ${darkMode ? 'text-blue-100/90' : 'text-indigo-950/90'} mb-12 font-light`}>
              The <span className="italic">sophisticated</span> way to manage your customer loyalty program and reward your most valued customers.
            </p>
            
            <div className={`flex flex-col sm:flex-row justify-center gap-6 mt-16 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-1000 delay-500`}>
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 px-10 rounded-lg font-medium shadow-xl hover:shadow-blue-500/30 dark:hover:shadow-blue-500/20 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 text-lg relative overflow-hidden group"
              >
                <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                Get Started Free
                <span className="ml-2">→</span>
              </Link>
              <Link
                to="/login"
                className={`${darkMode ? 'bg-gray-800/80 text-white border-gray-700/80 hover:bg-gray-700/80 backdrop-blur-sm' : 'bg-white/90 text-gray-900 border-gray-200/90 hover:bg-gray-50/90 backdrop-blur-sm'} py-4 px-10 rounded-lg font-medium shadow-lg border hover:shadow-xl transition-all duration-300 text-lg hover:-translate-y-1`}
              >
                Log In
              </Link>
            </div>
            
            {/* Trust badges */}
            <div className={`mt-20 pt-8 border-t ${darkMode ? 'border-gray-800/50' : 'border-gray-200/50'} ${isLoaded ? 'opacity-80 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-1000 delay-700`}>
              <div className="flex justify-center flex-wrap gap-8 opacity-70">
                <div className={`h-6 w-24 ${darkMode ? 'bg-gray-400' : 'bg-gray-700'} rounded opacity-20`}></div>
                <div className={`h-6 w-24 ${darkMode ? 'bg-gray-400' : 'bg-gray-700'} rounded opacity-20`}></div>
                <div className={`h-6 w-24 ${darkMode ? 'bg-gray-400' : 'bg-gray-700'} rounded opacity-20`}></div>
                <div className={`h-6 w-24 ${darkMode ? 'bg-gray-400' : 'bg-gray-700'} rounded opacity-20`}></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced bottom wave pattern with refined styling */}
        <div className={`absolute bottom-0 left-0 right-0 ${scrolled ? 'translate-y-2 opacity-80' : 'translate-y-0 opacity-100'} transition-all duration-700 ease-in-out`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 200" className={`w-full h-auto ${darkMode ? 'text-gray-900' : 'text-white'}`}>
            <path fill="currentColor" fillOpacity="1" d="M0,64L48,80C96,96,192,128,288,144C384,160,480,160,576,138.7C672,117,768,75,864,64C960,53,1056,75,1152,96C1248,117,1344,139,1392,149.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
        
        {/* Premium mockup */}
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 max-w-5xl w-full h-64 translate-y-1/2 ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-all duration-1000 delay-1000 hidden lg:block pointer-events-none`}>
          <div className={`mx-auto w-full h-full ${darkMode ? 'bg-gray-800/80' : 'bg-white/90'} rounded-xl shadow-2xl backdrop-blur-md border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'} p-4 overflow-hidden`}>
            <div className="flex gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
            </div>
            <div className="flex h-full">
              <div className={`w-1/4 h-full ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'} rounded-md mr-3`}></div>
              <div className="flex-1 flex flex-col gap-3">
                <div className={`h-8 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'} rounded-md w-1/2`}></div>
                <div className="flex gap-3 flex-1">
                  <div className={`flex-1 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'} rounded-md`}></div>
                  <div className={`flex-1 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'} rounded-md`}></div>
                  <div className={`flex-1 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'} rounded-md`}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-24 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-900' : 'bg-white'} relative z-10 lg:pt-48`}>
        <div className="max-w-7xl mx-auto">
          <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '200ms' }}>
            <h2 className={`text-3xl sm:text-4xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Premium Features
            </h2>
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Everything you need to create and manage a world-class loyalty program for your business.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className={`rounded-2xl p-8 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} border shadow-xl transition-all duration-700 transform hover:-translate-y-2 hover:shadow-2xl ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '300ms' }}>
              <div className={`w-16 h-16 flex items-center justify-center rounded-xl mb-6 ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Effortless Customer Management</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                Elegantly add and manage your customers. Keep track of their information and purchase history in one beautifully designed interface.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={`rounded-2xl p-8 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} border shadow-xl transition-all duration-700 transform hover:-translate-y-2 hover:shadow-2xl ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '400ms' }}>
              <div className={`w-16 h-16 flex items-center justify-center rounded-xl mb-6 ${darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
              </div>
              <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Customizable Loyalty Programs</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                Design sophisticated loyalty experiences with custom thresholds, personalized rewards, and tailored programs that reflect your unique brand.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={`rounded-2xl p-8 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} border shadow-xl transition-all duration-700 transform hover:-translate-y-2 hover:shadow-2xl ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '500ms' }}>
              <div className={`w-16 h-16 flex items-center justify-center rounded-xl mb-6 ${darkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Insightful Analytics</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                Access sophisticated analytics to understand customer behavior, optimize your loyalty strategy, and make data-driven decisions with elegant visualizations.
              </p>
            </div>
          </div>
          
          {/* WhatsApp Integration Coming Soon */}
          <div className={`mt-16 py-6 px-8 rounded-2xl ${darkMode ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-800/30' : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100'} transition-all duration-700 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '600ms' }}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center">
                <div className={`w-14 h-14 flex items-center justify-center rounded-xl ${darkMode ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-600'} mr-5`}>
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                    WhatsApp Integration
                    <span className={`ml-3 text-xs font-semibold uppercase py-1 px-2 rounded-full ${darkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'}`}>Coming Soon</span>
                  </h3>
                  <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    We're adding WhatsApp integration to simplify communication with your customers. Send loyalty updates, redemption notifications, and special offers directly through WhatsApp.
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className={`animate-pulse px-4 py-2 rounded-lg ${darkMode ? 'bg-green-800/30 text-green-400 border border-green-700/30' : 'bg-green-100 text-green-700 border border-green-200'} text-sm font-medium`}>
                  Stay Tuned
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Compact Design */}
      <section className={`py-16 px-4 sm:px-6 lg:px-8 relative ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-16 right-1/4 w-64 h-64 rounded-full ${darkMode ? 'bg-blue-600/5' : 'bg-blue-200/20'} blur-3xl`}></div>
          <div className={`absolute -bottom-8 left-1/3 w-48 h-48 rounded-full ${darkMode ? 'bg-indigo-600/5' : 'bg-indigo-200/20'} blur-3xl`}></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative">
          <div className={`flex items-center justify-between flex-col md:flex-row gap-8 ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-all duration-700`} style={{ transitionDelay: '600ms' }}>
            <div className="md:w-1/2 text-center md:text-left">
              <h2 className={`text-2xl md:text-3xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Simple, Transparent Pricing
              </h2>
              <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Fixed rate per transaction. No hidden fees.
              </p>
              
              <div className="flex items-end mb-4">
                <span className={`text-5xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>R2.7</span>
                <span className={`ml-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>per transaction</span>
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-6">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>No monthly fees</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>Unlimited customers</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>Premium support</span>
              </div>

              <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-100'}`}>
                <div className="flex">
                  <div className={`flex-shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    <svg className="h-5 w-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>Flexible Credit System</h3>
                    <div className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <p>Load credits as needed and only spend what you want. Secure payments processed via Paystack.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`md:w-1/2 ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className={`text-sm font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>PREMIUM PLAN</div>
                  <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Everything you need</div>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${darkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                </div>
              </div>
              
              <div className="space-y-2 mb-5">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Advanced analytics dashboard</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Multiple loyalty program types</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Dedicated account manager</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Load credits as needed via Paystack</span>
                </div>
              </div>
              
              <Link
                to="/register"
                className="block w-full py-2.5 px-4 text-center rounded-lg font-medium bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-sm transform hover:-translate-y-0.5 text-sm"
              >
                Start Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-16 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-900 text-gray-400 border-t border-gray-800' : 'bg-white text-gray-600 border-t border-gray-100'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-8 md:mb-0">
            <div className={`flex items-center text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <img src="/favicon.svg" className="h-8 w-8 mr-3" alt="Loyalty Bean logo" />
              <span className={`bg-clip-text text-transparent bg-gradient-to-r ${darkMode ? 'from-blue-400 to-purple-400' : 'from-blue-600 to-indigo-600'}`}>Loyalty Bean</span>
            </div>
            <p className="text-sm">© {new Date().getFullYear()} Loyalty Bean. All rights reserved.</p>
          </div>
          <div className="flex space-x-10">
            <Link to="/about" className="text-lg hover:underline transition-colors duration-200">About</Link>
            <Link to="/register" className="text-lg hover:underline transition-colors duration-200">Sign Up</Link>
            <Link to="/login" className="text-lg hover:underline transition-colors duration-200">Login</Link>
            <a href="mailto:support@remlic.co.za" className="text-lg hover:underline transition-colors duration-200">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home; 