import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  User,
  ArrowRight,
  Check,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
export default function LoginForm({ register = false }) {
  const { authenticate, notice } = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  const [fields, setFields] = useState({ name: "", email: "", password: "" });
  const change = (e) =>
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setError("");
    const f = new FormData(event.currentTarget),
      password = f.get("password");
    if (register && new TextEncoder().encode(password).length > 72) {
      setError("Password must be at most 72 bytes.");
      return;
    }
    setBusy(true);
    try {
      await authenticate(register ? "register" : "login", {
        ...(register ? { name: f.get("name") } : {}),
        email: f.get("email"),
        password,
      });
      navigate(location.state?.from || "/app", { replace: true });
    } catch (e) {
      setError(e.details?.map((d) => d.message).join(" ") || e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout" id="main-content">
      <section className="auth-story">
        <div className="edition">SMALL BUSINESS. BIG PICTURE.</div>
        <h1>
          Good stock.
          <br />
          Less guesswork<span>.</span>
        </h1>
        <p>
          Your shelves have a story.
          <br />
          Know what’s selling, what’s low,
          <br />
          and what needs your attention.
        </p>
        <div className="shelf-art" aria-hidden="true">
          <div className="art-label">
            THE WELL-KEPT STOCKROOM <ArrowUpRight size={18} />
          </div>
          <div className="shelf">
            <div className="pack p1">
              OAT
              <br />
              <b>01</b>
            </div>
            <div className="pack p2">
              daily
              <br />
              <b>02</b>
            </div>
            <div className="pack p3">
              FRESH
              <br />
              <b>03</b>
            </div>
          </div>
          <div className="art-foot">
            <span>Everything in its place.</span>
            <span>EST. 2026</span>
          </div>
        </div>
        <div className="story-bottom">
          <span className="live-dot" /> A little clarity goes a long way.
        </div>
      </section>
      <section className="auth-form-area">
        <div className="form-eyebrow">
          <span>YOUR WORKSPACE AWAITS</span>
          <span>01 / 02</span>
        </div>
        <div className="auth-form-inner">
          <div className="icon-tile">
            <LockKeyhole size={25} />
          </div>
          <h2>
            {register ? "Start with a clean shelf." : "Back to business."}
          </h2>
          <p>
            {register
              ? "Create your account. Bring your inventory into focus."
              : "Sign in to see how your stockroom is doing."}
          </p>
          <form onSubmit={submit} key={String(register)}>
            {register && (
              <label>
                Your name
                <div className="input-icon">
                  <User size={18} />
                  <input
                    name="name"
                    value={fields.name}
                    onChange={change}
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={60}
                    placeholder="Rachit Tripathi"
                  />
                </div>
              </label>
            )}
            <label>
              Email address
              <div className="input-icon">
                <Mail size={18} />
                <input
                  type="email"
                  name="email"
                  value={fields.email}
                  onChange={change}
                  autoComplete="email"
                  required
                  maxLength={254}
                  placeholder="you@yourbusiness.com"
                />
              </div>
            </label>
            <label>
              Password
              <div className="input-icon">
                <LockKeyhole size={18} />
                <input
                  type={show ? "text" : "password"}
                  name="password"
                  value={fields.password}
                  onChange={change}
                  autoComplete={register ? "new-password" : "current-password"}
                  required
                  minLength={register ? 8 : 1}
                  maxLength={72}
                  placeholder={
                    register ? "At least 8 characters" : "Enter your password"
                  }
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {register && (
              <small>Use 8–72 characters. Choose a unique password.</small>
            )}
            {(error || notice) && (
              <div className="form-error" role="alert">
                {error || notice}
              </div>
            )}
            <button className="button primary full" disabled={busy}>
              {busy
                ? "Connecting…"
                : register
                  ? "Create my workspace"
                  : "Open my workspace"}
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="auth-switch">
            {register ? "Already have an account?" : "New to StockWise?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Sign in" : "Create an account"}{" "}
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="auth-assurance">
            <Check size={15} /> Your inventory stays in your account.
          </div>
        </div>
        <div className="form-footer">
          A fresh perspective on everyday inventory.
        </div>
      </section>
    </div>
  );
}
