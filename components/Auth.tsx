import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogoIcon } from './Icons';

const Auth: React.FC = () => {
  const { supabase } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        // Sign Up
        if (!name || !age) {
            setError("Name and age are required to sign up.");
            setLoading(false);
            return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        
        // Check if there is a user returned
        const user = data.user;
        if (!user) {
            throw new Error("Sign up successful, but no user data returned. Please check your email to verify your account.");
        }

        // Insert into profiles table
        const { error: profileError } = await supabase.from('profiles').insert({
          id: user.id,
          name: name,
          age: parseInt(age),
          // Check if this is the first user to determine role
          role: await isFirstUser() ? 'leader' : 'member',
        });
        if (profileError) throw profileError;

        setMessage("Sign up successful! Please check your email for a verification link.");

      } else {
        // Sign In
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        // The onAuthStateChange listener in AuthContext will handle the redirect.
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const isFirstUser = async (): Promise<boolean> => {
      const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      if(error) {
          console.error("Could not count profiles:", error);
          return false;
      }
      return count === 0;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <LogoIcon className="w-32 h-32 mx-auto mb-4 text-yellow-500 dark:text-yellow-400" />
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Nomads <span className="text-yellow-500 dark:text-yellow-400">Bikers</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Your companion for the open road.</p>
        
        <form onSubmit={handleAuth} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl">
          <h2 className="text-2xl font-bold mb-6">{isSignUp ? 'Join the Crew' : 'Welcome Back'}</h2>
          
          {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
          {message && <p className="bg-green-100 text-green-700 p-3 rounded-md mb-4">{message}</p>}

          {isSignUp && (
            <>
              <div className="mb-4">
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your Name" required className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
              <div className="mb-4">
                <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Your Age" required min="1" className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
            </>
          )}

          <div className="mb-4">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          </div>
          <div className="mb-6">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white dark:text-gray-900 font-bold py-3 px-4 rounded-lg focus:outline-none transition-transform transform hover:scale-105 disabled:bg-gray-400">
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-6">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="font-bold text-yellow-500 dark:text-yellow-400 hover:underline ml-2">
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Auth;
