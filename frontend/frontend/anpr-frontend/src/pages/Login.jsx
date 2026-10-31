import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-icon">
          🚘
        </div>

        <h1>ANPR Toll Plaza</h1>

        <p className="login-subtitle">
          AI-Powered Number Plate Recognition
        </p>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter username"
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
            />
          </div>

          <div className="login-options">
  <label>
    <input type="checkbox" />
    Remember me
  </label>

  <a href="#">Forgot Password?</a>
</div>

<button type="submit">
  Login to System
</button>
        </form>

        <p className="login-footer">
          Rural Toll Plaza • AI Monitoring System
        </p>

      </div>
    </div>
  );
}

export default Login;