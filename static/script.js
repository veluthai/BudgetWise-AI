// ----------------------
// GLOBAL VALUES
// ----------------------
let totalBudget = 0;
let totalExpenses = 0;

// Monthly Chart Data
let monthlyData = [0,0,0,0,0,0,0,0,0,0,0,0];
let chart = null;


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
        body: JSON.stringify({
            username: username,
            email: email,
            password: password
        })
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
    totalBudget = parseFloat(document.getElementById("budget").value) || 0;
    document.getElementById("totalBudget").innerText = "₹" + totalBudget;
    updateBalance();
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
        body: JSON.stringify({
            amount: amount,
            category: category,
            month: month
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);

        // Update totals
        totalExpenses += amount;
        document.getElementById("totalExpenses").innerText = "₹" + totalExpenses;
        updateBalance();

        // Update Monthly Chart
        if (chart) {
            monthlyData[month - 1] += amount;
            chart.update();
        }

        // Recent Transactions
        let list = document.getElementById("recentList");
        if (list) {
            let li = document.createElement("li");
            li.innerText = category + " - ₹" + amount;
            list.prepend(li);
        }

        // Clear inputs
        document.getElementById("amount").value = "";
        document.getElementById("category").value = "";
        document.getElementById("month").value = "";
    });
}


// ----------------------
// LOAD ALL EXPENSES
// ----------------------
function loadExpenses() {
    fetch("/get_expenses")
    .then(res => res.json())
    .then(data => {
        let list = document.getElementById("expenseList");
        if (!list) return;

        list.innerHTML = "";
        totalExpenses = 0;

        // Reset chart data
        monthlyData = [0,0,0,0,0,0,0,0,0,0,0,0];

        if (data.length === 0) {
            list.innerHTML = "<li>No expenses found</li>";
            return;
        }

        data.forEach(e => {
            totalExpenses += e.amount;

            // Add to list
            list.innerHTML += `
                <li>${e.category} - ₹${e.amount} (Month ${e.month})</li>
            `;

            // Update monthly chart data
            if (e.month >= 1 && e.month <= 12) {
                monthlyData[e.month - 1] += e.amount;
            }
        });

        document.getElementById("totalExpenses").innerText = "₹" + totalExpenses;
        updateBalance();

        // Refresh chart
        if (chart) {
            chart.data.datasets[0].data = monthlyData;
            chart.update();
        }
    });
}


// ----------------------
// UPDATE BALANCE
// ----------------------
function updateBalance() {
    let remaining = totalBudget - totalExpenses;
    let el = document.getElementById("remainingBalance");
    if (el) {
        el.innerText = "₹" + remaining;
    }
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
// CHART (Chart.js)
// ----------------------
function loadChart() {
    const canvas = document.getElementById("expenseChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: [
                "Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec"
            ],
            datasets: [{
                label: "Monthly Expenses",
                data: monthlyData,
                backgroundColor: "pink",   // Bar color
                borderColor: "black",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        color: "black"   // X-axis month names
                    },
                    grid: {
                        color: "#e0e0e0"
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: "black"   // Y-axis numbers
                    },
                    grid: {
                        color: "#e0e0e0"
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: "black"   // Legend text
                    }
                }
            }
        }
    });

    // Load existing DB data
    loadExpenses();
}



// Load chart after page loads
window.addEventListener("DOMContentLoaded", loadChart);
