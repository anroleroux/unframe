function productsTemplate(state) {
    const productTemplate = (p) => {
        const mr = 'products', api = '/api/products';
        return `
        <div class="product-card product-card--detail">
            <div class="product-card__header">
                <span class="product-card__category">${categoryName(p.category_id)}</span>
                <button class="back-btn" type="button" onclick="products.selected=null;products.editing_field=null">&#8592; Back</button>
            </div>
            <div class="product-card__fields">
                ${editableField(mr, api, 'Name',        'name',        p.name,                      'text')}
                ${editableField(mr, api, 'Category',    'category_id', categoryName(p.category_id), 'select', categories.list.map(c => ({value: c.id, label: c.name})))}
                ${editableField(mr, api, 'Price',       'price',       '$' + p.price.toFixed(2),    'number')}
                ${editableField(mr, api, 'Stock',       'stock',       String(p.stock),             'number')}
                ${editableField(mr, api, 'Description', 'description', p.description,              'text')}
            </div>
            <div class="product-card__actions">
                <button class="delete-btn" type="button" onclick="deleteProduct(products.selected)">Delete</button>
            </div>
        </div>
        `;
    };

    const addFormTemplate = () => `
        <form class="product-card product-card--detail" onsubmit="saveProduct(event)">
            <div class="product-card__header">
                <span class="product-card__category">New product</span>
                <button class="back-btn" type="button" onclick="products.adding=false">&#8592; Cancel</button>
            </div>
            <div class="add-form">
                <div class="add-form__field">
                    <label>Name</label>
                    <input name="name" type="text" required>
                </div>
                <div class="add-form__field">
                    <label>Category</label>
                    <select name="category_id" required>
                        <option value="">Select a category</option>
                        ${categories.list.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
                    </select>
                </div>
                <div class="add-form__field add-form__field--row">
                    <div class="add-form__field">
                        <label>Price</label>
                        <input name="price" type="number" step="0.01" min="0" required>
                    </div>
                    <div class="add-form__field">
                        <label>Stock</label>
                        <input name="stock" type="number" min="0" required>
                    </div>
                </div>
                <div class="add-form__field">
                    <label>Description</label>
                    <textarea name="description"></textarea>
                </div>
            </div>
            <div class="product-card__actions">
                <button class="start-btn" type="submit">Save</button>
            </div>
        </form>
    `;

    const rowTemplate = (p, pid) => `
        <div class="item-row" onclick="selectProduct(${pid})">
            <div class="item-row__main">
                <span class="item-row__name">${p.name}</span>
                <span class="item-row__category">${categoryName(p.category_id)}</span>
            </div>
            <div class="item-row__meta">
                <span class="item-row__price">$${p.price.toFixed(2)}</span>
                <span class="item-row__stock ${p.stock > 0 ? 'in-stock' : 'out-stock'}">${p.stock > 0 ? 'In stock' : 'Out of stock'}</span>
            </div>
        </div>
    `;

    if (state.selected) return productTemplate(state.selected);
    if (state.adding)   return addFormTemplate();
    return `
        <div class="items-toolbar">
            <button class="start-btn" type="button" onclick="products.adding=true">+ Add product</button>
        </div>
        ${state.list.map((sp, spid) => rowTemplate(sp, spid)).join("")}
    `;
}

var products = mount(
    document.getElementById("products-list"),
    {list: [], selected: null, adding: false, editing_field: null},
    productsTemplate
);

function selectProduct(pid) {
    products.selected = products.list[pid];
}

async function deleteProduct(p) {
    //online-start
    try {
        const userId = getCurrentUserId();
        const headers = userId ? { "X-User-Id": userId } : {};
        const response = await fetch(`/api/products/${p.id}`, { method: "DELETE", headers });
        if (!response.ok) throw new Error("Failed to delete product");
    } catch (err) {
        alert("Could not delete product.");
        return;
    }
    //online-end
    const idx = products.list.findIndex(item => item.id === p.id);
    if (idx !== -1) products.list.splice(idx, 1);
    saveLocal("products", products.list);
    products.editing_field = null;
    products.selected = null;
}

async function saveProduct(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
        name:        fd.get("name"),
        category_id: parseInt(fd.get("category_id"), 10),
        price:       parseFloat(fd.get("price")),
        stock:       parseInt(fd.get("stock"), 10),
        description: fd.get("description") || "",
    };

    //online-start
    try {
        const userId = getCurrentUserId();
        const headers = { "Content-Type": "application/json" };
        if (userId) headers["X-User-Id"] = userId;
        const response = await fetch("/api/products", {
            method: "POST",
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to save product");
        const saved = await response.json();
        data.id = saved.id;
    } catch (err) {
        alert("Could not save product.");
        return;
    }
    //online-end
    if (!data.id) data.id = nextLocalId(products.list);
    products.list.push(data);
    saveLocal("products", products.list);
    products.adding = false;
}

async function loadProducts() {
    //online-start
    try {
        const userId = getCurrentUserId();
        const headers = userId ? { "X-User-Id": userId } : {};
        const response = await fetch("/api/products", { headers });
        if (!response.ok) throw new Error("Failed to fetch products");
        products.list = await response.json();
        return;
    } catch (error) {
        document.getElementById("products-list").innerHTML = "<p>Could not load products.</p>";
        return;
    }
    //online-end
    products.list = loadLocal("products");
}
