/**
 * HomeScreen - Welcome screen with action cards (using original CSS)
 */

interface HomeScreenProps {
  onStartFlow: (flowType: 'order' | 'shipping' | 'subscription') => void;
}

export function HomeScreen({ onStartFlow }: HomeScreenProps) {
  return (
    <div className="home-screen active">
      {/* Hero Section */}
      <div className="home-hero">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
        </div>
        <div className="hero-content">
          {/* Brand Logo */}
          <div className="brand-container">
            <img
              src="https://cdn.shopify.com/s/files/1/0433/0510/7612/files/navyblue-logo.svg?v=1754231041"
              alt="PuppyPad"
              className="home-logo"
            />
          </div>

          {/* Welcome Text */}
          <div className="welcome-text">
            <h1 className="welcome-title">Welcome to Resolution Center</h1>
            <p className="welcome-subtitle">
              Get instant help with your order, subscription, or tracking.
              Our team is here to make things right.
            </p>
          </div>

          {/* Team Avatars */}
          <div className="team-preview">
            <div className="team-avatars">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
                alt="Amy"
                className="team-avatar"
              />
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face"
                alt="Claudia"
                className="team-avatar"
              />
              <img
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
                alt="Sarah"
                className="team-avatar"
              />
            </div>
            <span className="team-text">Our support team is ready to help</span>
          </div>
        </div>
      </div>

      {/* Action Cards Section */}
      <div className="home-actions">
        <h2 className="actions-title">How can we help you today?</h2>

        <div className="action-cards">
          <button className="action-card" onClick={() => onStartFlow('order')}>
            <div className="action-icon-wrapper">
              <div className="action-icon">🛍️</div>
            </div>
            <div className="action-content">
              <h3 className="action-title">I have an issue with my order</h3>
              <p className="action-description">Refunds, returns, wrong items, or product questions</p>
            </div>
            <div className="action-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <button className="action-card" onClick={() => onStartFlow('shipping')}>
            <div className="action-icon-wrapper">
              <div className="action-icon">📦</div>
            </div>
            <div className="action-content">
              <h3 className="action-title">Where is my package?</h3>
              <p className="action-description">Track your shipment or report delivery issues</p>
            </div>
            <div className="action-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <button className="action-card" onClick={() => onStartFlow('subscription')}>
            <div className="action-icon-wrapper">
              <div className="action-icon">🔄</div>
            </div>
            <div className="action-content">
              <h3 className="action-title">Manage my subscription</h3>
              <p className="action-description">Pause, modify, or cancel your subscription</p>
            </div>
            <div className="action-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="home-footer">
        <p className="footer-text">Powered by PuppyPad Resolution Center</p>
      </footer>
    </div>
  );
}
