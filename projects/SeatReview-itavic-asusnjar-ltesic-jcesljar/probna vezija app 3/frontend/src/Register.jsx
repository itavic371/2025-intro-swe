import React, { useState, useMemo } from "react";

function Register({ onSwitchToLogin, onNeedVerification }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Password strength validation
  const passwordChecks = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [password]);

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);

  const passwordStrength = useMemo(() => {
    const passed = Object.values(passwordChecks).filter(Boolean).length;
    if (passed <= 1) return { level: "weak", color: "#ef4444", width: "20%" };
    if (passed <= 2) return { level: "weak", color: "#ef4444", width: "40%" };
    if (passed <= 3) return { level: "medium", color: "#f59e0b", width: "60%" };
    if (passed <= 4) return { level: "good", color: "#22c55e", width: "80%" };
    return { level: "strong", color: "#16a34a", width: "100%" };
  }, [passwordChecks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Lozinke se ne podudaraju");
      return;
    }

    if (!isPasswordStrong) {
      setError("Lozinka ne ispunjava sve sigurnosne zahtjeve");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Move to verification step
        onNeedVerification(email, data.verificationCode);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* Password Strength Indicator */}
            {password && (
              <div className="password-strength-container">
                <div className="password-strength-bar">
                  <div
                    className="password-strength-fill"
                    style={{
                      width: passwordStrength.width,
                      backgroundColor: passwordStrength.color
                    }}
                  />
                </div>
                <span
                  className="password-strength-label"
                  style={{ color: passwordStrength.color }}
                >
                  {passwordStrength.level === "weak" && "Slaba"}
                  {passwordStrength.level === "medium" && "Srednja"}
                  {passwordStrength.level === "good" && "Dobra"}
                  {passwordStrength.level === "strong" && "Jaka"}
                </span>
              </div>
            )}

            {/* Password Requirements Checklist */}
            {password && (
              <div className="password-requirements">
                <p className="requirements-title">Lozinka mora sadržavati:</p>
                <ul className="requirements-list">
                  <li className={passwordChecks.minLength ? "valid" : "invalid"}>
                    <span className="check-icon">{passwordChecks.minLength ? "✓" : "✗"}</span>
                    Najmanje 8 znakova
                  </li>
                  <li className={passwordChecks.hasUppercase ? "valid" : "invalid"}>
                    <span className="check-icon">{passwordChecks.hasUppercase ? "✓" : "✗"}</span>
                    Veliko slovo (A-Z)
                  </li>
                  <li className={passwordChecks.hasLowercase ? "valid" : "invalid"}>
                    <span className="check-icon">{passwordChecks.hasLowercase ? "✓" : "✗"}</span>
                    Malo slovo (a-z)
                  </li>
                  <li className={passwordChecks.hasNumber ? "valid" : "invalid"}>
                    <span className="check-icon">{passwordChecks.hasNumber ? "✓" : "✗"}</span>
                    Broj (0-9)
                  </li>
                  <li className={passwordChecks.hasSpecial ? "valid" : "invalid"}>
                    <span className="check-icon">{passwordChecks.hasSpecial ? "✓" : "✗"}</span>
                    Poseban znak (!@#$%^&*)
                  </li>
                </ul>
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="password-match-error">Lozinke se ne podudaraju</p>
            )}
            {confirmPassword && password === confirmPassword && (
              <p className="password-match-success">Lozinke se podudaraju</p>
            )}
          </div>
          {error && <div className="error-message">{error}</div>}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !isPasswordStrong || password !== confirmPassword}
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account?{" "}
          <button className="link-button" onClick={onSwitchToLogin}>
            Login here
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
