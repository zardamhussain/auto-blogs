import { useAuth } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';

const LoginOverlay = () => {
    const { signInWithGoogle } = useAuth();

    return (
        <div className="login-overlay">
            <div className="login-box">
                <h1 className="logo-text">bgex</h1>
                <p>Automated Content Generation Platform</p>
                <button onClick={signInWithGoogle} className="google-signin-btn">
                    <FcGoogle size="1.5em" />
                    <span>Sign in with Google</span>
                </button>
            </div>
        </div>
    );
};

export default LoginOverlay; 