'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Spinner } from '@/components/ui';
import { 
  UserGroupIcon, 
  CheckCircleIcon,
  BellAlertIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-amber-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-amber-50">
      {/* Header */}
      <header className="px-4 py-5 sticky top-0 backdrop-blur-md bg-white/70 z-50 border-b border-gray-100">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <UserGroupIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Minyan</span>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button variant="ghost" className="font-medium">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button className="shadow-lg shadow-primary-500/25">Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 pt-20 pb-32">
        <div className="text-center relative">
          {/* Decorative elements */}
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full text-primary-700 text-sm font-medium mb-8">
              <SparklesIcon className="h-4 w-4" />
              <span>Organize Prayer Groups Effortlessly</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-tight">
              Never Miss a{' '}
              <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">Minyan</span>
              <br />Again
            </h1>
            <p className="mt-8 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              The modern way to organize Jewish prayer groups in your office building. 
              Track attendance in real-time and always know when you have 10 people.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto px-8 py-4 text-lg shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 transition-all duration-300">
                  Start Organizing
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8 py-4 text-lg">
                  Join Your Building
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-24 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">10</div>
            <div className="text-gray-500 mt-1">People for Minyan</div>
          </div>
          <div className="text-center border-x border-gray-200">
            <div className="text-4xl font-bold text-gray-900">3</div>
            <div className="text-gray-500 mt-1">Daily Prayers</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">∞</div>
            <div className="text-gray-500 mt-1">Mitzvot</div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Everything You Need</h2>
            <p className="mt-4 text-gray-600 text-lg">Powerful features to organize minyanim with ease</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                <CheckCircleIcon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Real-Time Tracking
              </h3>
              <p className="mt-3 text-gray-600 leading-relaxed">
                See exactly how many people are confirmed. Get notified when you reach 10.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                <BellAlertIcon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Smart Notifications
              </h3>
              <p className="mt-3 text-gray-600 leading-relaxed">
                WhatsApp and push alerts for reminders and when minyan status changes.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30">
                <CalendarDaysIcon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Bulk Scheduling
              </h3>
              <p className="mt-3 text-gray-600 leading-relaxed">
                Set up recurring minyanim for weekdays. Create a month of events in one click.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                <BuildingOffice2Icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Multi-Building
              </h3>
              <p className="mt-3 text-gray-600 leading-relaxed">
                Join multiple buildings and switch between them seamlessly.
              </p>
            </div>
          </div>
        </div>

        {/* Prayer Times Preview */}
        <div className="mt-32 bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50">
              <span className="text-4xl mb-4 block">🌅</span>
              <h3 className="text-xl font-bold text-gray-900">Shacharis</h3>
              <p className="text-amber-700 font-medium mt-2">Morning Prayer</p>
              <p className="text-gray-500 text-sm mt-1">Start your day with intention</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50">
              <span className="text-4xl mb-4 block">☀️</span>
              <h3 className="text-xl font-bold text-gray-900">Mincha</h3>
              <p className="text-blue-700 font-medium mt-2">Afternoon Prayer</p>
              <p className="text-gray-500 text-sm mt-1">A midday spiritual break</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50">
              <span className="text-4xl mb-4 block">🌙</span>
              <h3 className="text-xl font-bold text-gray-900">Maariv</h3>
              <p className="text-indigo-700 font-medium mt-2">Evening Prayer</p>
              <p className="text-gray-500 text-sm mt-1">Close the day in peace</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <UserGroupIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Minyan</span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Minyan Manager. Made with ❤️ to help Jewish
            communities organize prayer.
          </p>
        </div>
      </footer>
    </div>
  );
}
