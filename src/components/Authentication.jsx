import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Authentication(props) {
  const { handleCloseModal } = props;
  const { signUpNewUser, signInUser } = useAuth();

  const [isRegistration, setIsRegistration] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState("");

  async function handleAuthenticate() {
    console.log("here");
    if (
      !email ||
      !email.includes("@") ||
      !password ||
      password.length < 6 ||
      isAuthenticating
    ) {
      setError("❌ Invalid email or password");
      return;
    }

    try {
      setIsAuthenticating(true);
      setError("");

      let response;
      if (isRegistration) {
        response = await signUpNewUser(email, password);
      } else {
        response = await signInUser(email, password);
      }

      if (!response.success) {
        setError(`❌ ${response.error}`);
        return;
      }

      handleCloseModal();
    } catch (err) {
      setError("An unexpected error occurred.");
      console.error(err);
    } finally {
      setIsAuthenticating(false);
    }
  }
  return (
    <>
      <div className="text-center">
        {/* Back Button (only in registration) */}
        {isRegistration && (
          <div className="flex items-center text-left text-yellow-300 text-sm font-semibold mb-4 cursor-pointer hover:underline">
            <span className="mr-1">←</span> BACK
          </div>
        )}
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            className="h-8 w-8 text-white"
            viewBox="0 0 24 24"
          >
            {/* Add SVG paths */}
          </svg>
        </div>
        {/* Heading */}
        <h2 className="text-xl font-bold text-white mb-2">
          Welcome to Strafe Esports
        </h2>
        <p className="text-sm text-white mb-6">
          Join millions of other esports fans and stay up to date with the
          latest news, results and discussions.
        </p>
        {/* Error Message */}{" "}
        {setError && error && (
          <p className="text-red-500 text-sm mb-2">{error}</p>
        )}
        {/* Divider */}
        <div className="flex items-center gap-4 mb-4">
          <hr className="flex-grow border-gray-600" />
          <span className="text-gray-500 text-sm uppercase">
            {isRegistration ? "Create Account" : "Already Have An Account?"}
          </span>
          <hr className="flex-grow border-gray-600" />
        </div>
        {/* Email Input */}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          className="w-full bg-[#1c1c1c] border border-gray-600 rounded px-4 py-2 mb-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        {/* Password Input */}
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          type="password"
          className="w-full bg-[#1c1c1c] border border-gray-600 rounded px-4 py-2 mb-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        {/* Confirm Password Field for Registration
        {isRegistration && (
          <input
            placeholder="Confirm password"
            type="password"
            className="w-full bg-[#1c1c1c] border border-gray-600 rounded px-4 py-2 mb-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        )} */}
        {/* Forgot Password */}
        {!isRegistration && (
          <div className="text-right mb-4">
            <a
              href="#"
              className="text-xs text-yellow-300 hover:underline font-semibold"
            >
              Forgot password?
            </a>
          </div>
        )}
        {/* Continue Button */}
        <button
          onClick={handleAuthenticate}
          className={`w-full ${
            isRegistration
              ? "bg-[#1c1c1c] text-gray-500 border border-gray-600"
              : "bg-[#e4ef43] text-black"
          } font-semibold py-2 rounded mb-4`}
        >
          {isRegistration ? "SIGN UP" : "CONTINUE"}
        </button>
        {/* Divider */}
        <div className="flex items-center gap-4 mb-4">
          <hr className="flex-grow border-gray-600" />
          <span className="text-gray-500 text-sm uppercase">OR</span>
          <hr className="flex-grow border-gray-600" />
        </div>
        {/* Social Buttons */}
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center bg-white text-black font-semibold py-2 rounded">
            <img src="/google-icon.svg" className="h-5 w-5 mr-2" />
            Continue with Google
          </button>
          <button className="flex-1 flex items-center justify-center bg-[#1877f2] text-white font-semibold py-2 rounded">
            <img src="/facebook-icon.svg" className="h-5 w-5 mr-2" />
            Continue with Facebook
          </button>
        </div>
        {/* Register Toggle */}
        <div className="mt-6 text-sm text-gray-400">
          <span>
            {isRegistration
              ? "Already have an account? "
              : "Don't have an account? "}
          </span>
          <button
            onClick={() => setIsRegistration(!isRegistration)}
            className="text-white font-semibold hover:underline"
          >
            {isRegistration ? "Sign in" : "Sign up"}
          </button>
        </div>
      </div>
    </>
  );
}
