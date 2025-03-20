import React from 'react';
import { useTheme } from '../hooks/useTheme';

export const AboutUs: React.FC = () => {
  const { darkMode } = useTheme();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="px-4 py-8">
        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          About Loyalty Bean
        </h1>
        
        <section className={`mb-8 p-6 rounded-lg ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'} shadow-md border transition-all duration-200`}>
          <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Welcome to Loyalty Bean
          </h2>
          <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Loyalty Bean is a simple yet powerful shop loyalty program management system designed to help 
            shop owners reward their regular customers and build lasting relationships.
          </p>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Our application makes it easy to track customer visits, manage rewards, and analyze your loyalty program's performance.
          </p>
        </section>

        <section className={`mb-8 p-6 rounded-lg ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'} shadow-md border transition-all duration-200`}>
          <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            How to Use Loyalty Bean
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className={`text-xl font-medium mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                1. Customer Management
              </h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Add and manage your customers in the <strong>Customers</strong> section. You can add new customers, 
                view their purchase history, and track their loyalty points.
              </p>
            </div>
            
            <div>
              <h3 className={`text-xl font-medium mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                2. Recording Purchases
              </h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                When a customer makes a purchase, find their profile and click the "Add Unit" button to 
                record their purchase and add points to their loyalty card.
              </p>
            </div>
            
            <div>
              <h3 className={`text-xl font-medium mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                3. Redeeming Rewards
              </h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                When a customer has earned enough points (based on your settings), you can redeem their 
                reward by clicking the "Redeem" button on their profile.
              </p>
            </div>
            
            <div>
              <h3 className={`text-xl font-medium mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                4. Dashboard Analytics
              </h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                View key metrics and insights about your loyalty program in the <strong>Dashboard</strong> section. 
                See total units sold, customers ready for redemption, and recent activity.
              </p>
            </div>
            
            <div>
              <h3 className={`text-xl font-medium mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                5. Program Settings
              </h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Customize your loyalty program in the <strong>Settings</strong> section. Set the number of units 
                required for a reward, update your business information, and manage other preferences.
              </p>
            </div>
          </div>
        </section>

        <section className={`mb-8 p-6 rounded-lg ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'} shadow-md border transition-all duration-200`}>
          <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Important Information
          </h2>
          <div className="space-y-4">
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <strong className={darkMode ? 'text-white' : 'text-gray-900'}>Data Privacy:</strong> Customer data is stored securely and is only accessible to authorized users of your account.
            </p>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <strong className={darkMode ? 'text-white' : 'text-gray-900'}>Support:</strong> If you need assistance, please contact our support team at support@loyaltybean.com.
            </p>
          </div>
        </section>

        <section className={`p-6 rounded-lg ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'} shadow-md border transition-all duration-200`}>
          <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Get Started
          </h2>
          <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            To get started with Loyalty Bean, simply add your first customer and begin tracking their purchases.
            As your customer database grows, you'll gain valuable insights into your most loyal customers and be 
            able to reward them appropriately.
          </p>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Thank you for choosing Loyalty Bean to manage your shop's loyalty program!
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;