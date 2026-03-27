import { useState, ChangeEvent } from "react";
import { useAuth } from "@/context/AuthContext";

interface AuthenticationProps {
  handleCloseModal: () => void;
}

export default function Authentication({
  handleCloseModal,
}: AuthenticationProps) {
  const { signUpNewUser, signInUser } = useAuth();

  const [isRegistration, setIsRegistration] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleAuthenticate = async () => {
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

      const response = isRegistration
        ? await signUpNewUser(email, password)
        : await signInUser(email, password);

      if (!response.success) {
        setError(`❌ ${response.error}`);
        return;
      }

      handleCloseModal();
    } catch (err) {
      setError("❌ An unexpected error occurred.");
      console.error(err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <div className="text-center">
      {isRegistration && (
        <div
          onClick={() => setIsRegistration(false)}
          className="flex items-center text-left text-yellow-300 text-sm font-semibold mb-4 cursor-pointer hover:underline"
        >
          <span className="mr-1">←</span> BACK
        </div>
      )}

      <div className="flex justify-center mb-4">
        <img
          src="/strafeLogo.png"
          alt="Strafe Esports Logo"
          className="h-12 w-auto object-contain"
        />
      </div>

      <h2 className="text-xl font-bold text-white mb-2">
        Welcome to Strafe Esports
      </h2>
      <p className="text-sm text-white mb-6">
        Join millions of esports fans and stay up to date with the latest news,
        results, and discussions.
      </p>

      {/* Sign up button (when not logged in) */}
      {!isRegistration && (
        <button
          onClick={() => setIsRegistration(true)}
          className="w-full bg-[#ffe44f] text-black font-semibold py-3 rounded mb-6 hover:brightness-110 transition"
        >
          SIGN UP
        </button>
      )}

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      <div className="flex items-center gap-4 mb-4">
        <hr className="flex-grow border-gray-600" />
        <span className="text-gray-500 text-sm uppercase">
          {isRegistration ? "Create Account" : "Already Have An Account?"}
        </span>
        <hr className="flex-grow border-gray-600" />
      </div>

      <input
        value={email}
        onChange={handleEmailChange}
        placeholder="Enter email address"
        className="w-full bg-[#1c1c1c] border border-gray-600 rounded px-4 py-2 mb-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
      />

      <input
        value={password}
        onChange={handlePasswordChange}
        placeholder="Enter password"
        type="password"
        className="w-full bg-[#1c1c1c] border border-gray-600 rounded px-4 py-2 mb-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
      />

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

      <button
        onClick={handleAuthenticate}
        disabled={isAuthenticating}
        className={`w-full "bg-[#1c1c1c] text-gray-500 border border-gray-600"
        font-semibold py-2 rounded mb-4`}
      >
        {isRegistration ? "SIGN UP" : "Log in"}
      </button>

      <div className="flex items-center gap-4 mb-4">
        <hr className="flex-grow border-gray-600" />
        <span className="text-gray-500 text-sm uppercase">OR</span>
        <hr className="flex-grow border-gray-600" />
      </div>

      <div className="flex gap-2">
        <button className="flex-1 bg-white text-black font-semibold py-1.5 rounded">
          <span className="mx-auto flex w-fit items-center justify-center gap-2 whitespace-nowrap text-sm leading-none">
            <img src="/google-icon.svg" alt="Google" className="h-5 w-5" />
            <span>Continue with Google</span>
          </span>
        </button>
        <button className="flex-1 bg-[#1877f2] text-white font-semibold py-1.5 rounded">
          <span className="mx-auto flex w-fit items-center justify-center gap-1.5 whitespace-nowrap text-sm leading-none">
            <img src="/facebook-icon.svg" alt="Facebook" className="h-5 w-5" />
            <span>Continue with Facebook</span>
          </span>
        </button>
      </div>
    </div>
  );
}
