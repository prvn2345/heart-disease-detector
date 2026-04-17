import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Heart, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [showPwd, setShowPwd] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async ({ email, password }) => {
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Heart className="text-primary-500" size={40} fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold text-white">HeartDetect</h1>
          <p className="text-gray-400 mt-1">Sign in to your account</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input-field"
                placeholder="you@example.com"
                {...register("email", {
                  required: "Email is required.",
                  pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email." },
                })}
              />
              {errors.email && (
                <p className="text-primary-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  className="input-field pr-10"
                  placeholder="••••••••"
                  {...register("password", { required: "Password is required." })}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-primary-400 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
