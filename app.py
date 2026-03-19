from flask import Flask, render_template, request, redirect, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sklearn.linear_model import LinearRegression
import numpy as np

app = Flask(__name__)
app.secret_key = "budgetwise_secret"

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app)

# ---------------- DATABASE MODELS ----------------

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(100))


class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float)
    category = db.Column(db.String(100))
    month = db.Column(db.Integer)
    user_id = db.Column(db.Integer)


class Budget(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float)
    month = db.Column(db.Integer)
    user_id = db.Column(db.Integer)


class Saving(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float)
    month = db.Column(db.Integer)
    user_id = db.Column(db.Integer)


# ---------------- ROUTES ----------------

@app.route("/")
def home():
    return redirect("/login")


# ---------------- SIGNUP ----------------
@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        data = request.json

        user = User(
            username=data["username"],
            password=data["password"]
        )

        db.session.add(user)
        db.session.commit()

        return jsonify({"message": "Signup Successful"})

    return render_template("signup.html")


# ---------------- LOGIN ----------------
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        data = request.json

        user = User.query.filter_by(
            username=data["username"],
            password=data["password"]
        ).first()

        if user:
            session["user_id"] = user.id
            return jsonify({"message": "Login Success"})

        return jsonify({"message": "Invalid Credentials"})

    return render_template("login.html")


# ---------------- DASHBOARD ----------------
@app.route("/dashboard")
def dashboard():
    if "user_id" in session:
        return render_template("dashboard.html")
    return redirect("/login")


# ---------------- ADD EXPENSE ----------------
@app.route("/add_expense", methods=["POST"])
def add_expense():
    if "user_id" not in session:
        return jsonify({"message": "Not logged in"})

    data = request.json

    expense = Expense(
        amount=float(data["amount"]),
        category=data["category"],
        month=int(data["month"]),
        user_id=session["user_id"]
    )

    db.session.add(expense)
    db.session.commit()

    return jsonify({"message": "Expense Added Successfully"})


# ---------------- GET EXPENSES ----------------
@app.route("/get_expenses")
def get_expenses():
    if "user_id" not in session:
        return jsonify([])

    expenses = Expense.query.filter_by(
        user_id=session["user_id"]
    ).all()

    return jsonify([
        {
            "amount": e.amount,
            "category": e.category,
            "month": e.month
        }
        for e in expenses
    ])


# ---------------- SET BUDGET ----------------
@app.route("/set_budget", methods=["POST"])
def set_budget():
    if "user_id" not in session:
        return jsonify({"message": "Not logged in"})

    data = request.json

    budget = Budget(
        amount=float(data["amount"]),
        month=int(data["month"]),
        user_id=session["user_id"]
    )

    db.session.add(budget)
    db.session.commit()

    return jsonify({"message": "Budget Saved"})


# ---------------- ADD SAVING ----------------
@app.route("/add_saving", methods=["POST"])
def add_saving():
    if "user_id" not in session:
        return jsonify({"message": "Not logged in"})

    data = request.json

    saving = Saving(
        amount=float(data["amount"]),
        month=int(data["month"]),
        user_id=session["user_id"]
    )

    db.session.add(saving)
    db.session.commit()

    return jsonify({"message": "Saving Added"})
    

# ---------------- MONTHLY REPORT ----------------
@app.route("/get_report/<int:month>")
def get_report(month):

    if "user_id" not in session:
        return jsonify({})

    user_id = session["user_id"]

    # Budget
    budget = Budget.query.filter_by(user_id=user_id, month=month).first()
    budget_amount = budget.amount if budget else 0

    # Expenses
    expenses = Expense.query.filter_by(user_id=user_id, month=month).all()
    total_expense = sum(e.amount for e in expenses)

    # Savings
    savings = Saving.query.filter_by(user_id=user_id, month=month).all()
    total_saving = sum(s.amount for s in savings)

    # Remaining
    remaining = budget_amount - total_expense - total_saving

    return jsonify({
        "budget": budget_amount,
        "expenses": total_expense,
        "savings": total_saving,
        "remaining": remaining
    })


# ---------------- AI FORECAST ----------------
@app.route("/forecast")
def forecast():

    if "user_id" not in session:
        return jsonify({"prediction": "Login Required"})

    expenses = Expense.query.filter_by(
        user_id=session["user_id"]
    ).all()

    if len(expenses) < 2:
        return jsonify({"prediction": "Not enough data"})

    months = np.array([e.month for e in expenses]).reshape(-1, 1)
    amounts = np.array([e.amount for e in expenses])

    model = LinearRegression()
    model.fit(months, amounts)

    next_month = max([e.month for e in expenses]) + 1
    prediction = model.predict([[next_month]])

    return jsonify({"prediction": round(float(prediction[0]), 2)})


# ---------------- LOGOUT ----------------
@app.route("/logout")
def logout():
    session.clear()
    return redirect("/login")


# ---------------- RUN ----------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()

    app.run(debug=True)
