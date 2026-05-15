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

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    // Check if pre-test is done
                    const { data: userData } = await supabase
                        .from('profiles')
                        .select('pretest_done')
                        .eq('id', session.user.id)
                        .single();

                    const hasCompletedPretest = userData?.pretest_done === true;

                    // Redirect to pretest if not done and not already there
                    if (!hasCompletedPretest && location.pathname !== '/pretest') {
                        navigate('/pretest', { replace: true });
                        return;
                    }
                } else {
                    if (location.pathname !== '/login' && location.pathname !== '/signup') {
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
                if (location.pathname !== '/login' && location.pathname !== '/signup') {
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