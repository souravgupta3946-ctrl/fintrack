import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  WalletCards,
  Target,
  PieChart as PieIcon,
  Plus,
  Search,
  Download,
  Trash2,
  Edit3,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  LogOut,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import "./styles.css";

/* =========================
   API
========================= */

// Local development:
// VITE_API_URL=http://localhost:8080/api

// Hosting:
// VITE_API_URL=https://your-backend-url.up.railway.app/api

const API =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";


/* =========================
   CATEGORIES
========================= */

const expCats = [
  "Food",
  "Housing",
  "Transport",
  "Bills",
  "Entertainment",
  "Shopping",
  "Health",
  "Education",
  "Other",
];

const incCats = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Gift",
  "Other",
];


/* =========================
   MONEY FORMATTER
========================= */

const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);


/* =========================
   APP
========================= */

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("fin_token")
  );

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("fin_user") || "null")
  );

  const [auth, setAuth] = useState("login");

  const [transactions, setTransactions] = useState([]);

  const [budget, setBudget] = useState(30000);

  const [page, setPage] = useState("dashboard");

  const [show, setShow] = useState(false);

  const [edit, setEdit] = useState(null);

  const [search, setSearch] = useState("");

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    type: "expense",
    title: "",
    category: "Food",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });


  /* =========================
     HEADERS
  ========================= */

  const headers = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });


  /* =========================
     LOAD DATA
  ========================= */

  async function load() {
    if (!token) return;

    try {
      const r = await fetch(API + "/transactions", {
        headers: headers(),
      });

      if (r.ok) {
        const data = await r.json();
        setTransactions(Array.isArray(data) ? data : []);
      } else if (r.status === 401 || r.status === 403) {
        logout();
        return;
      }

      const b = await fetch(API + "/budget", {
        headers: headers(),
      });

      if (b.ok) {
        const budgetData = await b.json();

        if (budgetData?.budget !== undefined) {
          setBudget(Number(budgetData.budget));
        }
      }
    } catch (err) {
      console.error("Load error:", err);
    }
  }


  useEffect(() => {
    load();
  }, [token]);


  /* =========================
     AUTH
  ========================= */

 async function authSubmit(e) {
  e.preventDefault();
  setError("");

  const endpoint =
    auth === "login"
      ? "/auth/login"
      : "/auth/register";

  const body =
    auth === "login"
      ? {
          email: authForm.email,
          password: authForm.password,
        }
      : {
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
        };

  console.log("Sending request to:", API + endpoint);
  console.log("Request body:", body);

  try {
    const r = await fetch(API + endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Read response as text first
    const raw = await r.text();

    console.log("Status:", r.status);
    console.log("Backend response:", raw);

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }

    if (!r.ok) {
      let message = "Authentication failed";

      if (typeof data === "string" && data) {
        message = data;
      } else if (data?.message) {
        message = data.message;
      } else if (data?.error) {
        message = data.error;
      }

      setError(message);
      return;
    }

    if (!data?.token) {
      setError(
        "Backend response does not contain a token."
      );
      return;
    }

    localStorage.setItem(
      "fin_token",
      data.token
    );

    localStorage.setItem(
      "fin_user",
      JSON.stringify(data)
    );

    setToken(data.token);
    setUser(data);

  } catch (err) {
    console.error("AUTH ERROR:", err);

    setError(
      "Cannot connect to backend. Check if Spring Boot is running."
    );
  }
}

  /* =========================
     LOGOUT
  ========================= */

  function logout() {
    localStorage.removeItem("fin_token");
    localStorage.removeItem("fin_user");

    setToken(null);
    setUser(null);
    setTransactions([]);
  }


  /* =========================
     ADD TRANSACTION
  ========================= */

  function add() {
    setEdit(null);

    setForm({
      type: "expense",
      title: "",
      category: "Food",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      note: "",
    });

    setError("");

    setShow(true);
  }


  /* =========================
     SAVE TRANSACTION
  ========================= */

  async function save(e) {
    e.preventDefault();

    setError("");

    if (!form.title.trim()) {
      setError("Please enter a transaction title.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    const url = edit
      ? `${API}/transactions/${edit}`
      : API + "/transactions";

    const payload = {
      type: form.type.toUpperCase(),
      title: form.title.trim(),
      category: form.category,
      amount: Number(form.amount),
      date: form.date,
      note: form.note?.trim() || "",
    };

    console.log("Sending transaction:", payload);

    try {
      const r = await fetch(url, {
        method: edit ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });

      const data = await r.json().catch(() => null);

      console.log("Backend response:", r.status, data);

      if (!r.ok) {
        setError(
          typeof data === "string"
            ? data
            : data?.message ||
              "Unable to save transaction."
        );
        return;
      }

      setShow(false);
      setEdit(null);

      await load();
    } catch (err) {
      console.error("Save transaction error:", err);

      setError(
        "Cannot connect to backend. Make sure Spring Boot is running."
      );
    }
  }


  /* =========================
     DELETE
  ========================= */

  async function remove(id) {
    if (!window.confirm("Delete this transaction?")) {
      return;
    }

    try {
      const r = await fetch(
        API + "/transactions/" + id,
        {
          method: "DELETE",
          headers: headers(),
        }
      );

      if (!r.ok) {
        alert("Unable to delete transaction.");
        return;
      }

      await load();
    } catch (err) {
      console.error(err);
      alert("Cannot connect to backend.");
    }
  }


  /* =========================
     SAVE BUDGET
  ========================= */

  async function saveBudget(v) {
    const value = Number(v);

    if (!value || value <= 0) {
      alert("Please enter a valid budget.");
      return;
    }

    try {
      const r = await fetch(API + "/budget", {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({
          budget: value,
        }),
      });

      if (!r.ok) {
        alert("Unable to update budget.");
        return;
      }

      setBudget(value);
    } catch (err) {
      console.error(err);
      alert("Cannot connect to backend.");
    }
  }


  /* =========================
     CALCULATIONS
  ========================= */

  const income = transactions
    .filter(
      (t) =>
        t.type?.toLowerCase() === "income"
    )
    .reduce(
      (a, t) => a + Number(t.amount || 0),
      0
    );

  const expenses = transactions
    .filter(
      (t) =>
        t.type?.toLowerCase() === "expense"
    )
    .reduce(
      (a, t) => a + Number(t.amount || 0),
      0
    );

  const balance = income - expenses;


  /* =========================
     SEARCH
  ========================= */

  const filtered = transactions.filter((t) =>
    [
      t.title,
      t.category,
      t.note,
      t.date,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );


  /* =========================
     EXPENSE CATEGORY DATA
  ========================= */

  const cat = useMemo(
    () =>
      Object.entries(
        transactions
          .filter(
            (t) =>
              t.type?.toLowerCase() ===
              "expense"
          )
          .reduce((m, t) => {
            const category =
              t.category || "Other";

            m[category] =
              (m[category] || 0) +
              Number(t.amount || 0);

            return m;
          }, {})
      ).map(([name, value]) => ({
        name,
        value,
      })),
    [transactions]
  );


  /* =========================
     MONTHLY DATA
  ========================= */

  const monthly = useMemo(() => {
    const m = {};

    transactions.forEach((t) => {
      if (!t.date) return;

      const k = t.date.slice(0, 7);

      const label = new Date(
        t.date + "T00:00:00"
      ).toLocaleString("en-IN", {
        month: "short",
      });

      if (!m[k]) {
        m[k] = {
          month: label,
          income: 0,
          expense: 0,
        };
      }

      const type =
        t.type?.toLowerCase();

      const amount =
        Number(t.amount) || 0;

      if (type === "income") {
        m[k].income += amount;
      }

      if (type === "expense") {
        m[k].expense += amount;
      }
    });

    return Object.values(m).sort((a, b) =>
      a.month.localeCompare(b.month)
    );
  }, [transactions]);


  /* =========================
     EDIT TRANSACTION
  ========================= */

  function editTx(t) {
    setEdit(t.id);

    setForm({
      type: t.type?.toLowerCase() || "expense",
      title: t.title || "",
      category: t.category || "Other",
      amount: String(t.amount ?? ""),
      date: t.date || new Date().toISOString().slice(0, 10),
      note: t.note || "",
    });

    setError("");

    setShow(true);
  }


  /* =========================
     CSV EXPORT
  ========================= */

  function csv() {
    const rows = [
      [
        "Date",
        "Type",
        "Title",
        "Category",
        "Amount",
        "Note",
      ],

      ...transactions.map((t) => [
        t.date,
        t.type,
        t.title,
        t.category,
        t.amount,
        t.note,
      ]),
    ];

    const blob = new Blob(
      [
        rows
          .map((r) =>
            r
              .map(
                (v) =>
                  `"${String(
                    v ?? ""
                  ).replaceAll('"', '""')}"`
              )
              .join(",")
          )
          .join("\n"),
      ],
      {
        type: "text/csv",
      }
    );

    const a =
      document.createElement("a");

    a.href =
      URL.createObjectURL(blob);

    a.download = "fintrack.csv";

    a.click();

    URL.revokeObjectURL(a.href);
  }


  /* =========================
     AUTH SCREEN
  ========================= */

  if (!token) {
    return (
      <Auth
        auth={auth}
        setAuth={setAuth}
        form={authForm}
        setForm={setAuthForm}
        submit={authSubmit}
        error={error}
      />
    );
  }


  /* =========================
     MAIN UI
  ========================= */

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside>

        <div className="brand">
          <b>₹</b>
          <strong>FinTrack</strong>
          <small>Personal Finance</small>
        </div>

        {[
          [
            "dashboard",
            "Dashboard",
            LayoutDashboard,
          ],
          [
            "transactions",
            "Transactions",
            WalletCards,
          ],
          [
            "budget",
            "Budget",
            Target,
          ],
          [
            "reports",
            "Reports",
            PieIcon,
          ],
        ].map(([k, l, I]) => (
          <button
            key={k}
            className={
              page === k ? "active" : ""
            }
            onClick={() => setPage(k)}
          >
            <I size={18} />
            {l}
          </button>
        ))}

        <button
          className="logout"
          onClick={logout}
        >
          <LogOut size={18} />
          Logout
        </button>

      </aside>


      {/* MAIN */}

      <main>

        <header>

          <div>

            <small>
              PERSONAL FINANCE
            </small>

            <h1>
              {page === "dashboard"
                ? "Good evening 👋"
                : page[0].toUpperCase() +
                  page.slice(1)}
            </h1>

            <p>
              Welcome back,{" "}
              {user?.name || "User"}
            </p>

          </div>


          <div className="actions">

            <button onClick={csv}>
              <Download size={18} />
            </button>

            <button
              className="primary"
              onClick={add}
            >
              <Plus size={18} />
              Add transaction
            </button>

          </div>

        </header>


        {/* DASHBOARD */}

        {page === "dashboard" && (
          <Dashboard
            income={income}
            expenses={expenses}
            balance={balance}
            budget={budget}
            cat={cat}
            monthly={monthly}
            tx={transactions}
            add={add}
            edit={editTx}
          />
        )}


        {/* TRANSACTIONS */}

        {page === "transactions" && (
          <>
            <div className="toolbar">

              <div className="search">

                <Search size={18} />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search transactions..."
                />

              </div>

              <button
                className="primary"
                onClick={add}
              >
                <Plus size={18} />
                Add transaction
              </button>

            </div>

            <div className="card">

              <Table
                data={filtered}
                edit={editTx}
                remove={remove}
              />

            </div>
          </>
        )}


        {/* BUDGET */}

        {page === "budget" && (
          <Budget
            budget={budget}
            expenses={expenses}
            save={saveBudget}
          />
        )}


        {/* REPORTS */}

        {page === "reports" && (
          <Reports
            cat={cat}
            monthly={monthly}
          />
        )}

      </main>


      {/* MODAL */}

      {show && (
        <Modal
          edit={edit}
          form={form}
          setForm={setForm}
          close={() => {
            setShow(false);
            setEdit(null);
            setError("");
          }}
          save={save}
          error={error}
        />
      )}

    </div>
  );
}


/* =========================================================
   AUTH COMPONENT
========================================================= */

function Auth({
  auth,
  setAuth,
  form,
  setForm,
  submit,
  error,
}) {
  return (
    <div className="auth">

      <div className="auth-box">

        <div className="brand center">
          <b>₹</b>
          <strong>FinTrack</strong>
          <small>
            Personal Finance Manager
          </small>
        </div>

        <h1>
          {auth === "login"
            ? "Welcome back"
            : "Create your account"}
        </h1>

        <p>
          {auth === "login"
            ? "Sign in to manage your finances."
            : "Start tracking your money today."}
        </p>

        <form onSubmit={submit}>

          {auth === "register" && (
            <input
              required
              placeholder="Full name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />
          )}

          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
          />

          <input
            required
            minLength="6"
            type="password"
            placeholder="Password (min 6 characters)"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
          />

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary wide"
          >
            {auth === "login"
              ? "Sign in"
              : "Create account"}
          </button>

        </form>

        <button
          className="switch"
          onClick={() =>
            setAuth(
              auth === "login"
                ? "register"
                : "login"
            )
          }
        >
          {auth === "login"
            ? "Create a new account"
            : "Already have an account? Sign in"}
        </button>

      </div>

    </div>
  );
}


/* =========================================================
   STAT
========================================================= */

function Stat({
  title,
  value,
  icon: I,
}) {
  return (
    <div className="stat">

      <div className="stat-icon">
        <I size={20} />
      </div>

      <div>
        <span>{title}</span>
        <strong>
          {money(value)}
        </strong>
      </div>

    </div>
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard(p) {
  return (
    <>

      <div className="stats">

        <Stat
          title="Total balance"
          value={p.balance}
          icon={WalletCards}
        />

        <Stat
          title="Total income"
          value={p.income}
          icon={ArrowDownLeft}
        />

        <Stat
          title="Total expenses"
          value={p.expenses}
          icon={ArrowUpRight}
        />

        <Stat
          title="Monthly budget"
          value={p.budget}
          icon={Target}
        />

      </div>


      <div className="grid">

        <Chart title="Income vs expenses">

          <ResponsiveContainer>
            <BarChart data={p.monthly}>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip
                formatter={(v) =>
                  money(v)
                }
              />

              <Bar
                dataKey="income"
                name="Income"
                radius={[
                  6,
                  6,
                  0,
                  0,
                ]}
              />

              <Bar
                dataKey="expense"
                name="Expense"
                radius={[
                  6,
                  6,
                  0,
                  0,
                ]}
              />

            </BarChart>
          </ResponsiveContainer>

        </Chart>


        <Chart title="Expense breakdown">

          <ResponsiveContainer>
            <PieChart>

              <Pie
                data={p.cat}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
              >

                {p.cat.map((_, i) => (
                  <Cell key={i} />
                ))}

              </Pie>

              <Tooltip
                formatter={(v) =>
                  money(v)
                }
              />

              <Legend />

            </PieChart>
          </ResponsiveContainer>

        </Chart>

      </div>


      <div className="card">

        <div className="card-head">

          <h3>
            Recent transactions
          </h3>

          <button
            className="ghost"
            onClick={p.add}
          >
            <Plus size={16} />
            Add
          </button>

        </div>

        <Table
          data={p.tx.slice(0, 5)}
          edit={p.edit}
        />

      </div>

    </>
  );
}


/* =========================================================
   CHART
========================================================= */

function Chart({
  title,
  children,
}) {
  return (
    <div className="card chart">

      <h3>{title}</h3>

      {children}

    </div>
  );
}


/* =========================================================
   TABLE
========================================================= */

function Table({
  data,
  edit,
  remove,
}) {
  return (
    <div className="table">

      <table>

        <thead>

          <tr>
            <th>Transaction</th>
            <th>Category</th>
            <th>Date</th>
            <th>Amount</th>
            <th></th>
          </tr>

        </thead>

        <tbody>

          {data.map((t) => {

            const type =
              t.type?.toLowerCase();

            const isIncome =
              type === "income";

            return (
              <tr key={t.id}>

                <td>
                  <b>{t.title}</b>

                  <small>
                    {t.note || "No note"}
                  </small>
                </td>

                <td>
                  {t.category}
                </td>

                <td>
                  {t.date}
                </td>

                <td
                  className={
                    isIncome
                      ? "income"
                      : "expense"
                  }
                >
                  {isIncome
                    ? "+"
                    : "-"}

                  {money(t.amount)}
                </td>

                <td>

                  <button
                    onClick={() =>
                      edit(t)
                    }
                  >
                    <Edit3 size={15} />
                  </button>

                  {remove && (
                    <button
                      onClick={() =>
                        remove(t.id)
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  )}

                </td>

              </tr>
            );
          })}


          {!data.length && (
            <tr>

              <td
                colSpan="5"
                className="empty"
              >
                No transactions yet.
              </td>

            </tr>
          )}

        </tbody>

      </table>

    </div>
  );
}


/* =========================================================
   BUDGET
========================================================= */

function Budget({
  budget,
  expenses,
  save,
}) {
  const [v, setV] =
    useState(budget);

  useEffect(() => {
    setV(budget);
  }, [budget]);

  const pct =
    budget > 0
      ? Math.min(
          100,
          Math.round(
            (expenses / budget) * 100
          )
        )
      : 0;

  return (
    <div className="card budget">

      <Target size={34} />

      <h2>
        Monthly spending budget
      </h2>

      <p>
        Track your spending against
        your target.
      </p>

      <strong>
        {money(budget)}
      </strong>

      <div className="progress">

        <span
          style={{
            width: pct + "%",
          }}
        />

      </div>

      <div className="budget-row">

        <span>
          {money(expenses)} spent
        </span>

        <span>
          {money(
            Math.max(
              0,
              budget - expenses
            )
          )}{" "}
          remaining
        </span>

      </div>

      <input
        type="number"
        min="1"
        value={v}
        onChange={(e) =>
          setV(e.target.value)
        }
      />

      <button
        className="primary"
        onClick={() => save(v)}
      >
        Update budget
      </button>

    </div>
  );
}


/* =========================================================
   REPORTS
========================================================= */

function Reports({
  cat,
  monthly,
}) {
  return (
    <div className="grid">

      <Chart title="Monthly cash flow">

        <ResponsiveContainer>
          <BarChart data={monthly}>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis dataKey="month" />

            <YAxis />

            <Tooltip
              formatter={(v) =>
                money(v)
              }
            />

            <Bar
              dataKey="income"
              name="Income"
            />

            <Bar
              dataKey="expense"
              name="Expense"
            />

          </BarChart>
        </ResponsiveContainer>

      </Chart>


      <Chart title="Expense categories">

        <ResponsiveContainer>
          <PieChart>

            <Pie
              data={cat}
              dataKey="value"
              nameKey="name"
              outerRadius={90}
            >

              {cat.map((_, i) => (
                <Cell key={i} />
              ))}

            </Pie>

            <Tooltip
              formatter={(v) =>
                money(v)
              }
            />

            <Legend />

          </PieChart>
        </ResponsiveContainer>

      </Chart>

    </div>
  );
}


/* =========================================================
   MODAL
========================================================= */

function Modal({
  edit,
  form,
  setForm,
  close,
  save,
  error,
}) {
  const categories =
    form.type === "expense"
      ? expCats
      : incCats;

  return (
    <div className="overlay">

      <div className="modal">

        <div className="modal-head">

          <h2>
            {edit ? "Edit" : "Add"} transaction
          </h2>

          <button onClick={close}>
            <X />
          </button>

        </div>


        {error && (
          <div className="error">
            {error}
          </div>
        )}


        <form onSubmit={save}>

          <div className="tabs">

            <button
              type="button"
              className={
                form.type === "expense"
                  ? "sel"
                  : ""
              }
              onClick={() =>
                setForm({
                  ...form,
                  type: "expense",
                  category: "Food",
                })
              }
            >
              Expense
            </button>


            <button
              type="button"
              className={
                form.type === "income"
                  ? "sel"
                  : ""
              }
              onClick={() =>
                setForm({
                  ...form,
                  type: "income",
                  category: "Salary",
                })
              }
            >
              Income
            </button>

          </div>


          <input
            required
            placeholder="Title"
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value,
              })
            }
          />


          <div className="two">

            <input
              required
              type="number"
              min="1"
              step="0.01"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) =>
                setForm({
                  ...form,
                  amount: e.target.value,
                })
              }
            />


            <input
              required
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm({
                  ...form,
                  date: e.target.value,
                })
              }
            />

          </div>


          <select
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value,
              })
            }
          >

            {categories.map((c) => (
              <option
                key={c}
                value={c}
              >
                {c}
              </option>
            ))}

          </select>


          <input
            placeholder="Note (optional)"
            value={form.note}
            onChange={(e) =>
              setForm({
                ...form,
                note: e.target.value,
              })
            }
          />


          <button
            type="submit"
            className="primary wide"
          >
            {edit
              ? "Save changes"
              : "Add transaction"}
          </button>

        </form>

      </div>

    </div>
  );
}


/* =========================================================
   RENDER
========================================================= */

createRoot(
  document.getElementById("root")
).render(<App />);