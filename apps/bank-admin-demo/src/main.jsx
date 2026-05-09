import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { AlertTriangle, Ban, CheckCircle2, Clock, KeyRound, ShieldCheck } from "lucide-react";
import "./styles.css";

const actions = [
  { name: "refund_payment", label: "Refund payment", risk: "medium", role: "finance_admin", target: "pay_8421" },
  { name: "freeze_account", label: "Freeze account", risk: "high", role: "security_admin", target: "acct_1049" },
  { name: "change_user_role", label: "Change role", risk: "high", role: "security_admin", target: "usr_8820" },
  { name: "export_user_data", label: "Export data", risk: "medium", role: "privacy_admin", target: "usr_7312" },
  { name: "delete_account", label: "Delete account", risk: "critical", role: "security_admin", target: "acct_9912" },
];

const actors = [
  { id: "ava", name: "Ava Finance", roles: ["finance_admin"] },
  { id: "mira", name: "Mira Security", roles: ["security_admin"] },
  { id: "leo", name: "Leo Support", roles: ["support_agent"] },
];

function App() {
  const [actorId, setActorId] = useState("ava");
  const [selectedAction, setSelectedAction] = useState(actions[0].name);
  const [target, setTarget] = useState(actions[0].target);
  const [audit, setAudit] = useState([]);
  const [token, setToken] = useState(null);
  const actor = actors.find((candidate) => candidate.id === actorId);
  const action = actions.find((candidate) => candidate.name === selectedAction);

  const status = useMemo(() => {
    if (!token) return { label: "No active token", tone: "neutral" };
    if (token.consumed) return { label: "Token consumed", tone: "danger" };
    if (Date.now() > token.expiresAt) return { label: "Token expired", tone: "danger" };
    return { label: "Token ready", tone: "success" };
  }, [token]);

  function addAudit(type, detail) {
    setAudit((records) => [
      {
        id: crypto.randomUUID(),
        time: new Date().toLocaleTimeString(),
        type,
        detail,
      },
      ...records,
    ]);
  }

  function requestAuthority() {
    addAudit("authority_requested", `${actor.name} requested ${action.label} for ${target}`);

    if (!actor.roles.includes(action.role)) {
      setToken(null);
      addAudit("authority_denied", `Denied: ${actor.name} lacks ${action.role}`);
      return;
    }

    if (action.risk === "critical") {
      setToken(null);
      addAudit("authority_held", "Held: critical action requires manual review");
      return;
    }

    const issuedToken = {
      id: `tok_${crypto.randomUUID().slice(0, 8)}`,
      action: action.name,
      target,
      actorId: actor.id,
      expiresAt: Date.now() + 45000,
      consumed: false,
    };

    setToken(issuedToken);
    addAudit("authority_allowed", `Scope-bound one-use token minted: ${issuedToken.id}`);
  }

  function executeAction() {
    if (!token) {
      addAudit("execution_rejected", "Rejected: no authority token");
      return;
    }

    if (token.consumed) {
      addAudit("execution_rejected", `Replay blocked: ${token.id} already consumed`);
      return;
    }

    if (Date.now() > token.expiresAt) {
      addAudit("execution_rejected", `Expired token blocked: ${token.id}`);
      return;
    }

    if (token.action !== action.name || token.target !== target || token.actorId !== actor.id) {
      addAudit("execution_rejected", "Scope mismatch blocked: token no longer matches request");
      return;
    }

    setToken({ ...token, consumed: true });
    addAudit("token_consumed", `${token.id} consumed exactly once`);
    addAudit("execution_completed", `${action.label} executed for ${target}`);
  }

  function simulateAttack(kind) {
    if (kind === "replay") {
      executeAction();
      executeAction();
    }

    if (kind === "target") {
      setTarget("acct_intruder");
      addAudit("attack_started", "Attacker changed target after authority was granted");
    }

    if (kind === "no_token") {
      setToken(null);
      addAudit("attack_started", "Execution attempted without authority");
      executeAction();
    }
  }

  return (
    <main>
      <section className="workspace">
        <aside className="sidebar">
          <div className="brand">
            <ShieldCheck size={28} />
            <div>
              <h1>KNOT Bank Admin</h1>
              <p>Authority-governed execution demo</p>
            </div>
          </div>

          <label>
            Actor
            <select value={actorId} onChange={(event) => setActorId(event.target.value)}>
              {actors.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Action
            <select
              value={selectedAction}
              onChange={(event) => {
                const next = actions.find((candidate) => candidate.name === event.target.value);
                setSelectedAction(next.name);
                setTarget(next.target);
              }}
            >
              {actions.map((candidate) => (
                <option key={candidate.name} value={candidate.name}>
                  {candidate.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Target
            <input value={target} onChange={(event) => setTarget(event.target.value)} />
          </label>

          <div className={`token ${status.tone}`}>
            <KeyRound size={18} />
            <span>{status.label}</span>
          </div>

          <button onClick={requestAuthority}>
            <Clock size={18} />
            Request authority
          </button>
          <button className="primary" onClick={executeAction}>
            <CheckCircle2 size={18} />
            Execute action
          </button>
        </aside>

        <section className="content">
          <div className="action-strip">
            {actions.map((candidate) => (
              <button
                key={candidate.name}
                className={candidate.name === action.name ? "active" : ""}
                onClick={() => {
                  setSelectedAction(candidate.name);
                  setTarget(candidate.target);
                }}
              >
                <span>{candidate.label}</span>
                <small>{candidate.risk}</small>
              </button>
            ))}
          </div>

          <div className="panels">
            <section className="panel">
              <h2>Transition Gate</h2>
              <div className="pipeline">
                {["request", "authority", "scope", "token", "execute", "audit"].map((step) => (
                  <div key={step}>{step}</div>
                ))}
              </div>
              <div className="attack-row">
                <button onClick={() => simulateAttack("replay")}>
                  <Ban size={17} />
                  Replay token
                </button>
                <button onClick={() => simulateAttack("target")}>
                  <AlertTriangle size={17} />
                  Change target
                </button>
                <button onClick={() => simulateAttack("no_token")}>
                  <Ban size={17} />
                  No authority
                </button>
              </div>
            </section>

            <section className="panel audit">
              <h2>Audit Trail</h2>
              <div className="records">
                {audit.length === 0 ? (
                  <p className="empty">No authority events yet.</p>
                ) : (
                  audit.map((record) => (
                    <article key={record.id}>
                      <strong>{record.type}</strong>
                      <span>{record.time}</span>
                      <p>{record.detail}</p>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
