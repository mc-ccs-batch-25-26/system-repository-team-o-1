import React, { useEffect, useState } from 'react';
import { supabase } from './supabase/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';

export interface IAuthRouteProps {
    children: React.ReactNode;
}

const AuthRoute: React.FunctionComponent<IAuthRouteProps> = (props) => {
    const { children } = props;
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);

    // Pages only for regular users (admins should NOT access)
    const userOnlyPages = ['/', '/quizzes', '/lessons', '/progress', '/leaderboard', '/pretest'];
    
    // Pages anyone can access
    const publicPages = ['/login', '/signup', '/admin'];

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    // Check user role
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('pretest_done, role')
                        .eq('id', session.user.id)
                        .single();

                    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
                    const hasCompletedPretest = profile?.pretest_done === true;

                    if (isAdmin) {
                        // Admins can ONLY access /admin routes and /settings
                        if (!location.pathname.startsWith('/admin') && location.pathname !== '/settings') {
                            navigate('/admin', { replace: true });
                            return;
                        }
                    } else {
                        // Regular user logic
                        if (location.pathname === '/admin') {
                            navigate('/', { replace: true });
                            return;
                        }

                        // Redirect to pretest if not done
                        if (!hasCompletedPretest && location.pathname !== '/pretest') {
                            navigate('/pretest', { replace: true });
                            return;
                        }
                    }
                } else {
                    // Not logged in
                    if (!publicPages.includes(location.pathname)) {
                        navigate('/login');
                    }
                }
            } catch (err) {
                console.error('Auth check error:', err);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                if (!publicPages.includes(location.pathname)) {
                    navigate('/login');
                }
            }
            setLoading(false);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [navigate, location.pathname]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-zinc-900">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
            </div>
        );
    }

    return <>{children}</>;
};

export default AuthRoute;