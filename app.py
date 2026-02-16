from flask import Flask, render_template, request, redirect, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import pandas as pd
from sklearn.linear_model import LinearRegression
import numpy as np

app = Flask(__name__)
app.secret_key = "budgetwise_secret"
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
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

# ---------------- ROUTES ----------------

@app.route("/")
def home():
    return redirect("/login")

@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        data = request.json
        user = User(username=data["username"], password=data["password"])
        db.session.add(user)
        db.session.commit()
        return jsonify({"message": "Signup Successful"})
    return render_template("signup.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        data = request.json
        user = User.query.filter_by(username=data["username"], password=data["password"]).first()
        if user:
            session["user_id"] = user.id
            return jsonify({"message": "Login Success"})
        return jsonify({"message": "Invalid Credentials"})
    return render_template("login.html")

@app.route("/dashboard")
def dashboard():
    if "user_id" in session:
        return render_template("dashboard.html")
    return redirect("/login")

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

@app.route("/get_expenses")
def get_expenses():
    if "user_id" not in session:
        return jsonify([])

    expenses = Expense.query.filter_by(user_id=session["user_id"]).all()

    return jsonify([
        {
            "amount": e.amount,
            "category": e.category,
            "month": e.month
        }
        for e in expenses
    ])

@app.route("/forecast")
def forecast():
    if "user_id" not in session:
        return jsonify({"prediction": "Login Required"})

    expenses = Expense.query.filter_by(user_id=session["user_id"]).all()

    if len(expenses) < 2:
        return jsonify({"prediction": "Not enough data"})

    months = np.array([e.month for e in expenses]).reshape(-1, 1)
    amounts = np.array([e.amount for e in expenses])

    model = LinearRegression()
    model.fit(months, amounts)

    next_month = max([e.month for e in expenses]) + 1
    prediction = model.predict([[next_month]])

    return jsonify({"prediction": round(float(prediction[0]), 2)})

@app.route("/logout")
def logout():
    session.clear()
    return redirect("/login")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
