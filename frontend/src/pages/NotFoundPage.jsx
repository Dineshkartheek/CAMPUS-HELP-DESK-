import { Link } from 'react-router-dom';
import { Icon } from '../components/Icons.jsx';

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <div className="not-found-icon">
        <Icon name="search" size={34} />
      </div>
      <span className="eyebrow">Error 404</span>
      <h1>Page not found</h1>
      <p>The page you requested does not exist or has been moved.</p>
      <Link to="/" className="btn btn-primary">
        <Icon name="home" size={17} /> Return to home
      </Link>
    </div>
  );
}
