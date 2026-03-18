// ----------------------
// GLOBAL VALUES
// ----------------------
let budgets = [];
let savings = [];
let monthlyData = [0,0,0,0,0,0,0,0,0,0,0,0];

let chart = null;
let currentMonth = null;


// ----------------------
// SIGNUP
// ----------------------
function signup() {
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm_password").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    fetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        if (data.status === "success") {
            window.location.href = "/login";
        }
    });
}


// ----------------------
// LOGIN
// ----------------------
function login() {
    fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: document.getElementById("username").value,
            password: document.getElementById("password").value
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.message === "Login Success") {
            window.location.href = "/dashboard";
        } else {
            alert("Invalid Credentials");
        }
    });
}


// ----------------------
// SET BUDGET
// ----------------------
function setBudget() {
    const amount = parseFloat(document.getElementById("budget").value);
    const month = parseInt(document.getElementById("budgetMonth").value);

    if (!amount || !month) {
        alert("Enter budget and month");
        return;
    }

    const budgetData = { amount, month };
    budgets.push(budgetData);

    currentMonth = month;

    updateBudgetDisplay(budgetData);
    updateBalance();

    document.getElementById("budget").value = "";
    document.getElementById("budgetMonth").value = "";
}

function updateBudgetDisplay(newBudget) {
    document.getElementById("totalBudget").innerText = "₹" + newBudget.amount;

    const list = document.getElementById("budgetList");
    const li = document.createElement("li");
    li.textContent = `Month ${newBudget.month} - ₹${newBudget.amount}`;
    list.appendChild(li);
}


// ----------------------
// ADD EXPENSE
// ----------------------
function addExpense() {

    let amount = parseFloat(document.getElementById("amount").value);
    let category = document.getElementById("category").value;
    let month = parseInt(document.getElementById("month").value);

    if (!amount || !category || !month) {
        alert("Please fill all fields");
        return;
    }

    fetch("/add_expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, category, month })
    })
    .then(res => res.json())
    .then(data => {

        alert(data.message);

        currentMonth = month;

        // Update chart data
        monthlyData[month - 1] += amount;

        // Update UI
        updateBalance();

        // Recent Transactions
        let list = document.getElementById("recentList");
        let li = document.createElement("li");
        li.innerText = category + " - ₹" + amount;
        list.prepend(li);

        // Clear inputs
        document.getElementById("amount").value = "";
        document.getElementById("category").value = "";
        document.getElementById("month").value = "";

        if (chart) chart.update();
    });
}


// ----------------------
// LOAD EXPENSES
// ----------------------
function loadExpenses() {

    fetch("/get_expenses")
    .then(res => res.json())
    .then(data => {

        let list = document.getElementById("expenseList");
        list.innerHTML = "";

        monthlyData = [0,0,0,0,0,0,0,0,0,0,0,0];

        data.forEach(e => {

            list.innerHTML += `
                <li>${e.category} - ₹${e.amount} (Month ${e.month})</li>
            `;

            if (e.month >= 1 && e.month <= 12) {
                monthlyData[e.month - 1] += e.amount;
            }
        });

        updateBalance();

        if (chart) {
            chart.data.datasets[0].data = monthlyData;
            chart.update();
        }
    });
}


// ----------------------
// ADD SAVINGS ✅
// ----------------------
function addSaving() {

    const amount = parseFloat(document.getElementById("savingAmount").value);
    const month = parseInt(document.getElementById("savingMonth").value);

    if (!amount || !month) {
        alert("Enter saving amount and month");
        return;
    }

    const savingData = { amount, month };

    savings.push(savingData);

    currentMonth = month;

    updateSavings(savingData);
    updateBalance();

    document.getElementById("savingAmount").value = "";
    document.getElementById("savingMonth").value = "";
}


// ----------------------
// UPDATE SAVINGS
// ----------------------
function updateSavings(newSaving) {

    const list = document.getElementById("savingList");

    const li = document.createElement("li");
    li.textContent = `Month ${newSaving.month} - ₹${newSaving.amount}`;
    list.appendChild(li);

    if (!currentMonth) return;

    let monthSaving = 0;

    savings.forEach(s => {
        if (parseInt(s.month) === currentMonth) {
            monthSaving += s.amount;
        }
    });

    document.getElementById("totalSavings").innerText = "₹" + monthSaving;
}


// ----------------------
// UPDATE BALANCE ✅ FINAL
// ----------------------
function updateBalance() {

    if (!currentMonth) return;

    const budgetData = budgets.find(b => b.month === currentMonth);
    const budget = budgetData ? budgetData.amount : 0;

    let monthExpense = monthlyData[currentMonth - 1] || 0;

    let monthSaving = 0;
    savings.forEach(s => {
        if (parseInt(s.month) === currentMonth) {
            monthSaving += s.amount;
        }
    });

    document.getElementById("totalBudget").innerText = "₹" + budget;
    document.getElementById("totalExpenses").innerText = "₹" + monthExpense;
    document.getElementById("totalSavings").innerText = "₹" + monthSaving;

    let remaining = budget - monthExpense - monthSaving;

    document.getElementById("remainingBalance").innerText = "₹" + remaining;
}


// ----------------------
// AI FORECAST
// ----------------------
function forecast() {
    fetch("/forecast")
    .then(res => res.json())
    .then(data => {
        document.getElementById("prediction").innerText =
            "Predicted Next Month Expense: ₹" + data.prediction;
    });
}


// ----------------------
// CHART
// ----------------------
function loadChart() {

    const ctx = document.getElementById("expenseChart").getContext("2d");

    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
            datasets: [{
                label: "Monthly Expenses",
                data: monthlyData,
                backgroundColor: "pink",
                borderColor: "black",
                borderWidth: 1
            }]
        }
    });

    loadExpenses();
}


// ----------------------
// LOAD
// ----------------------
window.addEventListener("DOMContentLoaded", loadChart);
