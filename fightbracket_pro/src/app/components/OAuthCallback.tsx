import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Store the token in localStorage
      localStorage.setItem('startgg_access_token', token);
      
      // Redirect to the home dashboard (or a previous route)
      navigate('/');
    } else {
      console.error('No token found in OAuth callback URL.');
      // Still redirect to home if no token was found
      navigate('/');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xl font-semibold tracking-tight text-zinc-300">
          Authenticating with Start.gg...
        </p>
      </div>
    </div>
  );
}
