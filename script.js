let items = JSON.parse(localStorage.getItem("groceryItems")) || [];
let members = JSON.parse(localStorage.getItem("groceryMembers")) || [];
let payments = JSON.parse(localStorage.getItem("groceryPayments")) || {};

function saveData() {
    localStorage.setItem("groceryItems", JSON.stringify(items));
    localStorage.setItem("groceryMembers", JSON.stringify(members));
    localStorage.setItem("groceryPayments", JSON.stringify(payments));
}

function addItem() {
    let name = document.getElementById("itemName").value.trim();
    let quantity = parseInt(document.getElementById("itemQuantity").value);
    let price = parseFloat(document.getElementById("itemPrice").value);

    if (!name || isNaN(quantity) || isNaN(price) || quantity <= 0 || price <= 0) {
        alert("Enter valid item details");
        return;
    }

    items.push({ name, quantity, price, remaining: quantity });
    saveData();
    updateItemsTable();
    updateItemDropdown();

    // Clear input fields
    document.getElementById("itemName").value = "";
    document.getElementById("itemQuantity").value = "";
    document.getElementById("itemPrice").value = "";
}

function updateItemsTable() {
    let tbody = document.querySelector("#itemsTable tbody");
    tbody.innerHTML = "";
    items.forEach((item, index) => {
        let row = tbody.insertRow();
        row.innerHTML = `<td>${item.name}</td><td>${item.quantity}</td><td>MVR ${item.price.toFixed(2)}</td>
                         <td>MVR ${(item.quantity * item.price).toFixed(2)}</td>
                         <td><button onclick="editItem(${index})">Edit</button> <button onclick="deleteItem(${index})">Delete</button></td>`;
    });
}

function editItem(index) {
    let item = items[index];
    let newName = prompt("Enter new item name:", item.name);
    let newQuantity = parseInt(prompt("Enter new quantity:", item.quantity));
    let newPrice = parseFloat(prompt("Enter new price per unit:", item.price));

    if (newName && !isNaN(newQuantity) && !isNaN(newPrice) && newQuantity > 0 && newPrice > 0) {
        items[index] = { name: newName, quantity: newQuantity, price: newPrice, remaining: newQuantity };
        saveData();
        updateItemsTable();
        updateItemDropdown();
    }
}

function deleteItem(index) {
    items.splice(index, 1);
    saveData();
    updateItemsTable();
    updateItemDropdown();
}

function updateItemDropdown() {
    let select = document.getElementById("selectItem");
    select.innerHTML = "";
    items.forEach(item => {
        let option = document.createElement("option");
        option.value = item.name;
        option.textContent = item.name;
        select.appendChild(option);
    });
}

function addMember() {
    let name = document.getElementById("memberName").value.trim();
    let itemName = document.getElementById("selectItem").value;
    let quantity = parseInt(document.getElementById("assignQuantity").value);

    let item = items.find(i => i.name === itemName);
    if (!name || isNaN(quantity) || !item || quantity <= 0 || item.remaining < quantity) {
        alert("Invalid assignment");
        return;
    }

    let cost = quantity * item.price;
    members.push({ name, itemName, quantity, cost });
    
    if (!payments[name]) {
        payments[name] = { total: 0, paid: false };
    }
    payments[name].total += cost;

    item.remaining -= quantity;
    saveData();
    updateMembersTable();
    updateUnclaimedTable();
    updatePaymentsTable();

    // Clear input fields
    document.getElementById("memberName").value = "";
    document.getElementById("assignQuantity").value = "";
}

function updateMembersTable() {
    let tbody = document.querySelector("#membersTable tbody");
    tbody.innerHTML = "";
    members.forEach((member, index) => {
        let row = tbody.insertRow();
        row.innerHTML = `<td>${member.name}</td><td>${member.itemName}</td><td>${member.quantity}</td>
                         <td>MVR ${member.cost.toFixed(2)}</td>
                         <td><button onclick="deleteMember(${index})">Delete</button></td>`;
    });
}

function deleteMember(index) {
    let member = members[index];
    let item = items.find(i => i.name === member.itemName);
    item.remaining += member.quantity;
    delete payments[member.name];
    members.splice(index, 1);
    saveData();
    updateMembersTable();
    updateUnclaimedTable();
    updatePaymentsTable();
}

function updateUnclaimedTable() {
    let tbody = document.querySelector("#unclaimedTable tbody");
    tbody.innerHTML = "";
    items.forEach(item => {
        if (item.remaining > 0) {
            let row = tbody.insertRow();
            row.innerHTML = `<td>${item.name}</td><td>${item.remaining}</td><td>MVR ${(item.remaining * item.price).toFixed(2)}</td>`;
        }
    });
}

function updatePaymentsTable() {
    let tbody = document.querySelector("#paymentsTable tbody");
    tbody.innerHTML = "";
    for (let member in payments) {
        let row = tbody.insertRow();
        row.innerHTML = `<td>${member}</td><td>MVR ${payments[member].total.toFixed(2)}</td>
                        <td>${payments[member].paid ? "Paid" : "<button onclick='markPaid("" + member + "")'>Mark as Paid</button>"}</td>`;
    }
}

function markPaid(member) {
    payments[member].paid = true;
    saveData();
    updatePaymentsTable();
}

function exportCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Member,Item,Assigned Quantity,Cost\n";

    members.forEach(member => {
        csvContent += `${member.name},${member.itemName},${member.quantity},MVR ${member.cost.toFixed(2)}\n`;
    });

    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "members_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Ensure data is loaded on page refresh
updateItemsTable();
updateItemDropdown();
updateMembersTable();
updateUnclaimedTable();
updatePaymentsTable();
