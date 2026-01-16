/**
 * HomeScreen - Welcome screen with action cards
 */

interface HomeScreenProps {
  onStartFlow: (flowType: 'order' | 'shipping' | 'subscription') => void;
}

export function HomeScreen({ onStartFlow }: HomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-navy/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-coral/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-lg w-full text-center">
          {/* Logo */}
          <div className="mb-8">
            <img
              src="https://cdn.shopify.com/s/files/1/0433/0510/7612/files/navyblue-logo.svg?v=1754231041"
              alt="PuppyPad"
              className="h-12 mx-auto"
            />
          </div>

          {/* Welcome Text */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-display mb-4">
            Welcome to Resolution Center
          </h1>
          <p className="text-gray-600 text-lg mb-8">
            Get instant help with your order, subscription, or tracking.
            Our team is here to make things right.
          </p>

          {/* Team Avatars */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <div className="flex -space-x-3">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
                alt="Amy"
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
              />
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face"
                alt="Claudia"
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
              />
              <img
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
                alt="Sarah"
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
              />
            </div>
            <span className="text-sm text-gray-500">Our support team is ready to help</span>
          </div>
        </div>

        {/* Action Cards */}
        <div className="relative z-10 w-full max-w-lg px-4">
          <h2 className="text-center text-gray-700 font-medium mb-6">
            How can we help you today?
          </h2>

          <div className="space-y-4">
            <ActionCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              }
              title="I have an issue with my order"
              description="Refunds, returns, wrong items, or product questions"
              onClick={() => onStartFlow('order')}
            />

            <ActionCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              }
              title="Where is my package?"
              description="Track your shipment or report delivery issues"
              onClick={() => onStartFlow('shipping')}
            />

            <ActionCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
              title="Manage my subscription"
              description="Pause, modify, or cancel your subscription"
              onClick={() => onStartFlow('subscription')}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-sm text-gray-400">
          Powered by PuppyPad Resolution Center
        </p>
      </footer>
    </div>
  );
}

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

function ActionCard({ icon, title, description, onClick }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full glass rounded-xl p-5 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-navy/5 text-brand-navy flex items-center justify-center group-hover:bg-brand-navy group-hover:text-white transition-colors">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-brand-navy transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
        <svg
          className="w-5 h-5 text-gray-400 group-hover:text-brand-navy group-hover:translate-x-1 transition-all"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
