document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('requisitionForm');
    const materialItemsContainer = document.getElementById('materialItems');
    const addItemBtn = document.getElementById('addItemBtn');
    let itemCounter = 0;
    const RECIPIENT_EMAIL = 'ceaves@stmarysugar.com';

    // Function to calculate Total Price
    function calculateTotal(itemId) {
        const quantityInput = document.getElementById(`itemQuantity${itemId}`);
        const unitPriceInput = document.getElementById(`itemUnitPrice${itemId}`);
        const totalPriceInput = document.getElementById(`itemTotalPrice${itemId}`);

        // Treat empty inputs as 0 for calculation, but require them to be filled by 'required' attribute
        const quantity = parseFloat(quantityInput.value) || 0;
        const unitPrice = parseFloat(unitPriceInput.value) || 0;
        
        const total = (quantity * unitPrice).toFixed(2);
        // Format for display with dollar sign
        totalPriceInput.value = total > 0 ? `$${total}` : ''; 
        
        // Store the raw number in a data attribute for easy retrieval later
        totalPriceInput.setAttribute('data-raw-total', total);
    }
    
    // Function to create a new material item fieldset
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
                    <label for="itemAccount${itemId}">Account No.:</label>
                    <input type="text" id="itemAccount${itemId}" name="itemAccount${itemId}" required>
                </div>
                <div>
                    <label for="itemQuantity${itemId}">Quantity:</label>
                    <input type="number" id="itemQuantity${itemId}" name="itemQuantity${itemId}" min="1" step="any" class="calc-input" required>
                </div>
                <div class="description-field">
                    <label for="itemDescription${itemId}">Description:</label>
                    <input type="text" id="itemDescription${itemId}" name="itemDescription${itemId}" required>
                </div>
                <div>
                    <label for="itemUnitPrice${itemId}">Unit Price:</label>
                    <input type="number" id="itemUnitPrice${itemId}" name="itemUnitPrice${itemId}" min="0.01" step="0.01" class="calc-input" required>
                </div>
                <div class="total-price-field">
                    <label for="itemTotalPrice${itemId}">Total Price:</label>
                    <input type="text" id="itemTotalPrice${itemId}" name="itemTotalPrice${itemId}" data-raw-total="0.00" readonly>
                </div>
            </div>
            <button type="button" class="remove-btn" data-item-id="${itemId}">Remove Item</button>
        `;
        materialItemsContainer.appendChild(itemDiv);

        // Add event listeners to trigger calculation on input change
        const quantityInput = document.getElementById(`itemQuantity${itemId}`);
        const unitPriceInput = document.getElementById(`itemUnitPrice${itemId}`);

        quantityInput.addEventListener('input', () => calculateTotal(itemId));
        unitPriceInput.addEventListener('input', () => calculateTotal(itemId));
    }

    // Add initial material item
    createMaterialItem();

    // Event listener for adding new items
    addItemBtn.addEventListener('click', createMaterialItem);

    // Event listener for removing items (using event delegation)
    materialItemsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const itemId = e.target.getAttribute('data-item-id');
            const itemDiv = document.querySelector(`.material-item[data-item-id="${itemId}"]`);
            if (itemDiv) {
                if (materialItemsContainer.querySelectorAll('.material-item').length > 1) {
                    itemDiv.remove();
                } else {
                    alert("You must have at least one material item on the requisition.");
                }
            }
        }
    });

    // Form submission (Email generation)
    form.addEventListener('submit', (e) => {
        e.preventDefault(); 
        
        let grandTotal = 0;
        const formData = {
            date: document.getElementById('date').value,
            department: document.getElementById('department').value,
            requisitionNo: document.getElementById('requisitionNo').value || 'N/A',
            reason: document.getElementById('reason').value,
            requestedBy: document.getElementById('requestedBy').value,
            materials: []
        };

        const materialItems = materialItemsContainer.querySelectorAll('.material-item');
        materialItems.forEach((item) => {
            const id = item.getAttribute('data-item-id');
            
            // Recalculate just in case user changed value without losing focus
            calculateTotal(id); 

            const rawTotal = parseFloat(document.getElementById(`itemTotalPrice${id}`).getAttribute('data-raw-total'));
            grandTotal += rawTotal;
            
            formData.materials.push({
                accountNo: document.getElementById(`itemAccount${id}`).value,
                quantity: document.getElementById(`itemQuantity${id}`).value,
                description: document.getElementById(`itemDescription${id}`).value,
                unitPrice: parseFloat(document.getElementById(`itemUnitPrice${id}`).value).toFixed(2),
                totalPrice: rawTotal.toFixed(2)
            });
        });
        
        // --- 2. Construct Email Body ---
        let emailBody = '--- MATERIAL REQUISITION FORM ---\n\n';
        emailBody += `Date: ${formData.date}\n`;
        emailBody += `Department: ${formData.department}\n`;
        emailBody += `Requisition No.: ${formData.requisitionNo}\n\n`;
        emailBody += `Requested By: ${formData.requestedBy}\n`;
        emailBody += `Reason/Job Description:\n${formData.reason}\n\n`;
        
        emailBody += '--- MATERIALS REQUIRED ---\n';
        // UPDATED HEADER ORDER: Account number | Quantity | Description | Unit Cost | Total Cost
        emailBody += 'Acct No. | Qty | Description                                   | Unit Cost | Total Cost\n';
        emailBody += '----------------------------------------------------------------------------------------\n';
        
        formData.materials.forEach((material) => {
            // Using padding for alignment in the plain text email
            const accNo = material.accountNo.padEnd(8);
            const qty = material.quantity.padStart(3);
            
            // Description takes up more space
            const desc = material.description.padEnd(45).substring(0, 45); 
            
            const uPrice = `$${material.unitPrice}`.padStart(9);
            const tPrice = `$${material.totalPrice}`.padStart(10);
            
            // Constructing the line in the desired order
            emailBody += `${accNo} | ${qty} | ${desc} | ${uPrice} | ${tPrice}\n`;
        });
        
        emailBody += '----------------------------------------------------------------------------------------\n';
        emailBody += `GRAND TOTAL: ${`$${grandTotal.toFixed(2)}`.padStart(75)}\n\n`;
        emailBody += '--- END OF REQUISITION ---';

        // --- 3. Encode and Create Mailto Link ---
        const subject = `Material Requisition - ${formData.department} - ${formData.date}`;
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(emailBody);

        const mailtoLink = `mailto:${RECIPIENT_EMAIL}?subject=${encodedSubject}&body=${encodedBody}`;

        // --- 4. Open Email Client ---
        window.location.href = mailtoLink;
    });
});