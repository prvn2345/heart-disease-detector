import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Heart, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate   = useNavigate();
  const [showPwd, setShowPwd] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async ({ name, email, password }) => {
    try {
      await signup(name, email, password);
      toast.success("Account created! Welcome.");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.error || "Signup failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Heart className="text-primary-500" size={40} fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold text-white">HeartDetect</h1>
          <p className="text-gray-400 mt-1">Create your account</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="label">Full name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                className="input-field"
                placeholder="Jane Doe"
                {...register("name", { required: "Name is required." })}
              />
              {errors.name && (
                <p className="text-primary-400 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

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
                  autoComplete="new-password"
                  className="input-field pr-10"
                  placeholder="Min. 6 characters"
                  {...register("password", {
                    required: "Password is required.",
                    minLength: { value: 6, message: "Password must be at least 6 characters." },
                  })}
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
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
