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

    // 🔥 PASSWORD RULE (REGEX)
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{6,}$/;

    // Check password match
    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    // 🔥 VALIDATION CHECK
    if (!passwordRegex.test(password)) {
        alert("Password must contain:\n- At least 1 Uppercase letter\n- At least 1 Special character\n- Minimum 6 characters");
        return;
    }

    // Continue signup
    fetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        if (data.message === "Signup Successful") {
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

    fetch("/set_budget", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ amount, month })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);

        // UI update
        document.getElementById("totalBudget").innerText = "₹" + amount;

        let list = document.getElementById("budgetList");
        let li = document.createElement("li");
        li.innerText = `Month ${month} - ₹${amount}`;
        list.appendChild(li);

        document.getElementById("budget").value = "";
        document.getElementById("budgetMonth").value = "";
    });
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

    fetch("/add_saving", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ amount, month })
    })
    .then(res => res.json())
    .then(data => {

        alert(data.message);

        let list = document.getElementById("savingList");
        let li = document.createElement("li");
        li.innerText = `Month ${month} - ₹${amount}`;
        list.appendChild(li);

        document.getElementById("savingAmount").value = "";
        document.getElementById("savingMonth").value = "";
    });
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
        },

        // 🔥 IMPORTANT PART
        options: {
            scales: {
                x: {
                    ticks: {
                        color: "black"   // X-axis text color
                    },
                    grid: {
                        color: "black"   // X-axis line color
                    }
                },
                y: {
                    ticks: {
                        color: "black"   // Y-axis text color
                    },
                    grid: {
                        color: "black"   // Y-axis line color
                    }
                }
            },

            plugins: {
                legend: {
                    labels: {
                        color: "black" // legend text color
                    }
                }
            }
        }
    });

    loadExpenses();
}


function generateReport() {

    let month = document.getElementById("reportMonth").value;

    if (!month) {
        alert("Select month");
        return;
    }

    fetch(`/get_report/${month}`)
    .then(res => res.json())
    .then(data => {

        document.getElementById("reportBudget").innerText = "₹" + data.budget;
        document.getElementById("reportExpenses").innerText = "₹" + data.expenses;
        document.getElementById("reportSavings").innerText = "₹" + data.savings;
        document.getElementById("reportRemaining").innerText = "₹" + data.remaining;

    });
}




// ----------------------
// LOAD
// ----------------------
window.addEventListener("DOMContentLoaded", loadChart);
