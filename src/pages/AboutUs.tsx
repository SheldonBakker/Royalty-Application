import { useTheme } from '../hooks/useTheme';
import { useState, useEffect } from 'react';

export function AboutUs() {
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
      {/* Hero Section with premium design */}
      <section className={`relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden ${darkMode ? 'bg-gradient-to-br from-gray-900 via-indigo-950 to-blue-950' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50'}`}>
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-24 -right-24 w-96 h-96 rounded-full ${darkMode ? 'bg-blue-800/10' : 'bg-blue-200/40'} blur-3xl animate-pulse-slow`}></div>
          <div className={`absolute top-1/2 -left-24 w-72 h-72 rounded-full ${darkMode ? 'bg-indigo-800/10' : 'bg-indigo-200/40'} blur-3xl animate-pulse-slower`}></div>
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:40px_40px] opacity-20"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className={`text-center transition-all duration-1000 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <h1 className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
              About <span className={`bg-clip-text text-transparent bg-gradient-to-r ${darkMode ? 'from-blue-400 via-indigo-400 to-purple-400' : 'from-blue-600 via-indigo-600 to-purple-600'}`}>Loyalty Bean</span>
        </h1>
            
            <p className={`max-w-2xl mx-auto text-lg leading-relaxed ${darkMode ? 'text-blue-100/90' : 'text-indigo-950/90'} mb-8 font-light`}>
              A sophisticated loyalty program platform designed to help businesses build meaningful connections with their customers.
            </p>
          </div>
        </div>
        
        {/* Bottom wave pattern */}
        <div className={`absolute bottom-0 left-0 right-0 ${scrolled ? 'translate-y-2 opacity-80' : 'translate-y-0 opacity-100'} transition-all duration-700 ease-in-out`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className={`w-full h-auto ${darkMode ? 'text-gray-900' : 'text-white'}`}>
            <path fill="currentColor" fillOpacity="1" d="M0,64L48,80C96,96,192,128,288,144C384,160,480,160,576,138.7C672,117,768,75,864,64C960,53,1056,75,1152,96C1248,117,1344,139,1392,149.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* Welcome Section */}
      <section className={`py-20 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-900' : 'bg-white'} relative z-10`}>
        <div className="max-w-7xl mx-auto">
          <div className={`mb-16 transition-all duration-700 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '200ms' }}>
            <div className={`rounded-2xl p-8 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} border shadow-xl`}>
              <div className={`w-16 h-16 flex items-center justify-center rounded-xl mb-6 ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h2 className={`text-2xl sm:text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Welcome to Loyalty Bean
          </h2>
              <p className={`text-lg mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                Loyalty Bean is a sophisticated yet intuitive loyalty program management system designed to help businesses reward their regular customers and build lasting relationships.
          </p>
              <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                Our application makes it effortless to track customer visits, manage rewards, and analyze your loyalty program's performance with elegant visualizations and insightful analytics.
          </p>
            </div>
          </div>
        </div>
        </section>

      {/* How to Use Guide Section */}
      <section className={`py-20 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} relative`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-16 right-1/4 w-64 h-64 rounded-full ${darkMode ? 'bg-blue-600/5' : 'bg-blue-200/20'} blur-3xl`}></div>
          <div className={`absolute -bottom-8 left-1/3 w-48 h-48 rounded-full ${darkMode ? 'bg-indigo-600/5' : 'bg-indigo-200/20'} blur-3xl`}></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className={`text-center mb-16 transition-all duration-700 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '300ms' }}>
            <h2 className={`text-3xl sm:text-4xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            How to Use Loyalty Bean
          </h2>
            <p className={`max-w-3xl mx-auto text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Getting started with Loyalty Bean is simple. Follow these steps to set up and manage your loyalty program effectively.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className={`rounded-2xl p-8 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} border shadow-xl transition-all duration-700 transform hover:-translate-y-2 hover:shadow-2xl ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '400ms' }}>
              <div className="flex items-center mb-6">
                <div className={`w-12 h-12 flex items-center justify-center rounded-full ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'} mr-4`}>
                  <span className="text-lg font-bold">1</span>
                </div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Customer Management</h3>
              </div>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed mb-4`}>
                Add and manage your customers in the <strong>Customers</strong> section. You can:
              </p>
              <ul className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Add new customers with contact information
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  View purchase history and loyalty points
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Search and filter customers for quick access
                </li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className={`rounded-2xl p-8 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} border shadow-xl transition-all duration-700 transform hover:-translate-y-2 hover:shadow-2xl ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '500ms' }}>
              <div className="flex items-center mb-6">
                <div className={`w-12 h-12 flex items-center justify-center rounded-full ${darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'} mr-4`}>
                  <span className="text-lg font-bold">2</span>
                </div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recording Purchases</h3>
              </div>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed mb-4`}>
                Record customer purchases to add points to their loyalty balance:
              </p>
              <ul className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Find customer profile in the database
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Click "Add Unit" to record a purchase
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Review their updated points balance
                </li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className={`rounded-2xl p-8 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} border shadow-xl transition-all duration-700 transform hover:-translate-y-2 hover:shadow-2xl ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '600ms' }}>
              <div className="flex items-center mb-6">
                <div className={`w-12 h-12 flex items-center justify-center rounded-full ${darkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-600'} mr-4`}>
                  <span className="text-lg font-bold">3</span>
                </div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Redeeming Rewards</h3>
              </div>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed mb-4`}>
                When customers earn enough points for a reward:
              </p>
              <ul className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Check if customer has reached reward threshold
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Click "Redeem" button on their profile
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Confirm the redemption transaction
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Points balance will reset according to settings
                </li>
              </ul>
            </div>
            
            {/* Step 4 */}
            <div className={`rounded-2xl p-8 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} border shadow-xl transition-all duration-700 transform hover:-translate-y-2 hover:shadow-2xl ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '700ms' }}>
              <div className="flex items-center mb-6">
                <div className={`w-12 h-12 flex items-center justify-center rounded-full ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'} mr-4`}>
                  <span className="text-lg font-bold">4</span>
                </div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard Analytics</h3>
              </div>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed mb-4`}>
                Monitor your loyalty program performance:
              </p>
              <ul className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  View total units sold and redemptions
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  See customers ready for redemption
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Track recent activity and trends
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Analyze customer engagement metrics
                </li>
              </ul>
            </div>
            
            {/* Step 5 */}
            <div className={`rounded-2xl p-8 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} border shadow-xl transition-all duration-700 transform hover:-translate-y-2 hover:shadow-2xl ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '800ms' }}>
              <div className="flex items-center mb-6">
                <div className={`w-12 h-12 flex items-center justify-center rounded-full ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600'} mr-4`}>
                  <span className="text-lg font-bold">5</span>
                </div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Program Settings</h3>
              </div>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed mb-4`}>
                Customize your loyalty program settings:
              </p>
              <ul className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Set units required for rewards
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Customize reward descriptions
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Configure notification preferences
                </li>
              </ul>
            </div>
            
            {/* Premium Support - Step 6 */}
            <div className={`rounded-2xl p-8 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} border shadow-xl transition-all duration-700 transform hover:-translate-y-2 hover:shadow-2xl ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '900ms' }}>
              <div className="flex items-center mb-6">
                <div className={`w-12 h-12 flex items-center justify-center rounded-full ${darkMode ? 'bg-pink-900/30 text-pink-400' : 'bg-pink-100 text-pink-600'} mr-4`}>
                  <span className="text-lg font-bold">6</span>
                </div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Premium Support</h3>
              </div>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed mb-4`}>
                Get help when you need it:
              </p>
              <ul className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-pink-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Contact support at support@remlic.co.za
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-pink-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Access detailed documentation
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-pink-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Request feature enhancements
                </li>
                <li className="flex items-start mt-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-green-900/30 text-green-400 border border-green-800/30' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Coming Soon
                  </div>
                  <span className="ml-2 font-medium">WhatsApp Integration</span>
                </li>
              </ul>
            </div>
            
            {/* Credit System - Step 7 */}
            <div className={`rounded-2xl p-8 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} border shadow-xl transition-all duration-700 transform hover:-translate-y-2 hover:shadow-2xl ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '1000ms' }}>
              <div className="flex items-center mb-6">
                <div className={`w-12 h-12 flex items-center justify-center rounded-full ${darkMode ? 'bg-cyan-900/30 text-cyan-400' : 'bg-cyan-100 text-cyan-600'} mr-4`}>
                  <span className="text-lg font-bold">7</span>
                </div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Credit System</h3>
              </div>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed mb-4`}>
                Our flexible credit system gives you control:
              </p>
              <ul className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-cyan-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Load credits as needed - pay only for what you use
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-cyan-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Fixed rate of R2.7 per transaction
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-cyan-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Track credit usage in your dashboard
                </li>
              </ul>
            </div>
            </div>
          </div>
        </section>

      {/* Get Started Section */}
      <section className={`py-20 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-900' : 'bg-white'} relative`}>
        <div className="max-w-4xl mx-auto text-center">
          <div className={`mb-10 transition-all duration-700 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '1000ms' }}>
            <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Ready to Get Started?
          </h2>
            <p className={`text-lg mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Begin your journey with Loyalty Bean today. Add your first customer and start tracking purchases to build a loyal customer base that keeps coming back.
            </p>
            <div className="flex justify-center gap-6 flex-col sm:flex-row">
              <a 
                href="/register" 
                className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-8 rounded-lg font-medium shadow-xl hover:shadow-blue-500/30 dark:hover:shadow-blue-500/20 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 text-lg relative overflow-hidden group"
              >
                <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                Create an Account
                <span className="ml-2">→</span>
              </a>
              <a 
                href="/login" 
                className={`${darkMode ? 'bg-gray-800/80 text-white border-gray-700/80 hover:bg-gray-700/80' : 'bg-white/90 text-gray-900 border-gray-200/90 hover:bg-gray-50/90'} py-3 px-8 rounded-lg font-medium shadow-lg border hover:shadow-xl transition-all duration-300 text-lg hover:-translate-y-1`}
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-10 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-800 text-gray-400 border-t border-gray-700' : 'bg-gray-50 text-gray-600 border-t border-gray-100'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Have questions? Contact us at <a href="mailto:support@remlic.co.za" className={`font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors duration-200`}>support@remlic.co.za</a>
            </p>
            <p className="mt-4 text-sm">© {new Date().getFullYear()} Loyalty Bean. All rights reserved.</p>
          </div>
      </div>
      </footer>
    </div>
  );
}

export default AboutUs;