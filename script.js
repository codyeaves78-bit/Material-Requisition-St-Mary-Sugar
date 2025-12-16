document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('requisitionForm');
    const materialItemsContainer = document.getElementById('materialItems');
    const addItemBtn = document.getElementById('addItemBtn');
    let itemCounter = 0;
    const RECIPIENT_EMAIL = ''; 

    function calculateTotal(itemId) {
        const qty = parseFloat(document.getElementById(`itemQuantity${itemId}`).value) || 0;
        const price = parseFloat(document.getElementById(`itemUnitPrice${itemId}`).value) || 0;
        const total = (qty * price).toFixed(2);
        const display = document.getElementById(`itemTotalPrice${itemId}`);
        display.value = total > 0 ? `$${total}` : ''; 
        display.setAttribute('data-raw-total', total);
    }
    
    function createMaterialItem() {
        itemCounter++;
        const itemId = itemCounter;
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('material-item');
        itemDiv.setAttribute('data-item-id', itemId);
        itemDiv.innerHTML = `
            <h3>Item ${itemId}</h3>
            <div class="item-grid">
                <div>
                    <label>Account No.:</label>
                    <input type="text" id="itemAccount${itemId}" required>
                </div>
                <div>
                    <label>Quantity:</label>
                    <input type="number" id="itemQuantity${itemId}" min="1" step="any" required>
                </div>
                <div>
                    <label>Part / Item #:</label>
                    <input type="text" id="itemPartNo${itemId}" placeholder="P-123">
                </div>
                <div class="description-field">
                    <label>Description:</label>
                    <input type="text" id="itemDescription${itemId}" required>
                </div>
                <div>
                    <label>Unit Price:</label>
                    <input type="number" id="itemUnitPrice${itemId}" min="0.01" step="0.01" required>
                </div>
                <div class="total-price-field">
                    <label>Total Price:</label>
                    <input type="text" id="itemTotalPrice${itemId}" data-raw-total="0.00" readonly>
                </div>
            </div>
            <button type="button" class="remove-btn" data-item-id="${itemId}">Remove Item</button>
        `;
        materialItemsContainer.appendChild(itemDiv);

        document.getElementById(`itemQuantity${itemId}`).addEventListener('input', () => calculateTotal(itemId));
        document.getElementById(`itemUnitPrice${itemId}`).addEventListener('input', () => calculateTotal(itemId));
    }

    createMaterialItem();
    addItemBtn.addEventListener('click', createMaterialItem);

    materialItemsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            if (materialItemsContainer.querySelectorAll('.material-item').length > 1) {
                e.target.closest('.material-item').remove();
            } else {
                alert("At least one item is required.");
            }
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault(); 
        let grandTotal = 0;
        const materials = [];

        materialItemsContainer.querySelectorAll('.material-item').forEach((item) => {
            const id = item.getAttribute('data-item-id');
            calculateTotal(id);
            const rawTotal = parseFloat(document.getElementById(`itemTotalPrice${id}`).getAttribute('data-raw-total'));
            grandTotal += rawTotal;

            // CONCATENATION LOGIC HERE:
            const partNo = document.getElementById(`itemPartNo${id}`).value || "N/A";
            const desc = document.getElementById(`itemDescription${id}`).value;
            const combinedDesc = `[${partNo}] ${desc}`; // Formats as: [Part #] Description

            materials.push({
                account: document.getElementById(`itemAccount${id}`).value,
                qty: document.getElementById(`itemQuantity${id}`).value,
                description: combinedDesc,
                unit: parseFloat(document.getElementById(`itemUnitPrice${id}`).value).toFixed(2),
                total: rawTotal.toFixed(2)
            });
        });
        
        let emailBody = '--- MATERIAL REQUISITION ---\n\n';
        emailBody += `Date: ${document.getElementById('date').value}\n`;
        emailBody += `Dept: ${document.getElementById('department').value}\n`;
        emailBody += `Vendor: ${document.getElementById('vendorName').value || 'N/A'}\n`;
        emailBody += `By: ${document.getElementById('requestedBy').value}\n`;
        emailBody += `Reason: ${document.getElementById('reason').value}\n\n`;
        
        emailBody += 'Acct No. | Qty | Description (Part # + Item)                 | Unit Cost | Total Cost\n';
        emailBody += '----------------------------------------------------------------------------------------\n';
        
        materials.forEach((m) => {
            const acc = m.account.padEnd(8);
            const qty = m.qty.padStart(3);
            const desc = m.description.padEnd(45).substring(0, 45); 
            const uCost = `$${m.unit}`.padStart(9);
            const tCost = `$${m.total}`.padStart(10);
            emailBody += `${acc} | ${qty} | ${desc} | ${uCost} | ${tCost}\n`;
        });
        
        emailBody += '----------------------------------------------------------------------------------------\n';
        emailBody += `GRAND TOTAL: ${`$${grandTotal.toFixed(2)}`.padStart(75)}\n\n`;

        window.location.href = `mailto:${RECIPIENT_EMAIL}?subject=Material Requisition - ${document.getElementById('department').value}&body=${encodeURIComponent(emailBody)}`;
    });
});
