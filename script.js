let items = [];
let members = [];

function addItem() {
    let name = document.getElementById("itemName").value;
    let quantity = parseInt(document.getElementById("itemQuantity").value);
    let price = parseFloat(document.getElementById("itemPrice").value);

    if (!name || quantity <= 0 || price <= 0) return alert("Enter valid item details");

    items.push({ name, quantity, price, remaining: quantity });
    updateItemsTable();
    updateItemDropdown();
}

function updateItemsTable() {
    let tbody = document.querySelector("#itemsTable tbody");
    tbody.innerHTML = "";
    items.forEach(item => {
        let row = tbody.insertRow();
        row.innerHTML = `<td>${item.name}</td><td>${item.quantity}</td><td>MVR ${item.price.toFixed(2)}</td><td>MVR ${(item.quantity * item.price).toFixed(2)}</td>`;
    });
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
    let name = document.getElementById("memberName").value;
    let itemName = document.getElementById("selectItem").value;
    let quantity = parseInt(document.getElementById("assignQuantity").value);

    let item = items.find(i => i.name === itemName);
    if (!name || quantity <= 0 || !item || item.remaining < quantity) return alert("Invalid assignment");

    let cost = quantity * item.price;
    members.push({ name, itemName, quantity, cost });

    item.remaining -= quantity;
    updateMembersTable();
    updateUnclaimedTable();
}

function updateMembersTable() {
    let tbody = document.querySelector("#membersTable tbody");
    tbody.innerHTML = "";
    members.forEach(member => {
        let row = tbody.insertRow();
        row.innerHTML = `<td>${member.name}</td><td>${member.itemName}</td><td>${member.quantity}</td><td>MVR ${member.cost.toFixed(2)}</td>`;
    });
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
